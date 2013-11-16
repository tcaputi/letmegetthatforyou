var express = require("express");
var http = require('http');
var fs = require('fs');
var path = require('path');
var qs = require('querystring');

const PORT = 3546;

//express
var app = express();
app.use(express.cookieParser());
app.use(express.session({
    secret: 'secret_key',
    store: express.session.MemoryStore({
        reapInterval: 60000 * 10
    })
}));
app.use(express.bodyParser());
app.use(function(req, res, next){
    console.log("CALL: " + req.url);
    next();
});