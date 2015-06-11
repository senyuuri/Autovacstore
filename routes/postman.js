var express = require('express');
var bodyParser = require('body-parser');
var database = require('../routes/database');
var router = express.Router();
var app = express();

var jsonParser = bodyParser.json();       // to support JSON-encoded bodies
var urlencodedParser = bodyParser.urlencoded({     // to support URL-encoded bodies
	extended: false
}); 


router.get('/',isLoggedIn,function (req, res, next) {
	var result = [];
	// record orders that have been processed
	var oFilter = [];
	// Get product list
  var uid = req.user.uid;
	database.getUndeliveredByStaff(uid,function(err,rows){
		if (err) console.log(err);
  		console.log("============= delivered.js =============");
  		//console.log(rows);
  		// conbine products and calculate total payables
  		for(var i=0; i<rows.length;i++){
  			var record = rows[i];
  			// if the order has not been processed
  			if (oFilter.indexOf(record['order_id']) == -1){
  				oFilter.push(record['order_id']);
  				var items = record['product_name']+'('+record['qty']+')';
  				result.push({'order_id':record['order_id'],
  							'tracking_id':record['tracking_id'],
  							'status':record['status'],
  							'customer':record['name'],
  							'customer_id':record['customer_id'],
  							'staff':record['realname'],
  							'staff_id':record['de_staff'],
  							'items':items,
  							'total':record['total']
  							});
  			}
  			// if orders with the same order_id have been processed
  			else{
  				// modify last record
  				result[result.length-1]['items'] += ',' +record['product_name']+'('+record['qty']+')';
  				result[result.length-1]['total'] += record['total']
  			};
  		};
  		console.log('=======================');
  		console.log(result);
		res.render('postman', { title: 'Autovacstore',page:'delivered',result: result,message:req.flash('postmanMsg')});
		});		
});

router.get('/s/:oid/:status',isLoggedIn,function (req, res, next) {
  var oid = req.params.oid;
  var status = req.params.status;
  database.updateStatus(oid,status,function(err,rows){
    if (err){
      console.log(err);
      req.flash('postmanMsg', "Status update failed. Please contact the system administrator.");
      res.redirect('/postman');
    }else{
      req.flash('postmanMsg', "Status updated.");
      res.redirect('/postman');
    };
  });
});

router.get('/detail/:tid',isLoggedIn,function (req, res, next) {
  var tid = req.params.tid;
  var result = [];
  database.getOrderByTrackingId(tid,function(err,rows){
    if (err) console.log(err);
    result = digestResult(rows)[0];
    res.send(JSON.stringify(result));
  });
});

var digestResult = function(rows){
  var result = [];
  var oFilter = [];
  var total_price=0.0;
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
      total_price += record['total'];
      items.push({'pid': record['product_id'],
            'name': record['product_name'],
            'qty': record['qty'],
            'price': record['price'],
            'total':record['total']});
      result.push({'order_id':'/'+record['order_id'],
            'tracking_id':record['tracking_id'],
            'status':record['status'],
            'customer':record['name'],
            'customer_id':record['customer_id'],
            'customer_contact':record['contact'],
            'customer_address':record['address'],
            'staff':record['realname'],
            'staff_contact':record['s_contact'],
            'staff_id':record['de_staff'],
            'created':record['created'],
            'items':items,
            'total_price':total_price
            });
    }
    // if orders with the same order_id have been processed
    else{
      // modify last record
      result[result.length-1]['items'].push({'pid': record['product_id'],
                          'name': record['product_name'],
                          'qty': record['qty'],
                          'price': record['price'],
                          'total':record['total']});
      result[result.length-1]['total_price'] += record['total'];
    };

  };
  return result;
}



function isLoggedIn(req, res, next) {

  // if user is authenticated in the session, carry on
  if (req.isAuthenticated()){ 
  // check if the user has admin permission
    if (req.user.role == 'd')
      return next();
    else{
      req.flash('loginMessage', 'ERR: STAFF PANEL NOT AVAILABLE FOR ADMIN ACCOUNT');
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
