var util = require('util');
var bodyParser = require('body-parser');

var io = require('socket.io');
var express = require('express');
var _u = require('underscore');
var http = require('http');


var app = express();
app.use(require('cookie-parser')());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded
app.use(require('multer')()); // for parsing multipart/form-data

var server = http.createServer(app);

/** express **/
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.set('port', 8001);

app.get('/',function(req, res){
	console.log(req.cookies.name);
	if( req.cookies.name && req.cookies.name != ""){
		res.render('index.ejs');
	}else{
		res.redirect('/login');
	}
});

app.get('/logout',function(req, res){
	res.cookie('name', '');
	res.redirect('/login');
});

app.get('/login',function(req, res){
	res.render('login.ejs');
});

app.post('/login',function(req, res){
	var name = req.param('name');
	if(name && name != ""){
		console.log('set cookie to name=' + name);
		res.cookie('name', name);
		res.redirect('/');
	}
});

/** socket.io **/
var members = {};
io = io.listen(server);
io.on('connection', function(socket){
	members[socket.id] = {
		id:socket.id
	};
	socket.emit('uid', socket.id);
	io.sockets.emit('member count', _u.size(members) );
	console.log(new Date());
	console.log('connection');
	_u.each(io.sockets.connected, function(client){
		io.to(client.id).json.emit('members', _u.reject(members,function(m){ return m.id == client.id; }) );
	});
	socket.on('rtcmessage', function(data){
		io.to(data.to).json.emit('rtcmessage', data);
	});
	socket.on('disconnect',function(){
		delete members[socket.id];
		io.sockets.emit('member count', _u.size(members.length));
		io.sockets.emit('members', members );
		io.sockets.emit('disconnect', socket.id );
		console.log('disconnect');
	});
/*	socket.on('msg send', function(msg){
		socket.emit('msg push', 'sended');
	});*/
});

/** server **/
server.listen(app.get('port'), function(){
	console.log('listen ' + app.get('port'));
});
