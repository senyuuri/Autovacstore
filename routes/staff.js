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
	var staff_list = [];
	// staff recent activities
	var staff_act = [];
	async.parallel({
		one: function(callback){
			// Get staff list
			database.getStaffList(function(err,rows){
				if (err) console.log(err);
				callback(null,rows);
			});		
		},
	},
	// when one & two & three finish
	// results is now equal to: {one: ..., two: ..., three:...}
	function(err, results) {
		staff_list = results['one'];
		async.map(staff_list, getOrderByStaff, function(err,rows){
    		if (err) console.log(err);
    		console.log('async-map',rows);
    		staff_act = rows;
    		res.render('staff', { title: 'Autovacstore', page:'staff', staff_list: staff_list, activity: staff_act,message:req.flash('staffMessage')||null});
		});
	});
	
});

router.get('/delete/:sid',isLoggedIn,function (req, res, next) {
	var sid = req.params.sid;
	//console.log('delete_oid........',oid);
	database.deleteStaffById(sid, function(err,rows){
		if (err){
			console.log("Delete",err);
			req.flash('staffMessage', err);
	  		res.redirect('/staff');
		}
	  	req.flash('staffMessage', 'Delete success.');
	  	res.redirect('/staff');
	})
});

router.get('/pw/:username',isLoggedIn,function (req, res, next) {
	var username = req.params.username;
	res.render('staff_pw', { title: 'Autovacstore', page:'settings', message:req.flash('settingMsg'),username:username});
});

router.post('/pw',urlencodedParser,isLoggedIn,function (req, res, next) {
	var prev_pw = req.body.prev_pw;
	var new_pw = req.body.new_pw;
	var new_pw_confirm = req.body.new_pw_confirm;
	var username = req.body.username;
	database.getPasswordHash(username, function(err,hash){
		if (err) console.log(err);
		if(prev_pw != hash){
			req.flash('settingMsg','Wrong Password.');
			res.redirect('/staff/pw/'+username);
		}else if(new_pw != new_pw_confirm){
			req.flash('settingMsg','Password entered are not identical.');
			res.redirect('/staff/pw/'+username);
		}else{
			database.updateUserPassword(username,new_pw,function(err,rows){
				if (err) console.log(err);
				req.flash('staffMessage','Password update success.');
				res.redirect('/staff');
			});
		};
	});
});


router.get('/add',isLoggedIn,function (req, res, next) {
	res.render('addStaff', {page:'staff',title: 'Autovacstore',message:req.flash('addStaff')||null});
})

router.post('/add',urlencodedParser,isLoggedIn,function (req, res, next) {
	var username = req.body.username;
	var password = req.body.password;
	var con_password = req.body.con_password;
	var realname = req.body.name;
	var contact = req.body.contact;
	database.ifUserExist(username,function(err,rows){
		if (rows.length == 1){
			// if username already been used, show warning
			req.flash('addStaff', 'Username already been used.');
			res.redirect('/staff/add');
		}else{
			if (password != con_password){
				// if password and password cofirm
				req.flash('addStaff', 'Password entered are not identical.');
				res.redirect('/staff/add');
			}else{
				// Add account to database
				database.addStaff(username,password,realname,contact,function(err, rows){
					if (err){
						console.log(err);
						req.flash('addStaff', "An internal error occured. Please contact the system administrator.");
						res.redirect('/staff/add');
					}else{
						res.render('addStaffFinish', { page:'staff',title: 'New account has been created succeessfully. ', 
							content:'This page will automatically redirect to staff list in 3 seconds...'});;
					};
					
				});
			}	
		}
	});
	
})





function getOrderByStaff(raw, callback){
	database.getOrderByStaffId(raw['staff_id'], function(err, rows){
		if (err){
			callback(err);
		}else{
			callback(null, rows);
		}	
	});
};

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
