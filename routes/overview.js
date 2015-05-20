var express = require('express');
var router = express.Router();
var passport = require('passport');
require('../routes/passport')(passport);

/* GET home page. */

router.get('/',isLoggedIn,function (req, res, next) {
	console.log("REQ_USER:",req.user);
  	res.render('overview', { title: 'Autovacstore', page:'overview'});
});


/* for future reference
//router.get('/:id(\\d+)', function(req, res) {
router.route('/:id').get(function (req, res, next) {
  res.send('respond user Info userid:' + req.params.id);
});
*/


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
