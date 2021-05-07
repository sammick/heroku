"use strict";

var express = require('express');

var fileUpload = require('express-fileupload');

var app = express();
var PORT = 8000;
app.use('/form', express["static"](__dirname + '/server.html')); // default options

app.use(fileUpload());
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
    }

    res.send('File uploaded to ' + uploadPath);
  });
});
app.listen(PORT, function () {
  console.log('Express server listening on port ', PORT); // eslint-disable-line
});