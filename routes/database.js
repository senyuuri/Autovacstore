var express = require('express');
var exports = module.exports = {};
var mysql   = require('mysql');
var async   = require('async');
var bcrypt   = require('bcrypt-nodejs');
/*
var connection = mysql.createConnection({
  host     : process.env.OPENSHIFT_MYSQL_DB_HOST || "127.0.0.1",
  port     : process.env.OPENSHIFT_MYSQL_DB_PORT || 3306,
  user     : process.env.OPENSHIFT_MYSQL_DB_USERNAME || 'admin9dbD4cT',
  password : process.env.OPENSHIFT_MYSQL_DB_PASSWORD || 'e3lc8i8ftG4F'
});
*/
var connection = mysql.createConnection({
  host     : process.env.OPENSHIFT_MYSQL_DB_HOST || "127.0.0.1",
  port     : process.env.OPENSHIFT_MYSQL_DB_PORT || 3306,
  user     : process.env.OPENSHIFT_MYSQL_DB_USERNAME || 'natsuyuu',
  password : process.env.OPENSHIFT_MYSQL_DB_PASSWORD || ''
});



connection.connect(function(err) {
	if (err) {
		console.error('error connecting: ' + err.stack);
		return;
	}

	console.log('connected as id ' + connection.threadId);
});

// select database
connection.query('USE test', function(err, rows) {
	if (err) throw err;
	console.log('SelectedDB: test');
});

/* FOR login.js
	fn generateHash:  hashing & salting password 
	fn validPassword:  verify hashed password
	fn ifUserExist:   check if username is in database
	fn getPasswordHash  retrive hashed password from database
*/
var generateHash = function(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

// checking if password is valid
exports.validPassword = function(password,hash) {
    return bcrypt.compareSync(password, hash);
};


exports.ifUserExist = function(username, cb){
	connection.query('SELECT staff_id FROM staff WHERE username=?',username, function(err, rows){
	  if (err) return cb(err);
	  console.log("DB_LOGIN: ifUserExist",username,rows.length == 1);
	  cb(null, rows);
	});
}

exports.getPasswordHash = function(username,cb){
	connection.query('SELECT password FROM staff WHERE username=?',username, function(err, rows){
	  if (err) return cb(err);
	  console.log("DB_LOGIN: getPasswordHash",rows[0]['password']);
	  cb(null,rows[0]['password']);
	});
};

exports.getUserPermission = function(username,cb){
	connection.query('SELECT previlege FROM staff WHERE username=?',username, function(err, rows){
	  if (err) return cb(err);
	  console.log("DB_LOGIN: getUserPermission",rows[0]['previlege']);
	  cb(null,rows[0]['previlege']);
	});
};


exports.getTrackingById = function(oid,cb){
	connection.query('SELECT tracking_id FROM orders WHERE order_id=?',oid, function(err, rows){
	  if (err) return cb(err);
	  console.log("DB_GET: getTrackingID",rows[0]['tracking_id']);
	  cb(null,rows[0]['tracking_id']);
	});
};

exports.getStatusById = function(oid,cb){
	connection.query('SELECT status FROM orders WHERE order_id=?',oid, function(err, rows){
	  if (err) return cb(err);
	  console.log("DB_GET: getStatusID",rows[0]['status']);
	  cb(null,rows[0]['status']);
	});
};


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
					"WHERE orders.is_deleted IS NULL AND (orders.status='r' OR orders.status='p') " +
					'ORDER BY orders.order_id;'
					,function(err, rows){
			if (err) return cb(err);
			console.log("DB_GET: getUndelivered");
			cb(null,rows);
	});
};

