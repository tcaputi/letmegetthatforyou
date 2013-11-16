var express = require("express");
var http = require('http');
var fs = require('fs');
var path = require('path');
var qs = require('querystring');

const PORT = 7373;
const SERVER_URL = 'http://pooter.sandile.me:3546/';
const CONNECT_SUFFIX = 'client-connect';
const CONFIG_PATH = './.config';

var clientSecret;

//express
var app = express();
app.use(express.bodyParser());
app.use(function(req, res, next){
	if(req.param(secret !== clientSecret)) res.send(400, 'Bad secret');
	else next(); //TOD: Check if this is correct. (May always have to call next())
});
app.use(function(req, res, next){
    console.log("CALL: " + req.url);
    next();
});

app.get("/ls", function(req, res){
	var files = fs.readdirSync(path.join("/", req.param('path')));
	res.json(files);
});

app.get("/file", function(req, res){
	res.sendfile(path.join("/", req.param('path')));
});

var username = fs.readFileSync('./config.txt').split('\n')[0];
var machineName = fs.readFileSync('./config.txt').split('\n')[1];
request(SERVER_URL + CONNECT_SUFFIX + qs.stringify({user: username, machine: machineName}), function(err, res, body){
	if(err) throw err;
	clientSecret = body;
});

http.createServer(app).listen(PORT);