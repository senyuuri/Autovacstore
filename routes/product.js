var express = require('express');
var router = express.Router();
var passport = require('passport');
var async   = require('async');
var bodyParser = require('body-parser');
var database = require('../routes/database');
require('../routes/passport')(passport);
var jsonParser = bodyParser.json();       // to support JSON-encoded bodies
var urlencodedParser = bodyParser.urlencoded({     // to support URL-encoded bodies
	extended: false
}); 
/* GET staff page. */

router.get('/viewdel',isLoggedIn,function (req, res, next) {
	database.getProductList(function(err,rows){
		if (err) console.log(err);
		res.render('product', { title: 'Autovacstore', page:'products',plist:rows, message:req.flash('productMsg'), view_del:true});
	});
});

router.get('/',isLoggedIn,function (req, res, next) {
	database.getProductList(function(err,rows){
		if (err) console.log(err);
		res.render('product', { title: 'Autovacstore', page:'products',plist:rows, message:req.flash('productMsg'), view_del:false});
	});
});

router.get('/add',isLoggedIn,function (req, res, next) {
	database.getProductList(function(err,rows){
		if (err) console.log(err);
		res.render('addProduct', { title: 'Autovacstore', page:'products',plist:rows, message:req.flash('productMsg'), view_del:false});
	})
});


router.post('/add',urlencodedParser,isLoggedIn,function (req, res, next) {
	var name = req.body.name;
	var price = req.body.price;
	database.addProduct(name,price,function(err,rows){
		if (err) console.log(err);
		req.flash('productMsg', "New product has been added to database.");
		res.redirect('/product');
	})
});


router.get('/delete/:pid',isLoggedIn,function (req, res, next) {
	var pid = req.params.pid;
	//console.log('delete_oid........',oid);
	database.deleteProductById(pid, function(err,rows){
		if (err){
			console.log("DeleteERR",err);
			req.flash('productMsg', "Internal error. Please contact system administrator.");
	  		res.redirect('/product');
		};
	  	req.flash('productMsg', 'Delete success.');
	  	res.redirect('/product');
	});
});

router.get('/restore/:pid',isLoggedIn,function (req, res, next) {
	var pid = req.params.pid;
	//console.log('delete_oid........',oid);
	database.restoreProductById(pid, function(err,rows){
		if (err){
			console.log("RestoreERR",err);
			req.flash('productMsg', "Internal error. Please contact system administrator.");
	  		res.redirect('/product');
		};
	  	req.flash('productMsg', 'Restore success.');
	  	res.redirect('/product');
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
		req.session.returnTo = req.originalUrl;
		req.flash('loginMessage', 'You have not logged in.');
		res.redirect('/auth')
	};
}

module.exports = router;
