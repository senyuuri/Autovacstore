var express = require('express');
var router = express.Router();

/* GET home page. */
router.route('/').get(function (req, res, next) {
  res.render('undelivered', { title: 'Autovacstore' });
});




module.exports = router;
