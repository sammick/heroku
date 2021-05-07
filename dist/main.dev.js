"use strict";

var express = require('express');

var fileUpload = require('express-fileupload');

var bodyParser = require('body-parser');

var app = express();
var PORT = 8000;
app.use(bodyParser.json()); // for parsing application/json

app.use(bodyParser.urlencoded({
  extended: true
})); // for parsing application/x-www-form-urlencoded
// default options

app.use(fileUpload({
  createParentPath: true,
  useTempFiles: true,
  tempFileDir: '/temp/',
  parseNested: true,
  debug: true
}));
app.use('/form', express["static"](__dirname + '/server.html'));
app.post('/upload', function (req, res) {
  var sampleFile;
  var uploadPath;

  if (!req.files || Object.keys(req.files).length === 0) {
    res.status(400).send('No files were uploaded.');
    return;
  }

  console.log('req.files >>>', req.files); // eslint-disable-line

  sampleFile = req.files.sampleFile;
  uploadPath = __dirname + '/uploads/' + sampleFile.name;
  sampleFile.mv(uploadPath, function (err) {
    if (err) {
      return res.status(500).send(err);
    } // sharp({
    //     create: {
    //         width: 1080,
    //         height: 1920,
    //         channels: 4,
    //         background: { r: 255, g: 255, b: 255, alpha: 1 }
    //     }
    // })
    // .flatten( { background: '#ffffff' } )
    // .composite([{ input: nlpath.full }])
    // .sharpen().withMetadata().toFile(filepath('story'))


    res.send('File uploaded to ' + uploadPath);
  });
});
app.post('/createstory', function (req, res, next) {
  console.log('profile', req.body);
  res.json(req.body);
});
app.listen(PORT, function () {
  console.log('Express server listening on port ', PORT); // eslint-disable-line
});