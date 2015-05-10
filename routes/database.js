var express = require('express');
var exports = module.exports = {};
var mysql   = require('mysql');
var async   = require('async');
var connection = mysql.createConnection({
  host     : process.env.OPENSHIFT_MYSQL_DB_HOST || "127.0.0.1",
  port     : process.env.OPENSHIFT_MYSQL_DB_PORT || 3306,
  user     : process.env.OPENSHIFT_MYSQL_DB_USERNAME || 'admin9dbD4cT',
  password : process.env.OPENSHIFT_MYSQL_DB_PASSWORD || 'e3lc8i8ftG4F'
});


connection.connect(function(err) {
	if (err) {
		console.error('error connecting: ' + err.stack);
		return;
	}

	console.log('connected as id ' + connection.threadId);
});

connection.query('USE nodejs', function(err, rows) {
	if (err) throw err;
	console.log('SelectedDB: nodejs');
});


exports.getProductList = function(cb){
	connection.query('SELECT product_id, name FROM products', function(err, rows){
	  if (err) return cb(err);
	  console.log("DB_GET: getProductList");
	  cb(null,rows);
	});
};

exports.getPostmanList = function(cb){
	connection.query('SELECT staff_id, realname FROM staff', function(err, rows){
	  if (err) return cb(err);
	  console.log("DB_GET: getStaffList");
	  cb(null,rows);
	});
};

exports.getProductPrice = function(product_id,cb){
	connection.query('SELECT price FROM products where product_id= ?',product_id ,function(err, rows){
	  if (err) return cb(err);
	  console.log("DB_GET: getProductPrice",product_id,".....",rows);
	  cb(null,rows);
	});
}

/* FOR addOrder.js POST method

   Usage: use database.addOrder(tracking_id,status,staff_id,name,contact,address,[item list],callback)

   Internal Steps:  STAGE 1 (obtaining necessary info for stage 2)
   					1) ft AddCustomer: customer info --> table: costomers 
					2) fn getAutoIncrementID: get customer id
					3) fn genTrackingID: random 6-char string
					STAGE 2
					4) fn AddOrder: order info --> table: orders
					5) fn getAutoIncrementID: get order id
					6) fn AddItem: order_id + items detail --> table: items
*/
exports.addOrderSubmit = function(status,staff_id,name,contact,address,items,cb){
	// V2.0, rewrote using async library
	// async doc ref: https://github.com/caolan/async#seriestasks-callback
	// ============  STAGE 1 ============  
	async.series({
	    one: function(callback){
	    	// 1) fn AddCustomer: customer info --> table: costomers 
	    	exports.addCustomer(name,contact,address,function(err,rows){
	        	callback(null,rows);
	    	})
	    },
	    two: function(callback){
	    	// 2) fn getAutoIncrementID: get customer id
			exports.getAutoIncrementID(function(err,rows){
	        	callback(null,rows);
	        })
	    },
	    three: function(callback){
	    	// 3) fn genTrackingID: random 6-char string
			exports.genTrackingID(function(err,text){
				callback(null,rows);
			})
	    },
	},
	// when one & two & three finish
	// results is now equal to: {one: ..., two: ..., three:...}
	function(err, results) {
		if (err) cb(err);
		console.log("one+two+three result..........",results);
		var customer_id = results['two'];
		var tracking_id = results['three'];

		// ============  STAGE 2 ============  
		// async.waterfall: 
		// 	 Runs the tasks array of functions in series, each passing their results to the next in the array. 
    	async.waterfall({
		    four: function(callback){
		    	// 4) fn AddOrder: order info --> table: orders
		    	exports.addOrder(tracking_id,status,staff_id,results['two'], function(err, rows){
		        	callback(null,rows);
		    	})
		    },
		    five: function(callback){
		    	// 5) fn AddItem: order_id + items detail --> table: items
		        callback(null,rows);
		    },
		    six: function(callback){
		    	// 5) fn AddItem: order_id + items detail --> table: items
		        callback(null,rows);

		},
		function(err, finish) {
			if (err) console.log(err);
		})
	}
	});

	/* V1.0 code, reserved for future reference
	// 1) Add customer info into table customers
	exports.addCustomer(name,contact,address,function(err,rows1){
		if (err) return cb(err);
		// 2) Get customer 
		exports.getAutoIncrementID(function(){
				if (err) return cb(err);
				// 3)Add order info
				exports.addOrder(tracking_id,status,staff_id,customer_id, function(err, rows2){
					if (err) return cb(err);
					// 4) Add items iterately
					// TODO iternation
					console.log("DB_POST: addOrder");
					cb(null,rows);

				});
		});
			
	});
	*/

};

// add to table 'orders' ONLY
// reserved for addOrderSubmit function
exports.addOrder = function(tracking_id,status,staff_id,customer_id,cb){
	connection.query("INSERT INTO orders(tracking_id,status,de_staff,customer_id) VALUES (
						  ?, ?, ?,(SELECT customer_id FROM customers WHERE name= ?));",
						  [tracking_id,status,staff_id,customer_id], function(err, rows){
		console.log("DB_INSERT: addOrder");
		cb(null,rows);
	});
};


// add to table 'customers' ONLY
// reserved for addOrderSubmit function
exports.addCustomer = function(name,contact,address,cb){
	connection.query('INSERT INTO customers (name, contact, address) VALUES (?,?,?)',[name,contact,address],function(err, rows){
		if (err) return cb(err);
		console.log("DB_INSERT: addCustomer");
		cb(null,rows);
	});
};


// add to table 'items' ONLY
// reserved for addOrderSubmit function
exports.addItem = function(order_id,product_id,quantity,cb){
	// Get single price for the product
	exports.getProductPrice(product_id, function(err,result){
		if (err) return cb(err);
		var price = result;
		// Calculate total amount of price
		var total = price * quantity;
		// Add record to item table
		connection.query('INSERT INTO items(order_id, product_id, qty,total) VALUES (?,?,?,?)',[order_id,product_id,quantity,total] ,function(err2, rows){
			if (err2) return cb(err);
			console.log("DB_INSERT: addItem");
			cb(null,rows);
	});
};

exports.getAutoIncrementID = function(cb){
	connection.query("SELECT LAST_INSERT_ID()"),function(err,rows){
		if (err) return cb(err);
		console.log('DB_SELECT:getAutoIncrementID......',rows);
		cb(null,rows);
	});
};

// generate random tracking id
exports.genTrackingID = function(cb){
	var text = "";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
	for( var i=0; i < 6; i++ )
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	cb(null,text);
}



