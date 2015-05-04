var express = require('express');
var exports = module.exports = {};
var connection = mysql.createConnection({
  host     : process.env.OPENSHIFT_MYSQL_DB_HOST,
  port     : process.env.OPENSHIFT_MYSQL_DB_PORT,
  user     : process.env.OPENSHIFT_MYSQL_DB_USERNAME,
  password : process.env.OPENSHIFT_MYSQL_DB_PASSWORD
});

connection.connect(function(err) {
            if (err) {
                console.error('error connecting: ' + err.stack);
                return;
            }

            console.log('connected as id ' + connection.threadId);
        });
       
        connection.query('SELECT 1 + 1 AS solution', function(err, rows, fields) {
            if (err) throw err;
            console.log('The solution is: ', rows[0].solution);
        });


