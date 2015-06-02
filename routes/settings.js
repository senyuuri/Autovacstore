var express = require('express');
var router = express.Router();
var passport = require('passport');
var async   = require('async');
var bodyParser = require('body-parser');
var database = require('../routes/database');
require('../routes/passport')(passport);


var jsonParser = bodyParser.json();       // to support JSON-encoded bodies
var urlencodedParser = bodyParser.urlencoded({     // to support URL-encoded bodies
	extended: false
}); 
/* GET staff page. */

router.get('/',isLoggedIn,function (req, res, next) {
	res.render('settings', { title: 'Autovacstore', page:'settings', message:req.flash('settingMsg')});
});


router.post('/',urlencodedParser,isLoggedIn,function (req, res, next) {
	var prev_pw = req.body.prev_pw;
	var new_pw = req.body.new_pw;
	var new_pw_confirm = req.body.new_pw_confirm;
	var username = req.user.username;
	database.getPasswordHash(username, function(err,hash){
		if (err) console.log(err);
		if(prev_pw != hash){
			req.flash('settingMsg','Wrong Password.');
			res.redirect('/settings');
		}else if(new_pw != new_pw_confirm){
			req.flash('settingMsg','Password entered are not identical.');
			res.redirect('/settings');
		}else{
			database.updateUserPassword(username,new_pw,function(err,rows){
				if (err) console.log(err);
				req.flash('settingMsg','Password update success.');
				res.redirect('/settings');
			});
		};
	});
});

function isLoggedIn(req, res, next) {

	// if user is authenticated in the session, carry on
	if (req.isAuthenticated()){	
	// check if the user has admin permission
		if (req.user.role == 'a')
			return next();
		else{
			req.flash('loginMessage', 'ERR: NO PERMISSION');
			res.redirect('/auth')
		}
	// if they aren't redirect them to the home page
	}else{
		req.session.returnTo = req.originalUrl;
		req.flash('loginMessage', 'You have not logged in.');
		res.redirect('/auth')
	};
};


module.exports = router;