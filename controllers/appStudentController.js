const mysql = require('mysql');
const bodyParser = require('body-parser');
const session = require('express-session');
const upload = require('express-fileupload');

let mysqlConnection = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: 'abhi@123',
	database: 'mentor_mate_db'

});

let update_check = false;

mysqlConnection.connect(function(err){
	if (!err) console.log('Database connected ...');
	else console.log(err);
});

let urlencodedParser = bodyParser.urlencoded({extended : false});
let message = '';
let m_check = false;
module.exports = function(app){
	app.use(upload());
	app.use(session({secret: 'mentor_mate'}));
	

	app.get('/api/logout' , function(req , res){
		delete req.session.username;
		res.redirect('/api/login');
		console.log(`Logged out...`);
		// req.session.destroy(function(err){

		// 	if(!err)
		// 	{
		// 		res.redirect('/api/login');
		// 		console.log(`Logged out...`);
		// 	} 
		// 	else console.log(err);
		// });
	});


//--------------------------------------------------------------------------
// student section...
	//get picture..
	app.get('/api/user/picture' , function(req , res){
		if (req.session.username){
			let query = 'SELECT * FROM picture';
			mysqlConnection.query(query , function(err , rows , fields){
				if(!err){
					res.render('view_picture' , {picture_data: rows , user_session: req.session.username});
				}
				else console.log(err);
			});
		}
		else{
			res.redirect('/api/login');
		}
	});
	//add profile picture..
	app.post('/api/user/picture' , function(req , res){
		
		if(req.files){
			let picture_yes = false;
			let file = req.files.filename;
			let filename = file.name;
			console.log(filename);
			let query = 'SELECT * FROM picture';
			mysqlConnection.query(query , function(err , rows , fields){
				if(!err){
					for (let i = 0 ; i < rows.length ; i++){
						if(rows[i].username == req.session.username){
							picture_yes = true;
							break;
							
						}
						else{
							picture_yes = false;
						}
					
					}
					if (picture_yes) {
						console.log('update...');
							let query2 = 'UPDATE picture SET picture = ? WHERE username = ?';
							mysqlConnection.query(query2 , [filename , req.session.username] , function(err2 , rows2 , fields2){
								if(!err2){
									file.mv('./public/assets/upload/'+ filename , function(err3){
										if(!err3){
											
											console.log('Picture updated..');
											res.redirect('/api/user/picture');
											//res.render('view_picture' , {picture_data: rows2 , user_session: req.session.username});
											
										}
										else console.log(err3)
									});
								}
								else console.log(err2);
							});
					}
					else if(!picture_yes){
						console.log('insert');
						let query2 = 'INSERT INTO picture(username , picture) VALUES(? , ?)';
						mysqlConnection.query(query2 , [req.session.username , filename] , function(err2 , rows2 , fields2){
							if(!err2){
								file.mv('./public/assets/upload/'+ filename , function(err3){
									if(!err3){
										console.log('Picture uploaded..');
										res.redirect('/api/user/picture');
										//res.render('view_picture' , {picture_data: rows , user_session: req.session.username});
										
									}
									else console.log(err3)
								});
							}
							else console.log(err2);
						});
					}
				}
			});
		}
		
		else{
			res.redirect('/api/login');
		}
	});

	//edit user profile..
	app.get('/api/user/edit' , function(req , res){
		if (req.session.username){
			let query = 'SELECT * FROM user_info';
			mysqlConnection.query(query , function(err , rows , fields){
				if (!err){
					for(let i = 0 ; i < rows.length ; i++){
						if(rows[i].username == req.session.username){
							update_check = true;
							break;
						}
					}
					
					res.render('edit_profile' , {m_check: m_check , update_check: update_check , user_session: req.session.username , data: rows});
					
				}
				else{
					console.log(err);
				}
			});
		}
		else{
			res.redirect('/api/login');
		}
	});

	app.post('/api/user/edit' ,  urlencodedParser, function(req , res){
		if (update_check){
			let query = 'UPDATE user_info SET full_name = ? , address = ? , enrollment_no = ? , contact = ? , dob = ? WHERE username = ?';
			mysqlConnection.query(query , [req.body.name , req.body.address , req.body.enrollment_no , req.body.contact , req.body.dob , req.session.username] , function(err , rows , fields){
				if (!err) {
					res.redirect('/api/user');
					update_check = false;
				}
				else console.log(err);
			});
		}
		else{
			let query = 'INSERT INTO user_info(full_name , address , enrollment_no , contact , dob , username) VALUES(? , ? , ? , ? , ? , ?)';
			mysqlConnection.query(query , [req.body.name , req.body.address , req.body.enrollment_no , req.body.contact , req.body.dob , req.session.username] , function(err , rows , fields){
				if (!err) res.redirect('/api/user');
				else console.log(err);
			});
		}
	});


	//mentor profile ...
	app.get('/api/home/professor/:mentor' , function(req , res){
		if(req.session.username){
			let query = 'SELECT * FROM mentor_info';
			mysqlConnection.query(query , function(err , rows , fields){
				if (!err){
					res.render('mentor_profile' , {mentor: req.params.mentor , data: rows , m_check: m_check , user_session: req.session.username});
				}
				else console.log(err);
			});
		}
		else{
			res.redirect('/api/login');
		}
	});


	//students profile...
	app.get('/api/home/:username' , function(req , res){
		//console.log(req.params.username);
		if (req.session.username){
			if(req.session.username !== req.params.username){
				let query = 'SELECT * FROM user_info';
				mysqlConnection.query(query , function(err , rows , fields){
					if (!err) res.render('student_profile' , {m_check: m_check , student: req.params.username , user_session: req.session.username , data: rows});
					else console.log(err);
				});
			}
			else{
				res.redirect('/api/user');
			}
		}
		else{
			res.redirect('/api/login');
		}
	});

	//user profile...
	app.get('/api/user' , function(req , res){
		if(req.session.username){
			let query = 'SELECT * FROM user_info';
			mysqlConnection.query(query , function(err , rows,  fields){
				if (!err){
					console.log("query1");
					let query2 = 'SELECT * FROM posts ORDER BY id DESC';
					mysqlConnection.query(query2 , function(err2 , rows2 , fields2){
						if(!err2){
							console.log('query2');
							let query3 = 'SELECT * FROM picture';
							mysqlConnection.query(query3 , function(err3 , rows3 , fields3){
								if(!err3){
									console.log('query3');
									let m_check = false;
									res.render('user_profile' , {m_check: m_check , data: rows , post_data: rows2 , picture: rows3  , user_session: req.session.username});
								}
								else{
									console.log(err3);
								}
							});
						}
						else console.log(err2);
					});
				 	
				}
				else console.log(err);
			});
		}
		else{
			res.redirect('/api/login');
		}
	});

	//user ask question input..
	app.post('/api/user' , urlencodedParser, function(req , res){
		
		console.log(req.body);
		let query = 'INSERT INTO posts(username , question , prof , answered) VALUES(? , ? , ? , ?)';
		mysqlConnection.query(query , [req.session.username , req.body.question , req.body.prof , 'no'] , function(err , rows , fields){
			if (!err){
				res.redirect('/api/user');
			}
			else console.log(err);
		});

	});
	//read the post...
	app.get('/api/read/:post_id' , function(req , res){
		if(req.session.username){
			let query = 'SELECT * FROM posts WHERE id = ?';
			mysqlConnection.query(query , [req.params.post_id] , function(err , rows , fields){
				if (!err){
					let query2 = 'SELECT *  FROM comments WHERE post_id = ?';
					mysqlConnection.query(query2 , [req.params.post_id] , function(err2 , rows2 , fields2){
						if(!err2){
							res.render('read_more' , {post_id: req.params.post_id , data: rows , comment_data: rows2 , user_session: req.session.username});
						}
						else console.log(err2);
					});
				}
				else{
					console.log(err);
				}
			});
		}
		else{
			res.redirect('/api/login');
		}
	});

	//comment post..
	app.post('/api/read/:post_id' , urlencodedParser , function(req , res){
		let query = 'SELECT * FROM posts WHERE id = ?';
		mysqlConnection.query(query , [req.params.post_id] , function(err , rows , fields){
			if (!err){
				let query2 = 'INSERT INTO comments(comment_username , comment , post_username , post_id) VALUES(? , ? , ? , ?)';
				mysqlConnection.query(query2 , [req.session.username , req.body.comment , rows[0].username , req.params.post_id] , function(err2 , rows2 , fields2){
					if (!err2){
						url = '/api/read/'+req.params.post_id;
						res.redirect(url);
					}
					else console.log(err2);
				});
			}
			else console.log(err);
		});
	});

	//home...
	app.get('/api/home' , function(req , res){
		if(req.session.username){
			let query = 'SELECT * FROM posts WHERE answered = "yes" ORDER BY id DESC';
			mysqlConnection.query(query , function(err , rows , fields){
				if (!err){
					let query2 = 'SELECT * from comments ORDER BY id DESC';
					mysqlConnection.query(query2 , function(err2 , rows2 , fields2){
						let query3 = 'SELECT * FROM picture where username = ?';
						mysqlConnection.query(query3 , [req.session.username] , function(err3 , rows3 , fields3){
							
							if (!err3) {
								let query4 = 'SELECT * FROM mentor_picture';
								mysqlConnection.query(query4 , function(err4 , rows4 , fields4){
									if(!err4){
										let query5 = 'SELECT * FROM picture';
										mysqlConnection.query(query5 , function(err5 , rows5 , fields5){
											if(!err5){
												console.log(rows3[0].picture);
												res.render('home' , {username: req.session.username , data: rows , comments: rows2 , picture: rows3[0].picture , mentor_picture: rows4 , student_picture: rows5});
											}
										});
									}
								});
							}
							else console.log(err3);
							
						});
						
					});
				}
				else{
					console.log(err);
				}
			});

			
		}
		else{
			res.redirect('/api/login');
		}
		
		
	});

	//sign up...
	app.get('/api/signup' , function(req , res){
		res.render('signup' , {message: message});
		message = '';

	});

	app.post('/api/signup' , urlencodedParser, function(req , res){
		console.log(req.body);
		if (req.body.password === req.body.confirm_password){
			let query = 'INSERT INTO user(username , password) VALUES(? , ?)';
			mysqlConnection.query(query , [req.body.username , req.body.password] , function(err , rows , fields){
				console.log(`signed up as ${req.body.username}...`);
				req.session.username = req.body.username;
				res.redirect('/api/home');
			});
		}
		else {
			message = 'passwords don\'t match..';
			res.redirect('/api/signup');
		}
	});

	//login...
	app.get('/api/login' , function(req , res){

		if (!req.session.username){
			res.render('login' , {message: message});
			message = '';
		}
		else{
			res.redirect('/api/home');
		}
	});

	app.post('/api/login' , urlencodedParser , function(req , res){
		if (!req.session.username){
			//console.log(req.body);
			let query = 'SELECT * FROM user';
			mysqlConnection.query(query, function(err , rows , fields){
				if (!err){
					let found = false;
					for (let i = 0 ; i < rows.length ; i++){
						if (rows[i].username == req.body.username && rows[i].password == req.body.password){
							console.log(`logged in as ${req.body.username}...`);
							req.session.username = req.body.username;

							//console.log(req.session.username);
							res.redirect('/api/home');
							found = true;
							break;
						}
					
					
					}
					if(!found){
						message = 'Invalid user...';
						res.render('login' , {message: message});
						console.log('Invalid user..');
						message = '';
					}


				}
				else{
					console.log(err);
				}
			});
		}

	});

	//test...
	app.get('/api/signup/show' , function(req , res){
		let query = 'SELECT * FROM user';
		mysqlConnection.query(query , function(err , rows , fields){
			res.send(rows);
		});
	});
};

