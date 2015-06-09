var express = require('express');
var bodyParser = require('body-parser');
var database = require('../routes/database');
var router = express.Router();
var app = express();
var jsonParser = bodyParser.json();       // to support JSON-encoded bodies
var urlencodedParser = bodyParser.urlencoded({     // to support URL-encoded bodies
	extended: false
}); 


router.get('/:tid',function (req, res, next) {
	var tracking_id = req.params.tid;
	database.getOrderByTrackingId(tracking_id,function(err,rows){
		if (err) console.log(err);
		result = digestResult(rows)[0];
		//console.log('TrackingQueryResult',result);
		//console.log(result.tracking_id, result.customer_contact);
		//if (result.tracking_id == tracking_id && result.customer_contact == contact){
		if (typeof(result)!='undefined'){
			// if both info are correct
			res.render('receipt', { title: 'Autovacstore', page:'overview',result:result});
		}
		else{
			res.write('ERR: Record not found');
		};
	});
});


var digestResult = function(rows){
	var result = [];
	var oFilter = [];
	var total_price=0.0;
	for(var i=0; i<rows.length;i++){
		var record = rows[i];
		// if the order has not been processed
		if (oFilter.indexOf(record['order_id']) == -1){
			oFilter.push(record['order_id']);
			// INFO:
			// items difiniton differ from that in delivered.js/undelivered.js
			// here:           product_id + qty
			// delivered.js:   product_name + qty
			var items = [];
			total_price += record['total'];
			items.push({'pid': record['product_id'],
						'name': record['product_name'],
						'qty': record['qty'],
						'price': record['price'],
						'total':record['total']});
			result.push({'order_id':record['order_id'],
						'tracking_id':record['tracking_id'],
						'status':record['status'],
						'customer':record['name'],
						'customer_id':record['customer_id'],
						'customer_contact':record['contact'],
						'customer_address':record['address'],
						'staff':record['realname'],
						'staff_contact':record['s_contact'],
						'staff_id':record['de_staff'],
						'created':record['created'],
						'items':items,
						'total_price':total_price
						});
		}
		// if orders with the same order_id have been processed
		else{
			// modify last record
			result[result.length-1]['items'].push({'pid': record['product_id'],
													'name': record['product_name'],
													'qty': record['qty'],
													'price': record['price'],
													'total':record['total']});
			result[result.length-1]['total_price'] += record['total'];
		};

	};
	return result;
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
