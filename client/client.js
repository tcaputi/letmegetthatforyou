var express = require("express");
var fs = require('fs');
var path = require('path');
var qs = require('querystring');
var request = require('request');
var net = require('net');
var config = require('./config.json')

const SERVER_PORT = 7373;
const SERVER_URL = 'pooter.sandile.me';

var clientSecret;

var socket = new net.Socket();
socket.setKeepAlive(false);
socket.on('connect', function() {
    console.log("connect");
    socket.write(JSON.stringify({user: config.user, machineName: config.machine}));
});
socket.on('error', function (e) {
    console.log("error");
    console.log(e);
});
socket.on('data', function (data) {
    console.log("data");
	console.log(data.toString());
    var payload = JSON.parse(data);
	if(payload.command === 'secret'){
		clientSecret = payload.secret;
	}else if(payload.secret === clientSecret){
		if(payload.command === 'ls'){
			var files = [];
			var fileNames = fs.readdirSync(path.join("/", payload.path));
			for(var i=0; i<fileNames.length; i++){
				var file = {};
				file.name = fileNames[i];
				var stats = fs.statSync(path.join("/", payload.path, fileNames[i]));
				file.isDir = stats.isDirectory();
				file.size = stats.size;
				file.ctime = stats.ctime;
				file.mtime = stats.mtime;
				var ext = path.extname(file.name||'').split('.');
				file.extension = ext[ext.length - 1];
				files.push(file);
			};
			console.log(files);
			socket.write(JSON.stringify(files));
		}else if(payload.command === 'file'){
			var fileStream = fs.createReadStream(path.join("/", payload.path));
			fileStream.on('error', function(err){
				console.log(err);
			})
			fileStream.on('open',function() {
				console.log('piping file');
				fileStream.pipe(socket);
			});
		}else if(payload.command === 'areyouthere'){
			socket.write('"yes"');
		}else{
			console.log('unrecognized command: ' + payload.command);
		}
	}else{
		console.log('bad secret: ' + payload.secret);
	}
});
socket.on('close', function () {
    console.log("close, reconnecting");
	socket.connect(SERVER_PORT, SERVER_URL);
});
socket.on('end', function () {
    console.log("end");
});
socket.connect(SERVER_PORT, SERVER_URL);