exports.getDelivered = function(cb){
	connection.query('SELECT orders.order_id, orders.tracking_id, orders.status, orders.customer_id, '+
					'orders.de_staff, staff.realname, items.product_id, items.qty, items.total, customers.name, products.name AS product_name '+
					'FROM orders '+
					'INNER JOIN items ON orders.order_id=items.order_id '+
					'INNER JOIN customers ON orders.customer_id=customers.customer_id '+
					'INNER JOIN staff ON orders.de_staff=staff.staff_id '+
					'INNER JOIN products ON items.product_id = products.product_id '+
					"WHERE orders.status='s' AND orders.is_deleted IS NULL " +
					'ORDER BY orders.order_id;'
					,function(err, rows){
			if (err) return cb(err);
			console.log("DB_GET: getDelivered");
			cb(null,rows);
	});
};

// For edition of existing orders (addOrder.js)
exports.getOrderById = function(oid,cb){
	connection.query('SELECT orders.order_id, orders.tracking_id, orders.status, orders.customer_id, '+
					'orders.de_staff, items.product_id, items.qty, customers.name, customers.contact, customers.address '+
					'FROM orders '+
					'INNER JOIN items ON orders.order_id=items.order_id '+
					'INNER JOIN customers ON orders.customer_id=customers.customer_id '+
					'INNER JOIN staff ON orders.de_staff=staff.staff_id '+
					'INNER JOIN products ON items.product_id = products.product_id '+
					"WHERE orders.order_id=? AND orders.is_deleted IS NULL " +
					'ORDER BY orders.order_id;'
					,oid,function(err, rows){
			if (err) return cb(err);
			console.log("DB_GET: getSingleOrder");
			cb(null,rows);
	});
};

// for tracking.js
exports.getOrderByTrackingId = function(tid,cb){
	connection.query('SELECT orders.order_id, orders.tracking_id, orders.status, orders.customer_id, orders.created, products.name AS product_name, '+
					'orders.de_staff, staff.realname, staff.contact AS s_contact, items.product_id, items.qty, items.total, products.price, customers.name, customers.contact, customers.address '+
					'FROM orders '+
					'INNER JOIN items ON orders.order_id=items.order_id '+
					'INNER JOIN customers ON orders.customer_id=customers.customer_id '+
					'INNER JOIN staff ON orders.de_staff=staff.staff_id '+
					'INNER JOIN products ON items.product_id = products.product_id '+
					"WHERE orders.tracking_id=? AND orders.is_deleted IS NULL " +
					'ORDER BY orders.order_id;'
					,tid,function(err, rows){
			if (err) return cb(err);
			console.log("DB_GET: getSingleOrder",rows);
			cb(null,rows);
	});
};


