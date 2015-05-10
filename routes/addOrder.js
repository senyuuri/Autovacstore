var express = require('express');
var bodyParser = require('body-parser');
var database = require('../routes/database');
var router = express.Router();
var app = express();

var jsonParser = bodyParser.json();       // to support JSON-encoded bodies
var urlencodedParser = bodyParser.urlencoded({     // to support URL-encoded bodies
	extended: false
}); 

var result = []

router.route('/')
.get(function (req, res, next) {
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
			res.render('addOrder', { title: 'Autovacstore', plist: products, staff: postmen});
		});		
	});

})
.post(urlencodedParser, function (req, res, next) {
	if (!req.body) return res.sendStatus(400);
	// filter: list of known POST key varibles
	var filter = ['staff','name','contact','address'];
	var staff = '';
	var name = '';
	var contact = '';
	var address = '';
	// order items in [product_id, qty] pairs
	var items = [];
	for(var key in req.body){
		staff = req.body.staff;
		name = req.body.name;
		contact = req.body.contact;
		address = req.body.address;
		// read order quantity
		console.log("POST PACKET CONTENTS:");
		console.log("=========================");
		for(var key in req.body){
			var value = req.body[key];
			// if not preset field --> it's an order field
			if (filter.indexOf(key) == -1){
				var pid = key.split('-')[1];
				console.log('pid...',pid,'....',value);
				items.push([pid,value]);
			};
			console.log('items',items);
		};
	};
	next();
});




/*
//router.get('/:id(\\d+)', function(req, res) {
router.route('/:id').get(function (req, res, next) {
  res.send('respond user Info userid:' + req.params.id);
});

// respond with "Hello World!" on the homepage
router.route('/hello').get(function (req, res, next) {
  res.send('Hello World!');
});
*/
 
module.exports = router;