var express = require('express');
var bodyParser = require('body-parser');
var async   = require('async');
var database = require('../routes/database');
var router = express.Router();
var app = express();

var jsonParser = bodyParser.json();       // to support JSON-encoded bodies
var urlencodedParser = bodyParser.urlencoded({     // to support URL-encoded bodies
	extended: false
}); 


router.get('/',isLoggedIn,function (req, res, next) {
	var result = [];
	// record orders that have been processed
	var oFilter = [];
	// Get product list
	// Refer to one
	var limit = 0;

	var curr_page = 1;
	if (req.query.curr_page != null){
		curr_page = req.query.curr_page;
	};

	async.series({
		one: function(callback){
			database.getPageRange2(curr_page, function(err,rows){
				if (err) console.log(err);
				//Get a list of orders on the given page
				//Calculate offset for the retrival of all relevent records in Stage 2
				var pageList = rows;
				for(var i=0;i<pageList.length;i++){
					limit += pageList[i]['count'];
				};
				console.log('curr_page',curr_page,'   limit',limit);
				callback(null,rows);
			});
		},
		two: function(callback){
			database.getDelivered(curr_page,limit,function(err,rows){
				if (err) console.log(err);
				callback(null,rows);
			});
		},
		three: function(callback){
			database.getTotalPage2(function(err,rows){
				if (err) console.log(err);
				callback(null,rows);
			});
		}
	},
	// when one & two & three finish
	// results is now equal to: {one: ..., two: ..., three:...}
	function(err, results) {
		if (err) console.log(err);
		var orders = results['two'];
		var total = results['three'];

		// conbine products and calculate total payables
		for(var i=0; i<orders.length;i++){
			var record = orders[i];
			// if the order has not been processed
			if (oFilter.indexOf(record['order_id']) == -1){
				oFilter.push(record['order_id']);
				var items = record['product_name']+'('+record['qty']+')';
				result.push({'order_id':record['order_id'],
							'tracking_id':record['tracking_id'],
							'status':record['status'],
							'customer':record['name'],
							'customer_id':record['customer_id'],
							'staff':record['realname'],
							'staff_id':record['de_staff'],
							'items':items,
							'total':record['total']
							});
			}
			// if orders with the same order_id have been processed
			else{
				// modify last record
				result[result.length-1]['items'] += ',' +record['product_name']+'('+record['qty']+')';
				result[result.length-1]['total'] += record['total']
			};
		};
		//console.log('=======================');
		//console.log(result);
		res.render('delivered', { title: 'Autovacstore',page:'delivered',result: result, message:req.flash('editMessage'),curr_page:curr_page,total:total});
	});	

});


router.get('/delete/:oid',isLoggedIn,function (req, res, next) {
	var oid = req.params.oid;
	//console.log('delete_oid........',oid);
	database.deleteOrderById(oid, function(err,rows){
		if (err){
			console.log("DeleteERR",err);
			req.flash('editMessage', err);
	  		res.redirect('/delivered');
		}
	  	req.flash('editMessage', 'Delete success.');
	  	res.redirect('/delivered');
	})
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
