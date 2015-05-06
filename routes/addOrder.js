var express = require('express');
var bodyParser = require('body-parser');
var router = express.Router();
var app = express();

var jsonParser = bodyParser.json();       // to support JSON-encoded bodies
var urlencodedParser = bodyParser.urlencoded({     // to support URL-encoded bodies
	extended: false
}); 

router.route('/')
.get(function (req, res, next) {
	res.render('addOrder', { title: 'Autovacstore' });
})
.post(urlencodedParser, function (req, res, next) {
	if (!req.body) return res.sendStatus(400);
	var username = req.body.username;
	var password = req.body.password;
	var passwordconfirm = req.body.passwordconfirm;
	var optionsRadios = req.body.optionsRadios;
	var realname = req.body.realname;
	var remarks = req.body.remarks;
	var aaa ="aa";
	res.send('username:'+username +"  password" +password+"   pwc:"+passwordconfirm+"prv:"+optionsRadios+realname+remarks);
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