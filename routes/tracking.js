var express = require('express');
var bodyParser = require('body-parser');
var router = express.Router();
var passport = require('passport');
var database = require('../routes/database');
require('../routes/passport')(passport);

var jsonParser = bodyParser.json();       // to support JSON-encoded bodies
var urlencodedParser = bodyParser.urlencoded({     // to support URL-encoded bodies
	extended: false
}); 

/* GET home page. */

router.get('/',function (req, res, next) {
  	res.render('tracking', { title: 'Autovacstore', page:'overview'});
});

router.post('/',urlencodedParser,function (req, res, next) {
	console.log(req.body);
	var tracking_id = req.body.tracking;
	var contact = req.body.contact;
	console.log('POST:',tracking_id,contact);

	database.getOrderByTrackingId(tracking_id,function(err,rows){
		if (err) console.log(err);
		result = digestResult(rows)[0];
		//console.log('TrackingQueryResult',result);
		//console.log(result.tracking_id, result.customer_contact);
		//if (result.tracking_id == tracking_id && result.customer_contact == contact){
		if (typeof(result)!='undefined'){
			// if both info are correct
			var message = "Query success. 1 record(s) found."
			res.render('tracking', { title: 'Autovacstore', page:'overview',message: message, result:result,found:true});
		}
		else{
			var message = "No record found. Please check if you have entred the correct tracking id and phone number."
			res.render('tracking', { title: 'Autovacstore', page:'overview',message: message, result:null,found:false});
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
			result.push({'order_id':'/'+record['order_id'],
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


module.exports = router;
