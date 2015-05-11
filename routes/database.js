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

// For undelivered.js                                                      
exports.getUndelivered = function(cb){
	connection.query('SELECT orders.order_id, orders.tracking_id, orders.status, orders.customer_id, '+
					'orders.de_staff, staff.realname, items.product_id, items.qty, items.total, customers.name, products.name AS product_name '+
					'FROM orders '+
					'INNER JOIN items ON orders.order_id=items.order_id '+
					'INNER JOIN customers ON orders.customer_id=customers.customer_id '+
					'INNER JOIN staff ON orders.de_staff=staff.staff_id '+
					'INNER JOIN products ON items.product_id = products.product_id '+
					"WHERE orders.status='r' OR orders.status='p' " +
					'ORDER BY orders.order_id;'
					,function(err, rows){
			if (err) return cb(err);
			console.log("DB_GET: getUndelivered");
			cb(null,rows);
	});
}

exports.getDelivered = function(cb){
	connection.query('SELECT orders.order_id, orders.tracking_id, orders.status, orders.customer_id, '+
					'orders.de_staff, staff.realname, items.product_id, items.qty, items.total, customers.name, products.name AS product_name '+
					'FROM orders '+
					'INNER JOIN items ON orders.order_id=items.order_id '+
					'INNER JOIN customers ON orders.customer_id=customers.customer_id '+
					'INNER JOIN staff ON orders.de_staff=staff.staff_id '+
					'INNER JOIN products ON items.product_id = products.product_id '+
					"WHERE orders.status='s' " +
					'ORDER BY orders.order_id;'
					,function(err, rows){
			if (err) return cb(err);
			console.log("DB_GET: getDelivered");
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
			// 1) fn AddCustomer: customer info --> table: costomers ß
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
				callback(null,text);
			})
		},
	},
	// when one & two & three finish
	// results is now equal to: {one: ..., two: ..., three:...}
	function(err, results) {
		if (err) cb(err);
		console.log("one+two+three result..........",results);
		var customer_id = results['two'][0]['LAST_INSERT_ID()'];
		var tracking_id = results['three'];

		// ============  STAGE 2 ============  
		// async.waterfall: 
		// 	 Runs the tasks array of functions in series, each passing their results to the next in the array. 
		async.waterfall([
			// FOUR
			// 4) fn AddOrder: order info --> table: orders
			function(callback){
				exports.addOrder(tracking_id,status,staff_id,customer_id, function(err, rows){
					callback(null);
				})
			},
			// FIVE
			// 5) fn getAutoIncrementID: get order id
			function(callback){
				exports.getAutoIncrementID(function(err,rows){
					console.log("FIVE:ROWS:.....",rows);
					callback(null,rows[0]['LAST_INSERT_ID()']);
				})
			},
			// SIX
			// note:  arg1 is the return result from five
			// 6) fn AddItem: order_id + items detail --> table: items
			// async.whilst: whilst(test, fn, callback)
			function(arg1, callback){
				console.log('arg1(order_id)...........',arg1);
				console.log('items.length......',items.length);
				var count = 0;
				async.whilst(
					function () { return count < items.length; },
					function (callback) {
						console.log('async.whilst: count...........',count);
						console.log('current item..................',items[count])
						exports.addItem(arg1,items[count][0],items[count][1],function(err,rows){
							count++;
							console.log('after count++....',count);
							console.log('console<items.length',count < items.length);
							//console.trace("Here I am!");
							callback(null);
						}); 
					},
					function (err) {
						// all items have been added 
						console.log('addItems..........FINISH');
						callback(null);
						
					}
				);
			}
		],
		function(err, finish) {
			if (err) throw err;
			console.log("ORDER ADD SUCCESS!");
			cb(null,finish);
		})
	});
};
	
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


// add to table 'orders' ONLY
// reserved for addOrderSubmit function
exports.addOrder = function(tracking_id,status,staff_id,customer_id,cb){
	connection.query("INSERT INTO orders (tracking_id,status,de_staff,customer_id) VALUES (?, ?, ?, ?);",
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
		var price = result[0]['price'];
		// Calculate total amount of price
		var total = price * quantity;
		// Add record to item table
		connection.query('INSERT INTO items (order_id, product_id, qty,total) VALUES (?,?,?,?)',[order_id,product_id,quantity,total] ,function(err2, rows){
			if (err2) return cb(err);
			console.log("DB_INSERT: addItem");
			cb(null,rows);
		});
	});
};

exports.getAutoIncrementID = function(cb){
	connection.query("SELECT LAST_INSERT_ID()",function(err,rows){
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



