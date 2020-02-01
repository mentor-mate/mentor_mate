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
let m_check = true;
module.exports = function(app){
	app.use(upload());
	app.use(session({secret: 'mentor_mate'}));

	
	app.get('/api/mentor/logout' , function(req , res){
		delete req.session.mentor_username;
		res.redirect('/api/mentor/login');
		console.log(`Logged out...`);
		// req.session.destroy(function(err){
		// 	if(!err)
		// 	{
		// 		res.redirect('/api/mentor/login');
		// 		console.log(`Logged out...`);
		// 	} 
		// 	else console.log(err);
		// });
	});
//-------------------------------------------------------------------------
//mentor section...
	
	//get profile picture...
	app.get('/api/mentor/user/picture' , function(req , res){
		if (req.session.mentor_username){
			let query = 'SELECT * FROM mentor_picture';
			mysqlConnection.query(query , function(err , rows , fields){
				if(!err){
					res.render('mentor_view_picture' , {picture_data: rows , mentor_session: req.session.mentor_username});
				}
				else console.log(err);
			});
		}
		else{
			res.redirect('/api/mentor/login');
		}
	});
	//add profile picture..
	app.post('/api/mentor/user/picture' , function(req , res){
		
		if(req.files){
			let picture_yes = false;
			let file = req.files.filename;
			let filename = file.name;
			console.log(filename);
			let query = 'SELECT * FROM mentor_picture';
			mysqlConnection.query(query , function(err , rows , fields){
				if(!err){
					for (let i = 0 ; i < rows.length ; i++){
						if(rows[i].username == req.session.mentor_username){
							picture_yes = true;
							break;
							
						}
						else{
							picture_yes = false;
						}
					
					}
					if (picture_yes) {
						console.log('update...');
							let query2 = 'UPDATE mentor_picture SET picture = ? WHERE username = ?';
							mysqlConnection.query(query2 , [filename , req.session.mentor_username] , function(err2 , rows2 , fields2){
								if(!err2){
									file.mv('./public/assets/upload/'+ filename , function(err3){
										if(!err3){
											
											console.log('Picture updated..');
											res.redirect('/api/mentor/user/picture');
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
						let query2 = 'INSERT INTO mentor_picture(username , picture) VALUES(? , ?)';
						mysqlConnection.query(query2 , [req.session.mentor_username , filename] , function(err2 , rows2 , fields2){
							if(!err2){
								file.mv('./public/assets/upload/'+ filename , function(err3){
									if(!err3){
										console.log('Picture uploaded..');
										res.redirect('/api/mentor/user/picture');
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
			res.redirect('/api/mentor/login');
		}
	});

					
	

	//edit mentor info..
	app.get('/api/mentor/user/edit' , function(req , res){
		if (req.session.mentor_username){
			let query = 'SELECT * FROM mentor_info';
			mysqlConnection.query(query , function(err , rows , fields){
				if (!err){
					for(let i = 0 ; i < rows.length ; i++){
						if(rows[i].username == req.session.mentor_username){
							update_check = true;
							break;
						}
					}
					
					res.render('edit_profile' , {m_check: m_check , update_check: update_check , mentor_session: req.session.mentor_username , mentor_data: rows});
					update_check = false;
				}
				else{
					console.log(err);
				}
			});
		}
		else{
			res.redirect('/api/mentor/login');
		}
	});

	app.post('/api/mentor/user/edit' ,  urlencodedParser, function(req , res){
		if (update_check){
			let query = 'UPDATE mentor_info SET full_name = ? , address = ? , prof_id = ? , contact = ? , dob = ? WHERE username = ?';
			mysqlConnection.query(query , [req.body.name , req.body.address , req.body.prof_id , req.body.contact , req.body.dob , req.session.mentor_username] , function(err , rows , fields){
				if (!err) res.redirect('/api/mentor/user');
				else console.log(err);
			});
		}
		else{
			let query = 'INSERT INTO mentor_info(full_name , address , prof_id , contact , dob , username) VALUES(? , ? , ? , ? , ? , ?)';
			mysqlConnection.query(query , [req.body.name , req.body.address , req.body.prof_id , req.body.contact , req.body.dob , req.session.mentor_username] , function(err , rows , fields){
				if (!err) res.redirect('/api/mentor/user');
				else console.log(err);
			});
		}
	});

	//mentor profile..
	app.get('/api/mentor/user' , function(req , res){
		if (req.session.mentor_username){
			let query = 'SELECT * FROM posts WHERE answered = "yes" ORDER BY id DESC';
			mysqlConnection.query(query , function(err , rows , fields){
				if (!err){
					let query2 = 'SELECT * FROM mentor_info';
					mysqlConnection.query(query2 , function(err2 , rows2 , fields2){
						if(!err2){

							let query3 = 'SELECT * FROM mentor_picture';
							mysqlConnection.query(query3 , function(err3 , rows3 , fields3){
								if(!err3){
									console.log('query3');
									let m_check = true;
									res.render('user_profile' , {m_check: m_check , mentor_data: rows2 , post_data: rows  , picture: rows3, mentor_session: req.session.mentor_username});
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
			res.redirect('/api/mentor/login');
		}
	});


	//student page for mentor..
	app.get('/api/mentor/home/student/:student' , function(req , res){
		if (req.session.mentor_username){
			let query = 'SELECT * FROM user_info';
			mysqlConnection.query(query , function(err , rows , fields){
				if (!err){

					res.render('student_profile' , {m_check: m_check ,student: req.params.student , data: rows , mentor_session: req.session.mentor_username});
				}
				else console.log(err);
			});
		}
		else res.redirect('/api/mentor/login');
	});


	//mentor answer page..
	app.get('/api/mentor/home/:post_id' , function(req , res){
		if (req.session.mentor_username){
			let query = 'SELECT * FROM posts WHERE id = ?';
			mysqlConnection.query(query , [req.params.post_id] , function(err , rows , fields){
				// let query2 = 'SELECT * FROM user_info WHERE username = ?';
				// mysqlConnection.query(query2 , [rows[0].username] , function(err2 , rows2 , fields2){
				// 	res.render('answer' , {post_data: rows})
				// });
				if (!err){
					res.render('answer' , {mentor_session: req.session.mentor_username , post_data: rows});
				}
				else console.log(err);
			});
		}
		else{
			res.redirect('/api/mentor/login');
		}
	});

	app.post('/api/mentor/home/:post_id' , urlencodedParser , function(req , res){
		let query = 'UPDATE posts SET solution = ? , answered = "yes" WHERE id = ?';
		mysqlConnection.query(query , [req.body.solution , req.params.post_id] , function(err , rows , fields){
			if (!err){
				res.redirect('/api/mentor/home');
			
			}
			else console.log(err);
		});
	});

	//other mentors profile page
	app.get('/api/mentor/home/professor/:mentor' , function(req , res){
		if(req.session.mentor_username){
			let query = 'SELECT * FROM mentor_info';
			mysqlConnection.query(query , function(err , rows , fields){
				if (!err){
					res.render('mentor_profile' , {mentor: req.params.mentor , data: rows , m_check: m_check , mentor_session: req.session.mentor_username});
				}
				else console.log(err);
			});
		}
		else{
			res.redirect('/api/login');
		}
	});

	//mentor home ...
	app.get('/api/mentor/home' , function(req , res){
		if(req.session.mentor_username){
			let query = 'SELECT * FROM posts WHERE answered = "no" ORDER BY id DESC';
			mysqlConnection.query(query , function(err , rows , fields){
				if (!err){
					res.render('mentor_home' , {username: req.session.mentor_username , data: rows});
				}
				else console.log(err);
			});

			
		}
		else{
			res.redirect('/api/mentor/login');
		}
		
		
	});


	app.post('/api/mentor/home' , urlencodedParser , function(req , res){
		console.log(req.body);
		

		
	});

	//mentor login ..
	app.get('/api/mentor/login' , function(req , res){

		if (!req.session.mentor_username){
			res.render('mentor_login' , {message: message});
			message = '';
		}
		else{
			res.redirect('/api/mentor/home');
		}
	});

	app.post('/api/mentor/login' , urlencodedParser , function(req , res){
		if (!req.session.mentor_username){
			//console.log(req.body);
			let query = 'SELECT * FROM mentor';
			mysqlConnection.query(query, function(err , rows , fields){
				if (!err){
					let found = false;
					for (let i = 0 ; i < rows.length ; i++){
						if (rows[i].username == req.body.username && rows[i].password == req.body.password){
							console.log(`logged in as Prof. ${req.body.username}...`);
							req.session.mentor_username = req.body.username;
							res.redirect('/api/mentor/home');
							found = true;
							break;
						}
					
					
					}
					if(!found){
						message = 'Invalid user...';
						res.render('mentor_login' , {message: message});
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

	//mentor sign up...
	app.get('/api/mentor/signup' , function(req , res){
		res.render('mentor_signup' , {message: message});
		message = '';

	});

	app.post('/api/mentor/signup' , urlencodedParser, function(req , res){
		console.log(req.body);
		if (req.body.password === req.body.confirm_password){
			let query = 'INSERT INTO mentor(username , password) VALUES(? , ?)';
			mysqlConnection.query(query , [req.body.username , req.body.password] , function(err , rows , fields){
				console.log(`signed up as Prof. ${req.body.username}...`);
				req.session.mentor_username = req.body.username;
				res.redirect('/api/mentor/home');
			});
		}
		else {
			message = 'passwords don\'t match..';
			res.redirect('/api/mentor/signup');
		}
	});

};