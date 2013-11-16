var express = require("express");
var http = require('http');
var fs = require('fs');
var path = require('path');
var qs = require('querystring');
var md5 = require('MD5');
var MongoClient = require('mongodb').MongoClient

const PORT = 3546;
const MONGO_URL = 'mongodb://pooter.sandile.me:27017/';
const COLLECTION_NAME = 'lmgtfy';

const GOOGLE_CLIENT_ID = '536098998739-dn8iv8i1gk4pre2phi8umoutnareqac3.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = 'f4vl7cFJRglIj5G9OFDVu4j9';
const REDIRECT_URI = 'http://pooter.sandile.me/google/callback';

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

app.get('/client-connect', function(req, res){

	var machine = {};
	machine.name = req.param('machine');
	machine.secret = md5((new Date()).getTime() + Math.floor((Math.random() * 100) + 1) + 'shhh');
	
	MongoClient.connect(MONGO_URL + COLLECTION_NAME, function(err, db) {
		var collection = db.collection(COLLECTION_NAME);
		collection.findOne({user: req.param('user')}, function(err, doc){
			if(err) res.send(400, err);
			else if(doc){
				if(!doc.machines){
					collection.update({_id = doc._id}, {$set: {machines: [machine]}}, {upsert: false, multi: false}, function(err, dbres){
						if(err) res.send(400, err);
						else res.send(200, machine.secret);
					});
				}else{
					collection.update({_id = doc._id}, {$push: {machines: machine}}, {upsert: false, multi: false}, function(err, dbres){
						if(err) res.send(400, err);
						else res.send(200, machine.secret);
					});
				}
			}else{
				collection.insert({user: req.param('user'), machines: [machine]}, function(err, dbres){
					if(err) res.send(400, err);
					else res.send(200, machine.secret);
				});
			}
		});
	});
});

app.get('/google/info', function(req, res){
	if(!req.session.access_token){
		req.session.state = md5((new Date()).getTime() + Math.floor((Math.random() * 100) + 1) + 'totallythestate');
		var authUrl = 'accounts.google.com/o/oauth2/auth?' + querystring.stringify({
			client_id: GOOGLE_CLIENT_ID, 
			redirect_uri: REDIRECT_URI, 
			response_type: 'code',
			scope: 'openid profile email',
			state: req.session.state
			});
		res.redirect(authUrl);
	}else{
		request('https://www.googleapis.com/oauth2/v3/userinfo?' + qs.stringify({access_token: req.session.access_token}), function(err, response, body){
			if(err) res.send(400, err);
			var payload = JSON.parse(body);
			console.log(payload);
		});
	}
});

app.get('/google/callback', function(req, res){
	//totally confirming the state....
	if(req.session.state !== req.param('state')) res.send(400, 'bad state');
	var code =	else{
		request({
			url: 'accounts.google.com/o/oauth2/token',
			form: {
				client_id: GOOGLE_CLIENT_ID,
				client_secret: GOOGLE_CLIENT_SECRET,
				grant_type: 'authorization_code',
				redirect_uri: REDIRECT_URI,
				code: req.param('code')
			},
			method: 'POST'
		}, function(err, response, body){
			if(err) res.send(400, err);
			var payload = JSON.parse(body);
			req.session.access_token = payload.access_token;
			res.redirect('/google/info');
		});
	}
});

http.createServer(app).listen(PORT);