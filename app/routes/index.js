var express = require('express');
var router = express.Router();
var formidable = require('formidable')
var fs = require('fs')
var path = require('path')

/*

 This code is to use with ajax requests in place of Firebase storage.

*/

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

router.get('/file', (req, resp) => {

  var path = './' + req.query.path
  
  try{
    fs.existsSync(path)

    fs.readFile(path, (error, file) => {

      if(error){
        resp.status(404).send()
      }

      resp.status(200).end(file).send()
    })
  }catch(error){
    resp.status(404).send()
  }
})

router.get('/filenotfound', (req, resp) => {
  resp.sendFile(path.join(__dirname, '../public/src/templates/404page.html'))
})

router.post('/uploads', (req, resp) => {
  try{
    var form = new formidable.IncomingForm({
      uploadDir: './uploads',
      keepExtensions: true
    })
  
    form.parse(req, (error, fields, files) => {
      resp.send({files})
    })
  }catch(error){
    resp.status(500).send()
  }
})

router.delete('/deletefiles', (req, resp) => {
  var filePath = path.join( __dirname, `../${req.body.filePath}`)

  try{
    fs.unlinkSync(filePath)
    resp.status(204).send()
  }catch(error){
    resp.status(404).send()
  }
  
})

module.exports = router;
