var express = require('express');
var router = express.Router();
var passport = require('passport');
var async   = require('async');
var database = require('../routes/database');
require('../routes/passport')(passport);

/* GET home page. */

router.get('/',isLoggedIn,function (req, res, next) {
	var today = new Date();
	var date_list = [];
	// generate date list for chart
	for(var i=0; i<10; i++){
		date_list.unshift(today.toISOString().split('T')[0].split('-').slice(1,3).join('-'));
		today = new Date(today - 1*24*60*60*1000);
	}
	async.parallel({
		one: function(callback){
			// Get order count in recent 10 days
			database.getOrderCount(function(err,rows){
				if (err) console.log(err);
				callback(null,rows);
			});		
		},
		two: function(callback){
			// Get sales by date - today
			var date = new Date().toISOString().split('T')[0];
			database.getSalesByDate(date, function(err,rows){
				if (err) console.log(err);
				callback(null,rows);
			});		
		},
		three: function(callback){
			// Get sales by date - yesterday
			var date = new Date(new Date() - 1*24*60*60*1000).toISOString().split('T')[0];
			database.getSalesByDate(date, function(err,rows){
				if (err) console.log(err);
				callback(null,rows);
			});		
		},
		four: function(callback){
			// Get recent activities
			// TODO
			callback(null);
		},

	},
	// when one & two & three finish
	// results is now equal to: {one: ..., two: ..., three:...}
	function(err, results) {
		var order_count = parseOrderCount(results['one']);
		var sales_today = calcSalesTotal(results['two']);
		var sales_yesterday = calcSalesTotal(results['three']);
		// process two/sales today
		res.render('overview', { title: 'Autovacstore', page:'overview', date_list: date_list, order_count: order_count, sales_today:sales_today, sales_yesterday:sales_yesterday});
	});
  	
});


/* for future reference
//router.get('/:id(\\d+)', function(req, res) {
router.route('/:id').get(function (req, res, next) {
  res.send('respond user Info userid:' + req.params.id);
});
*/

function parseOrderCount(orders) {
	var order_count = [];
	// initialise data set
	for(var i = 0; i < 10; i ++){
		order_count.push(0);
	};
	// fill in data from query
	for(var j = 0; j < orders.length; j ++){
		var temp = new Date(orders[j].date * 1000);
		// get the difference in days between order created date and current date
		var index = daydiff(temp, new Date());
		order_count[9 - index] = orders[j].count;
	}
	return order_count;
};

function calcSalesTotal(raw){
	var sum = 0;
	if (typeof(raw) != 'undefined'){
		for(var i=0; i<raw.length; i++){
			sum += raw[i].total;
		};
	};
	return sum;
}

function daydiff(first, second) {
    return Math.floor((second-first)/(1000*60*60*24));
}

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