/* FOR addOrder.js POST method

   Usage: use database.addOrder(tracking_id,status,staff_id,name,contact,address,[item list],tracking_id,callback)

   Internal Steps:  STAGE 1 (obtaining necessary info for stage 2)
					1) ft AddCustomer: customer info --> table: costomers 
					2) fn getAutoIncrementID: get customer id
					3) fn genTrackingID: random 6-char string
					STAGE 2
					4) fn AddOrder: order info --> table: orders
					5) fn getAutoIncrementID: get order id
					6) fn AddItem: order_id + items detail --> table: items
*/
exports.addOrderSubmit = function(status,staff_id,name,contact,address,items,tid,cb){
	// V2.0, rewrote using async library
	// async doc ref: https://github.com/caolan/async#seriestasks-callback
	// ============  STAGE 1 ============  
	console.log('>>>>>>>>>>>>>>');
	console.log('API Received:',tid,status);
	console.log('>>>>>>>>>>>>>>');
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
				// if in edit mode, tracking id already given
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

		if (tid) tracking_id = tid;
		console.log('>>>>>>>>>>>>>>>>>>>>>');
		console.log(tracking_id,status);
		console.log('>>>>>>>>>>>>>>>>>>>>>');

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


// add to table 'orders' ONLY
// reserved for addOrderSubmit function
exports.addOrder = function(tracking_id,status,staff_id,customer_id,cb){
	connection.query("INSERT INTO orders (tracking_id,status,de_staff,customer_id) VALUES (?, ?, ?, ?);",
						  [tracking_id,status,staff_id,customer_id], function(err, rows){
		console.log("DB_INSERT: addOrder?",tracking_id,"?",status);
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

exports.deleteOrderById = function(oid,cb){
	connection.query("UPDATE orders SET is_deleted='y' WHERE order_id=?",oid, function(err, rows){
	  if (err) return cb(err);
	  console.log("DB_DELETE: deleteOrderById",rows);
	  cb(null,rows);
	});
};

// For overview.js, statistics
exports.addVisitorLog = function(user,ip,user_agent,request,method,cb){
	connection.query('INSERT INTO visitor (user,ip,user_agent,request,method) VALUES (?,?,?,?,?)',[user,ip,user_agent,request,method],function(err, rows){
		if (err) return cb(err);
		console.log("DB_INSERT: addVisitorLog");
		cb(null,rows);
	});
};


//get order count in last 10 days
exports.getOrderCount = function(cb){
	connection.query('SELECT UNIX_TIMESTAMP(created) AS date, COUNT(order_id) AS count FROM orders WHERE is_deleted IS NULL GROUP BY DATE(created) '+
					'ORDER BY DATE(created) LIMIT 10;', function(err, rows){
	  if (err) return cb(err);
	  cb(null,rows);
	});
};


//get total sales, group by product name
exports.getSales = function(oid,cb){
	connection.query('SELECT products.name AS product, SUM(items.total) AS total'+
					'FROM items '+
					'INNER JOIN products ON items.product_id = products.product_id '+
					'GROUP BY products.name; ', function(err, rows){
	  	if (err) return cb(err);
	  	cb(null,rows);
	});
};

exports.getSalesByDate = function(date,cb){
	connection.query('SELECT orders.created, products.name AS product, SUM(items.total) AS total ' +
					'FROM orders ' +
					'INNER JOIN items ON orders.order_id=items.order_id ' +
					'INNER JOIN products ON items.product_id = products.product_id ' +
					"WHERE DATE(orders.created)=  STR_TO_DATE(?, '%Y-%m-%d') " +
					'GROUP BY products.name; ',date, function(err, rows){
	  	if (err) return cb(err);
	  	cb(null,rows);
	});
};

// Change order status by order_id
exports.updateStatus = function(oid,status,cb){
	connection.query('UPDATE orders SET status=? WHERE order_id=?',status,order_id,function(err, rows){
		if (err) return cb(err);
		console.log("DB_UPDATE: order: ",order_id,"// current status:",status);
		cb(null,rows);
	});
};

// Add status log --> db: operation
// TODO: change db name 
exports.addStatusLog = function(staff_id,order_id,prev_status,curr_status,cb){
	connection.query('INSERT INTO operation (staff_id,order_id,prev_status,curr_status) VALUES (?,?,?,?,?)',[staff_id,order_id,prev_status,curr_status],function(err, rows){
		if (err) return cb(err);
		console.log("DB_INSERT: addStatusLog");
		cb(null,rows);
	});
};

// Get recent status change info
// TODO
exports.getStatusLog = function(staff_id,order_id,prev_status,curr_status,cb){
	connection.query('',[staff_id,order_id,prev_status,curr_status],function(err, rows){
		if (err) return cb(err);
		console.log("DB_INSERT: addVisitorLog");
		cb(null,rows);
	});
};

// FOR staff.js, get staff list
// TODO: change getPostmanList, to exclude admin account
exports.getStaffList = function(cb){
	connection.query("SELECT * FROM staff WHERE previlege='d'",function(err, rows){
		if (err) return cb(err);
		console.log("DB_SELECT: getStaffList");
		cb(null,rows);
	});
};

// FOR staff.js, get recent 5 orders by staff_id
exports.getOrderByStaffId = function(sid,cb){
	connection.query("SELECT * FROM orders WHERE de_staff=? AND is_deleted IS NULL ORDER BY created DESC",sid,function(err, rows){
		if (err) return cb(err);
		console.log("DB_SELECT: getOrderByStaffId",sid);
		cb(null,rows);
	});
};










