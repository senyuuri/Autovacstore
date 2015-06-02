var express = require('express');
var router = express.Router();
var passport = require('passport');
require('../routes/passport')(passport); 
var bodyParser = require( 'body-parser' );
var app = express();

var jsonParser = bodyParser.json();       // to support JSON-encoded bodies
var urlencodedParser = bodyParser.urlencoded({     // to support URL-encoded bodies
	extended: false
}); 

/*

router.post('/',urlencodedParser,passport.authenticate('local-login', { successRedirect: '/',
	  failureRedirect: '/auth',
	  failureFlash: true })
);
*/
router.post('/',urlencodedParser,function(req, res, next) {passport.authenticate('local-login',  function(err, user, info) {
	    if (err) { return next(err); }
	    if (!user) { return res.redirect('/auth'); }
	    req.logIn(user, function(err) {
		    if (err) { return next(err); }
		    // redirect to referer page
		   	res.redirect(req.session.returnTo || '/');
		});
  	})(req, res, next)
});




router.get('/loginerror',function(req,res) {
	console.log(req.flash('error'));
	//res.redirect('/login');
});

router.get('/logout',function(req,res) {
	req.session.returnTo = '/'
	req.logout();
	req.flash('loginMessage', 'You have successfully logged out.')
	res.redirect('/auth');
});

router.route('/')
.get(function (req, res, next) {
	var message = '';
	res.render('login', {message:req.flash('loginMessage')});
})
/*
.post(passport.authenticate('local-login', { successRedirect: '/',
						  failureRedirect: '/login',
							failureFlash : true
		}),
		function (req, res, next) {
		console.log("post callback start");

});
*/



module.exports = router;