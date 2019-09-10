const http = require('http');
const app = http.createServer(handler)
const io = require('socket.io')(app);
const ss = require('socket.io-stream');
const fs = require('fs');
const querystring = require('querystring');
const sync_request = require('sync-request');
const request = require('request');


const TOKEN = getToken('chatting_node', 'chatmeee');

app.listen(5000, "0.0.0.0");

function handler (req, res) {
  fs.readFile(__dirname + '/index.html',
  function (err, data) {
    if (err) {
      res.writeHead(500);
      return res.end('Error loading ChatMe');
    }
    res.writeHead(200);
    res.end(data);
  });
}

function getKeyByValue(object, value) {
  return Object.keys(object).find(key => object[key] === value);
}

var connections = {};
var groups = {};
var allClients = [];

// middleware
io.use((socket, next) => {
  let token = socket.handshake.query.token;
	let user_id = socket.handshake.query.user_id;
  if (syncValidateUser(token, user_id)) {
		connections[socket.id] = user_id;
    return next();
  }
  return next(new Error('authentication error'));
});


io.on('connection', function(socket) {

	socket.on('disconnect', function() {
		delete connections[socket.id];
	});

	socket.on('new-call', (newCall) => {
		var sender_socket = getKeyByValue(connections, newCall.sender);
		var receiver_socket = getKeyByValue(connections, newCall.receiver);

		var call_content = {
			sender : newCall.sender,
			receivers : [newCall.receiver],
			type : "S",
			is_video : newCall.is_video
		}

		if (receiver_socket != undefined) {
			request.post(
				'http://localhost:8000/api/call-set/',
				{
					json: call_content,
					headers: {
						'Content-Type': 'application/json',
						'Authorization': 'Token ' + TOKEN
					}
				},
				function (error, response, body) {
					if (!error && response.statusCode == 201) {
						var call = body;
						call.receivers[0] = call.receivers[0] + '';
						call.sender = call.sender + '';
						if (call.type == 'S') {
							if (getKeyByValue(connections, call.receivers[0]) != undefined) {
								io.to(getKeyByValue(connections, call.receivers[0])).emit('show-coming-call', call);
							}
						}
					}
				}
			);

		} else {
			call_content.missed_call = true;

			request.post(
				'http://localhost:8000/api/call-set/',
				{
					json: call_content,
					headers: {
						'Content-Type': 'application/json',
						'Authorization': 'Token ' + TOKEN
					}
				},
				function (error, response, body) {
					if (!error && response.statusCode == 201) {
						var call = body;
						call.receivers[0] = call.receivers[0] + '';
						call.sender = call.sender + '';
						if (call.type == 'S') {
							if (getKeyByValue(connections, call.receivers[0]) != undefined) {
								io.to(getKeyByValue(connections, call.receivers[0])).emit('add-call', call);
							}
							socket.emit('add-call', call);
							socket.emit('call-rejected', call);
						}
					}
				}
			);
		}
	});

	socket.on('accept-call', (call) => {
		var sender_socket = getKeyByValue(connections, call.sender);
		var receiver_socket = getKeyByValue(connections, call.receivers[0]);

		if (sender_socket != undefined){
			io.to(sender_socket).emit('init-call', call);
		}

	});

	socket.on('reject-call', (call) => {

		var sender_socket = getKeyByValue(connections, call.sender);
		var receiver_socket = getKeyByValue(connections, call.receivers[0]);

		if (sender_socket != undefined){
			io.to(sender_socket).emit('call-rejected', call);
		}

	});

	socket.on('audio-stream', (stream) => {
		var destination_socket = getKeyByValue(connections, stream.destination);

		if (destination_socket != undefined){
			io.to(destination_socket).emit('play-audio', stream.buffer);
		}

	});

	socket.on('video-stream', (stream) => {
		var destination_socket = getKeyByValue(connections, stream.destination);
		if (destination_socket != undefined){
			io.to(destination_socket).emit('show-image', stream.buffer);
		}
	});

	setInterval(() => {
		var values = Object.keys(connections).map(function(key){
    	return connections[key];
		});
		socket.emit('refresh-connected-users', values);
	}, 3000);

});


function syncValidateUser(_token, _user_id) {
	var res = sync_request('POST', 'http://localhost:8000/api/validate-token/', {
	  json: { user_id: _user_id, token: _token },
		headers: {
			'Content-Type': 'application/json',
			'Authorization': 'Token ' + TOKEN
  	}
	});
	var res = JSON.parse(res.getBody('utf8'));
	return res['valid'];
}

function getToken(user_name, password) {
	var res = sync_request('POST', 'http://localhost:8000/get-token/', {
	  json: { username: user_name, password: password },
		headers: {
			'Content-Type': 'application/json'
  	}
	});
	var res = JSON.parse(res.getBody('utf8'));
	return res['token'];
}
