var express = require('express');
var bodyParser = require('body-parser');
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
	database.getUndelivered(function(err,rows){
		if (err) console.log(err);
		console.log("============= undelivered.js =============");
		//console.log(rows);
		// conbine products and calculate total payables
		for(var i=0; i<rows.length;i++){
			var record = rows[i];
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
		res.render('undelivered', { title: 'Autovacstore',page:'undelivered',result: result,message:req.flash('editMessage')});
		});		
});

router.get('/delete/:oid',isLoggedIn,function (req, res, next) {
	var oid = req.params.oid;
	//console.log('delete_oid........',oid);
	database.deleteOrderById(oid, function(err,rows){
		if (err){
			console.log("DeleteERR",err);
			req.flash('editMessage', err);
	  		res.redirect('/undelivered');
		}
	  	req.flash('editMessage', 'Delete success.');
	  	res.redirect('/undelivered');
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
		req.flash('loginMessage', 'You have not logged in.');
		res.redirect('/auth')
	};
}



module.exports = router;
