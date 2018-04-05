var express = require('express');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var servicesRouter = require('./routes/services');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/services', servicesRouter);

module.exports = app;
