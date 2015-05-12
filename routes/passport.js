var express = require('express');
var passport = require('passport');
var database = require('../routes/database');
var LocalStrategy   = require('passport-local').Strategy;
var app = express();

var bodyParser = require( 'body-parser' );
app.use( bodyParser.urlencoded({ extended: true }) );


// expose this function to our app using module.exports
module.exports = function(passport) {

	// =========================================================================
	// passport session setup ==================================================
	// =========================================================================
	// required for persistent login sessions
	// passport needs ability to serialize and unserialize users out of session

	// used to serialize the user for the session
	passport.serializeUser(function(username, done) {
		done(null, username);
	});

	// used to deserialize the user
	passport.deserializeUser(function(username, done) {
		//todo findbyid
			done(null, username);
	});
	

	// =========================================================================
	// LOCAL LOGIN
	// =========================================================================
	
	passport.use('local-login',new LocalStrategy({
			usernameField : 'username',
			passwordField : 'password',
			passReqToCallback : true 
		},// allows us to pass back the entire request to the callback
		//test
		/*
		function(req,username, password, done) {
			console.log('strategy:local-login..........start');
			if(username == "admin") {
				if(password == "123456") {
					return done(null, username);
				} else {
					return done(null, false, { message: 'Incorrect password.' });
				}
			} else {
				return done(null, false, { message: 'Incorrect username.' });
			}
		}
	));
	*/
		function(req, username, password, done) {
			console.log('strategy:local-login..........start');
			database.ifUserExist(username, function(err, rows) {
				// if there are any errors, return the error before anything else
				if (err)
					return done(err);
				// if no user is found, return the message
				if (!rows.length)
					return done(null, false, req.flash('loginMessage', 'User not found.')); // req.flash is the way to set flashdata using connect-flash

				
				database.getPasswordHash(username,function(err,rows){
					if(err) throw err;
					hash = rows;
					// if the user is found but the password is wrong
					// TODO: !!!!!!!!!!!!!!!!!
					// change back when signup is done(with bcrypt)
					//if (!database.validPassword(password,hash))
					if(hash != password)
						return done(null, false, req.flash('loginMessage', 'Wrong password.')); // create the loginMessage and save it to session as flashdata

					// all is well, return successful user
					return done(null, rows[0]);
				})
				
			});
		}
	));

	//));

	// =========================================================================
	// LOCAL SIGNUP 
	// =========================================================================
	/*
	passport.use('local',new LocalStrategy({
		// by default, local strategy uses username and password, we will override with email
		usernameField : 'username',
		passwordField : 'password',
		passReqToCallback : true // allows us to pass back the entire request to the callback
	},
	function(req, email, password, done) {

		// asynchronous
		// User.findOne wont fire unless data is sent back
		process.nextTick(function() {

		// find a user whose email is the same as the forms email
		// we are checking to see if the user trying to login already exists
		User.findOne({ 'local.email' :  email }, function(err, user) {
			// if there are any errors, return the error
			if (err)
				return done(err);

			// check to see if theres already a user with that email
			if (user) {
				return done(null, false, req.flash('signupMessage', 'That email is already taken.'));
			} else {

				// if there is no user with that email
				// create the user
				var newUser            = new User();

				// set the user's local credentials
				newUser.local.email    = email;
				newUser.local.password = newUser.generateHash(password);

				// save the user
				newUser.save(function(err) {
					if (err)
						throw err;
					return done(null, newUser);
				});
			}

		});    

		});


	}));
	*/

};