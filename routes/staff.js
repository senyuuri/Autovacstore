var express = require('express');
var router = express.Router();
var passport = require('passport');
var async   = require('async');
var database = require('../routes/database');
require('../routes/passport')(passport);


/* GET staff page. */

router.get('/',function (req, res, next) {
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
		});

		res.render('staff', { title: 'Autovacstore', page:'staff', staff_list: staff_list, activity: staff_act});
	});
	
});


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
		req.flash('loginMessage', 'You have not logged in.');
		res.redirect('/auth')
	};
}

module.exports = router;
