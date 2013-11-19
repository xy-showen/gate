var http = require('http'),
	WebSocketServer = require('ws').Server,
	util = require('util'),
	configs = require('../../config.js');

var uuidGate = 0;

function coreServer() {
	//http.Server.call(this);
	var serverGate = new WebSocketServer({
		port: configs.serverGatePort
		//server: this,
		//clientTrack: false
	}, function(err) {
		if (err) {
			console.log("create gateServer err:" + err);
		} else {
			console.log("create gateServer succ,listening on port "+configs.serverGatePort);
		}
	});
	serverGate.on('connection', function(client) {
		console.log('connected..');

		var session = {
			'connection': client,
			'logined': false,
			"isRelogin": "false",
			'username': '',
			"_id": "",
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
			if (session['logined'] == false && req.url != '/account/login') {

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

					req.uuidGate = uuidGate.toString();
					uuidGate++;
					req.data.username = req.data.name;
					console.log(req.data.username);
					if (global.tempClients.hasOwnProperty(req.data.name)) {
						//console.log(tempClients[req.data.name]);
						console.log('has logined');
						client.close(4001, 'has logined');
					} else {

						if(global.gameServersIP.length<1){//所有游戏服务器都没有启动
							client.close(4001,"gameServer is Maintaining");
							return;
						}
						session.username = req.data.name; //session里面增加username
						//随机选择一个服务器分给用户
						var n = parseInt(Math.random() * global.gameServersIP.length);
						console.log('select:' + n + " " + global.gameServersIP[n]);
						session.innerServerIP = global.gameServersIP[n];

						console.log(req.data.name + " is logining...");
						global.tempClients[req.data.name] = session; //登录的时候先把session临时保存

						//向服务器发送登录请求
						global.gameServers[session.innerServerIP].gameServer.send(JSON.stringify(req));

					}
				}
			} else if (req.url == "/account/relogin") { 
				if (global.gameServersIP.length < 1) { //所有游戏服务器都没有启动
					client.close(4001, "gameServer is Maintaining");
					return;
				}
				var n = parseInt(Math.random() * global.gameServersIP.length);//随机选择一个服务器分给用户
				console.log('select:' + n + " " + global.gameServersIP[n]);
				session.innerServerIP = global.gameServersIP[n];
				global.gameServers[session.innerServerIP].uids.push(session._id);
				global.gameServers[session.innerServerIP].hasCons++;
				console.log(session.username + " is relogining...");
				req._id=session._id;

				req.uuidGate = uuidGate.toString();
				uuidGate++;
				//向服务器发送重新登录请求

				global.gameServers[session.innerServerIP].gameServer.send(JSON.stringify(req));
			} else { //其它请求,每次请求都要加上,_id

				if (global.gameServersIP.indexOf(session.innerServerIP) == -1) { //服务器close了
					//session['logined']=false;
					//session.connection.send();//通知客户端重新登录
					return;
				}

				req.uuidGate = uuidGate.toString();
				uuidGate++;
				//req.data.username = session.username;
				req._id = session._id;
				//global.gameServers[session.innerServerIP].gameServer.send(JSON.stringify(req));
				global.gameServers[session.innerServerIP].msg.push(JSON.stringify(req)); //收集消息
			}
		});
		client.on('close', function(code, message) {
			console.log(session.username + " quit login..."+"code:"+code);
			if (!session._id || !session.innerServerIP) {
				console.log("-=-");
				return;
			}
			if(code!=4009){//如果不是被挤掉的
			    delete global.clients[session._id];
			    if(global.tempClients.hasOwnProperty(session.username)){//如果登录还没有返回就断开了
			    	delete global.tempClients[session.username];
			    }

			}

			global.gameServers[session.innerServerIP].hasCons--;
			global.gameServers[session.innerServerIP].uids.splice(global.gameServers[session.innerServerIP].uids.indexOf(session.id), 1);
			for (var i in global.clients) {
				console.log(i);
			}
		});
	});

};

// coreServer.prototype.listen = function() {
// 	var _self = this;
// 	var args = Array.prototype.slice.call(arguments);
// 	http.Server.prototype.listen.apply(_self, args);
// };
//util.inherits(coreServer, http.Server);


var gateServer = new coreServer();
// gateServer.listen(configs.serverGatePort, function() {
// 	console.log("serverGate listening on port:" + configs.serverGatePort);
// });