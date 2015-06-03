var express = require('express');
var bodyParser = require('body-parser');
var database = require('../routes/database');
var router = express.Router();
var app = express();
// http://nodejs.org/api.html#_child_processes
var sys = require('sys')
var exec = require('child_process').exec;
var child;
var phantom = require('phantom');


var jsonParser = bodyParser.json();       // to support JSON-encoded bodies
var urlencodedParser = bodyParser.urlencoded({     // to support URL-encoded bodies
	extended: false
}); 

// Phantom.js init
//var webPage = require('webpage');
//var page = webPage.create();


router.get('/',function (req, res, next) {
	// executes `pwd'
	child = exec("pwd", function (error, stdout, stderr) {
		console.log('stdout: ' + stdout);
		console.log('stderr: ' + stderr);
		if (error !== null) {
		  console.log('exec error: ' + error);
		}
	});

	phantom.create(function (ph) {
		ph.createPage(function (page) {
			page.open("http://www.google.com", function (status) {
					console.log("opened google? ", status);
					page.evaluate(function () { return document.title; }, function (result) {
						console.log('Page title is ' + result);
						ph.exit();
					});
			});
	  });
	});

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
