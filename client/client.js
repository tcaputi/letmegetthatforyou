var express = require("express");
var fs = require('fs');
var path = require('path');
var qs = require('querystring');
var request = require('request');
var net = require('net');
var config = require('./config.json')

const PORT = 7373;
const SERVER_PORT = 3546;
const SERVER_URL = 'http://pooter.sandile.me';
const CONNECT_SUFFIX = '/client-register?';
const CONFIG_PATH = './.config';

var clientSecret;

//express
var app = express();
app.use(express.bodyParser());
app.use(function(req, res, next){
	if(req.param('secret') !== clientSecret) {
		console.log('bad secret: expected=' + clientSecret + ', actual=' + req.param('secret'));
		res.send(400, 'Bad secret');
	}else next(); //TODO: Check if this is correct. (May always have to call next())
	//TODO: add check to ensure request came from pooter.sandile.me
});
app.use(function(req, res, next){
    console.log("CALL: " + req.url);
    next();
});

app.get('/ls', function(req, res){
	var files = fs.readdirSync(path.join("/", req.param('path')));
	res.json(files);
});

app.get('/file', function(req, res){
	res.sendfile(path.join("/", req.param('path')));
});

app.get('/areyouthere', function(req, res){
	res.send(200, 'yes');
});

/*
var client = dgram.createSocket("udp4");
client.bind(PORT, '0.0.0.0', function(){

	var checkIn = function(){
		var message = new Buffer(JSON.stringify({user: config.user, machine: config.machine}));
		client.send(message, 0, message.length, SERVER_PORT, '50.116.60.24', function(err, bytes) {
			if(err) throw err;
		});
	}

	request(SERVER_URL + ':' + SERVER_PORT + CONNECT_SUFFIX + qs.stringify(config), function(err, res, body){
		if(err) throw err;
		clientSecret = body;
		
		checkIn();
		setInterval(function() {
			checkIn();
		}, 60000);
	});
});
*/

var socket = new net.Socket();
socket.setKeepAlive(false);
socket.on('connect', function() {
    console.log("connect");
    socket.write(JSON.stringify({user: config.user, machine: config.machine}));
});
socket.on('error', function (e) {
    console.log("error");
    console.log(e);
});
socket.on('data', function (data) {
    console.log("data");
    var payload = JSON.parse(data);
	if(payload.command === 'secret'){
		clientSecret = payload.secret;
	}else if(payload.command === 'ls'){
		var files = fs.readdirSync(path.join("/", req.param('path')));
		socket.write(JSON.stringify(files));
	}else if(payload.command === 'file'){
		var fileStream = fs.createReadStream(path.join("/", req.param('path')));
		fileStream.on('error', function(err){
			console.log(err);
		})
		fileStream.on('open',function() {
			console.log('piping file');
			fileStream.pipe(socket);
		});
	}else{
		console.log('unrecognized command: ' + payload.command);
	}
});
socket.on('close', function () {
    console.log("close, reconnecting");
	socket.connect(SERVER_PORT, SERVER_URL);
});
socket.on('end', function () {
    console.log("end, reconnecting");
	socket.connect(SERVER_PORT, SERVER_URL);
});
socket.connect(SERVER_PORT, SERVER_URL);