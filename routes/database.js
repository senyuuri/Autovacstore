var express = require('express');
var exports = module.exports = {};
var mysql   = require('mysql');
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

/* FOR addOrder.js
*  when adding an order: 
   Usage: use database.addOrder(tracking_id,status,staff_id,name,contact,address,[item list],callback)
   Internal Steps:  1) Add customer info --> table: costomers 
					2) Add order info --> table: orders
					3) Add order_id + items detail --> table: items
*/

exports.addOrderSubmit = function(tracking_id,status,staff_id,name,contact,address,items,cb){
	// TODO: use async to reorganise this function
	// Add customer info into table customers
	exports.addCustomer(name,contact,address,function(err,rows1){
		if (err) return cb(err);
		// Add order info
		connection.query("INSERT INTO orders(tracking_id,status,de_staff,customer_id) VALUES (
						  ?, ?, ?,(SELECT customer_id FROM customers WHERE name= ?));",
						  [tracking_id,status,staff_id,customer_id], function(err, rows2){
			if (err) return cb(err);


		});
	

			// Add items

			console.log("DB_POST: addOrder");
			cb(null,rows);
	});

};

// add to table 'orders' ONLY
// reserved for addOrderSubmit function
exports.addOrder = function(tracking_id,status,staff_id,customer_id,cb){
	connection.query("INSERT INTO orders(tracking_id,status,de_staff,customer_id) VALUES (
						  ?, ?, ?,(SELECT customer_id FROM customers WHERE name= ?));",
						  [tracking_id,status,staff_id,customer_id], function(err, rows){
		console.log("DB_POST: addOrder");
		cb(null,rows);
	});
};


// add to table 'customers' ONLY
// reserved for addOrderSubmit function
exports.addCustomer = function(name,contact,address,cb){
	connection.query('INSERT INTO customers (name, contact, address) VALUES (?,?,?)',[name,contact,address],function(err, rows){
		if (err) return cb(err);
		console.log("DB_POST: addCustomer");
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
			console.log("DB_POST: addItem");
			cb(null,rows);
	});
};

exports.getAutoIncrementID = function(cb){

};

// generate random tracking id
var genTracking = function(){
	var text = "";
	var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
	for( var i=0; i < 6; i++ )
		text += possible.charAt(Math.floor(Math.random() * possible.length));
	return text;
}



