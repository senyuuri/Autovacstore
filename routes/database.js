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
/*
exports.addStaff = function(username,password,privilege){
    connection.query('INSERT INTO staff VALUES (?)', [username,password,privilege], function(err, results){
    })
};

exports.queryStaff = function(username){
    connection.query('SELECT * FROM staff WHERE username=(?)', [username], function(err, results){
    })
};
*/

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
