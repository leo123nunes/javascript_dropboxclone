var express = require('express');
var router = express.Router();
var formidable = require('formidable')

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/uploads', (req, resp) => {
  var form = new formidable.IncomingForm({
    uploadDir: './uploads',
    keepExtensions: true
  })

  form.parse(req, (error, fields, files) => {
    resp.send({files})
  })
})

module.exports = router;
