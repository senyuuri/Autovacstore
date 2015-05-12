var express = require('express');
var router = express.Router();
var passport = require('passport');
require('../routes/passport')(passport); 

/* GET home page. */
router.route('/')
.get(function (req, res, next) {
	var message = ''
	res.render('login', {message:req.flash('loginMessage')});
})
.post(passport.authenticate('local-login', { successRedirect: '/',
						  failureRedirect: '/login',
							failureFlash : true
		}),
		function (req, res, next) {
		console.log("post callback start");
});


var isAuthenticated = function(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect('/login');
};

/*
//router.get('/:id(\\d+)', function(req, res) {
router.route('/:id').get(function (req, res, next) {
  res.send('respond user Info userid:' + req.params.id);
});

// respond with "Hello World!" on the homepage
router.route('/hello').get(function (req, res, next) {
  res.send('Hello World!');
});
*/

module.exports = router;