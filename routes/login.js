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
var LocalStrategy   = require('passport-local').Strategy;
passport.use(new LocalStrategy(
    function(username, password, done) {
        console.log("LocalStrategy working...");
        return done(null, { id: 1, username: 'Joe', password: 'schmo'});
    }
));

router.post('/',urlencodedParser,function(req,res,next){
	console.log(req.body);
});
*/
router.post('/',urlencodedParser,passport.authenticate('local-login', { successRedirect: '/',
      failureRedirect: '/login/loginerror',
      failureFlash: true })
);

router.get('/loginerror',function(req,res) {
    console.log(req.flash('error'));
    //res.redirect('/login');
});
router.route('/')
.get(function (req, res, next) {
	var message = ''
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