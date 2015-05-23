var express = require('express');
var async   = require('async');
var bodyParser = require('body-parser');
var database = require('../routes/database');
var router = express.Router();
var app = express();

var jsonParser = bodyParser.json();       // to support JSON-encoded bodies
var urlencodedParser = bodyParser.urlencoded({     // to support URL-encoded bodies
	extended: false
}); 


router.get('/',isLoggedIn,function (req, res, next) {
	var products = [];
	var postmen = [];
	// Get product list
	database.getProductList(function(err,rows){
		if (err) console.log(err);
  		console.log("addOrder.js:console")
  		products = rows;
  		// Get delivery man list
		database.getPostmanList(function(err,rows2){
			// TODO: query individual's status
			if (err) console.log(err);
  			postmen = rows2;
  			console.log("postmen",postmen);
			res.render('addOrder', {page:'addorder',title: 'Autovacstore', plist: products, staff: postmen, result:[{order_id:'/NA'}],edit:false});
		});		
	});

});

router.post('/:oid',isLoggedIn,urlencodedParser, function (req, res, next) {
	if (!req.body) return res.sendStatus(400);
	var is_edit = req.body.edit;
	var tracking_id = '';
	// set default status as 'r'- received
	var status = 'r';
	var oid = req.params.oid;

	async.series({
		one: function(callback){
			// If in edit mode
			if (is_edit=='true'){
				// Delete original post
				database.deleteOrderById(oid, function(err,rows){
					if (err) console.log("DeleteERR",err);
					console.log("EDIT.......original post has been succeessfully deleted.");
					//callback(null,rows);
					callback(null,rows);
				});
			}else
				callback(null);
		},
		two: function(callback){
			if (is_edit=='true'){
				// Delete original post
				database.getTrackingById(oid,function(err,tracking){
  					if (err) console.log(err);
  					tracking_id = tracking;
  					callback(null,tracking);
  				});
			}else
				callback(null);
		},
		three: function(callback){
			if (is_edit=='true'){
				database.getStatusById(oid, function(err, sta){
  					status = sta;
  					console.log("EditMode: USE ", tracking_id, status);
  					callback(null,sta);
  				});
			}else
				callback(null);
		},
	},
	// when one & two & three finish
	// results is now equal to: {one: ..., two: ..., three:...}
	function(err, results) {
		console.log('!!!!!!!!results',results);
		// filter: list of known POST key varibles
		var filter = ['staff','name','contact','address','edit'];
		var staff = '';
		var name = '';
		var contact = '';
		var address = '';
		// order items in [product_id, qty] pairs
		var items = [];
		staff = req.body.staff;
		name = req.body.name;
		contact = req.body.contact;
		address = req.body.address;
		/*
		console.log("POST PACKET CONTENTS:");
		console.log("=========================");
		console.log('delivery_staff......',staff);
		console.log('name......',name);
		console.log('contact......',contact);
		console.log('address......',address);
		*/
		// read order quantity
		for(var key in req.body){
			var value = req.body[key];
			// if not preset field --> it's an order field
			if (filter.indexOf(key) == -1){
				var pid = key.split('-')[1];
				console.log('pid...',pid,'....',value);
				items.push([pid,value]);
			};
		};
		console.log('items',items);
		// Definition
		// exports.addOrderSubmit = function(status,staff_id,name,contact,address,items,cb){}
		database.addOrderSubmit(status,staff,name,contact,address,items,tracking_id,function(err,result){
			console.log('return to addOrder.js');
			if (err){
				console.log(err);
				res.render('addOrderFinish', { page:'addorder',title: 'ERROR', content: err+' Please contact administrator.'});
			};
			res.render('addOrderFinish', { page:'addorder',title: 'Your order has been succeessfully added.', 
					content:'This page will automatically redirect to order list in 3 seconds...'});
		});
	});

	
});

//TODO
router.get('/edit/:oid',isLoggedIn,function (req, res, next) {
	var result = [];
	var oFilter = [];
	var oid = req.params.oid;
	console.log("WOCAO!!!!!!!");

	async.series({
		one: function(callback){
			database.getProductList(function(err,rows){
				callback(null,rows);
			}) 
		},
		two: function(callback){
			// 2) fn getAutoIncrementID: get customer id
			database.getPostmanList(function(err,rows){
				callback(null,rows);
			})
		},
		three: function(callback){
			database.getOrderById(oid, function(err,rows){
				callback(null,rows);
			})
		},
	},
	// when one & two & three finish
	// results is now equal to: {one: ..., two: ..., three:...}
	function(err, results) {
		console.log("BACK---->Edit");
		if (err) console.log(err);
		var products = results['one'];
		var postmen = results['two'];
		var rows = results['three'];

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
				items.push({'pid': record['product_id'],
							'qty': record['qty']});
				result.push({'order_id':'/'+record['order_id'],
							'tracking_id':record['tracking_id'],
							'status':record['status'],
							'customer':record['name'],
							'customer_id':record['customer_id'],
							'customer_contact':record['contact'],
							'customer_address':record['address'],
							'staff_id':record['de_staff'],
							'items':items,
							});
			}
			// if orders with the same order_id have been processed
			else{
				// modify last record
				result[result.length-1]['items'].push({'pid': record['product_id'],
														'qty': record['qty']});
			};
		};
		//console.log('=======================');
		//console.log(result);
		// get referer in http head,set sidebar highlight accordingly
		var referer = req.headers.referer.split('/');
		referer = referer[referer.length-1];
		if (referer=='undelivered')
			res.render('addOrder',{page:'undelivered',title: 'Autovacstore', plist: products, staff: postmen, result:result,edit:true});
		else
			res.render('addOrder',{page:'delivered',title: 'Autovacstore', plist: products, staff: postmen, result:result,edit:true});
	});

	
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