//<!-- “SJSU CMPE 226 Spring 2019 TEAM2” -->

var express = require('express');
var path = require('path');
var bodyParser = require('body-parser');
var session = require('express-session');
var lineReader = require('line-reader');
var mysql = require('mysql');
var cookieParser = require('cookie-parser');
var ejs = require('ejs');
var sleep = require('sleep');

var index = require('./app_server/routes/index');
var app = express();

//View engine setup
/*
 * To be used only when using ejs
*/ 
app.set('views', path.join(__dirname, 'app_server', 'views'));
app.set('view engine', 'ejs');





app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(express.static(path.join(__dirname, 'public')));



app.use(session({
secret: 'botnyuserdetails', // session secret
resave: true,
saveUninitialized: true
}));
app.use('/', index);



module.exports = app;
app.listen(3000);
