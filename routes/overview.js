var express = require('express');
var router = express.Router();

/* GET home page. */
router.route('/').get(function (req, res, next) {
  res.render('overview', { title: 'Autovacstore' });
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
