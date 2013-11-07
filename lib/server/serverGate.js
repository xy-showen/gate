var http = require('http'),
	WebSocketServer = require('ws').Server,
	util = require('util'),
	configs = require('../../config.js');

http.Server.call(this);
var uuidGate = 0;

function coreServer() {
	http.Server.call(this);
	var serverGate = new WebSocketServer({
		server: this,
		clientTrack: false
	});
	serverGate.on('connection', function(client) {
		console.log('connected..');

		var session = {
			'connection': client,
			'logged': false,
			'username': '',
			"_id":"",
			'innerServerIP': '',
			'connectionDate': new Date().getTime()
		};
		client.on('message', function(message) {

			try {
				//console.log(message);
				var req = JSON.parse(message);

			} catch (err) {
				console.log('illegal format');
				client.close(4001, 'illegal format');
				return;
			}

			if (!req.hasOwnProperty('_id_')) {
				console.log('illegal format');
				client.close(4001, 'illegal format');
				return;
			}
			if (session['logged'] == false && req.url != '/account/login') {

				console.log('can not request before login done');
				client.close(4001, 'can not request before login done');
				return;
			}
			console.time(uuidGate.toString() + req.url);
			if (req.url == '/account/login') {
				if (!req.data.name || !req.data.password) {
					console.log('illegal params');
					client.close(4001, 'illegal params');
				} else {

					req.data.uuidGate=uuidGate.toString();
					uuidGate++;
					req.data.username = req.data.name;
					if (global.tempClients.hasOwnProperty(req.data.name) || global.tempClients.hasOwnProperty(req.data.name)) {
						console.log('has logged');
						client.close(4001, 'has logged');
					} else {
						session.username = req.data.name; //session里面增加username
						//随机选择一个服务器分给用户
						var n=parseInt(Math.random() * global.gameServersIP.length);
						console.log('select:'+n+" "+global.gameServersIP[n]);
						session.innerServerIP = global.gameServersIP[n];

						console.log(req.data.name + " is logining...");
						global.tempClients[req.data.name] = session; //登录的时候先把session临时保存


						//向服务器发送登录请求
						global.gameServers[session.innerServerIP].gameServer.send(JSON.stringify(req));
						global.gameServers[session.innerServerIP].hasCons++; //增加一个链接数
					}
				}
			} else { //其它请求,每次请求都要加上username,uid

				if(global.gameServersIP.indexOf(session.innerServerIP)==-1){//服务器close了
					session['logged']=false;
					session.connection.send();//通知客户端重新登录
					return;
				}

				req.data.uuidGate=uuidGate.toString();
				uuidGate++;
				req.data.username = session.username;
				req.data._id=session._id;
				//global.gameServers[session.innerServerIP].gameServer.send(JSON.stringify(req));
				global.gameServers[session.innerServerIP].msg.push(JSON.stringify(req));
			}
		});
	client.on('close', function(code, message) {

	});
});

};

coreServer.prototype.listen = function() {
	var _self = this;
	var args = Array.prototype.slice.call(arguments);
	http.Server.prototype.listen.apply(_self, args);
};
util.inherits(coreServer, http.Server);


var gateServer = new coreServer();
gateServer.listen(configs.serverGatePort, function() {
	console.log("serverGate listening on port:" + configs.serverGatePort);
});