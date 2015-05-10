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

/* FOR addOrder.js
*  when adding an order: 
   Usage: use database.addOrder(tracking_id,status,de_staff,customer_id,[item list],callback)
   Internal Steps:  1) Add customer info --> table: costomers 
                    2) Add order info --> table: orders
                    3) Add order_id + items detail --> table: items
*/

exports.addOrder = function(tracking_id,status,de_staff,customer_id,items,cb){
    connection.query('          ', function(err, rows){
      if (err) return cb(err);



      console.log("DB_POST: addOrder");
      cb(null,rows);
    });
};

exports.addCustomer = function(cb){
    connection.query('          ', function(err, rows){
      if (err) return cb(err);
      console.log("DB_POST: addCustomer");
      cb(null,rows);
    });
};

exports.addItem = function(cb){
    connection.query('          ', function(err, rows){
      if (err) return cb(err);
      console.log("DB_POST: addItem");
      cb(null,rows);
    });
};

// generate random tracking id
var genTracking = function(){
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    for( var i=0; i < 6; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}
