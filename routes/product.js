var express = require('express');
var router = express.Router();
var passport = require('passport');
var async   = require('async');
var database = require('../routes/database');
require('../routes/passport')(passport);

/* GET staff page. */

router.get('/',function (req, res, next) {
	res.render('product', { title: 'Autovacstore', page:'product'});
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
		req.flash('loginMessage', 'You have not logged in.');
		res.redirect('/auth')
	};
}

module.exports = router;
