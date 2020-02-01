const session = require('express-session');
let message = ""
module.exports = function(app){
	app.use(session({secret: 'mentor_mate'}));

	app.get('/api/mentor_mate' , function(req , res){
		res.render('main_page');
	});
	app.get('/api/login' , function(req , res){
		
		if (!req.session.username){
			res.render('login' , {message: message});
			message = '';
		}
		else{
			res.redirect('/api/home');
		}
	});
	

	app.get('/api/mentor/login' , function(req , res){
		if (!req.session.mentor_username){
			res.render('mentor_login' , {message: message});
			message = '';
		}
		else{
			res.redirect('/api/mentor/home');
		}
	});

}