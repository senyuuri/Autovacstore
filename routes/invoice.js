var express = require('express');
var bodyParser = require('body-parser');
var database = require('../routes/database');
var router = express.Router();
var app = express();

var jsonParser = bodyParser.json();       // to support JSON-encoded bodies
var urlencodedParser = bodyParser.urlencoded({     // to support URL-encoded bodies
	extended: false
}); 


router.get('/',isLoggedIn,function (req, res, next) {
	res.render('receipt', {page:'addorder',title: 'Autovacstore'});
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
}



module.exports = router;