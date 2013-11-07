var configs = require('../../config.js'),
	net = require('net'),
	WebSocketServer = require('ws').Server,
	//originIP="",
	innerServer = new WebSocketServer({
		port: configs.innerServerPort,
		verifyClient: function(clientInfo) {
			//originIP=clientInfo.req.headers.origin
			//console.log(originIP);
			return true;
		}
	}, function(err) {
		if (err) {
			console.log("create innerServer err:" + err);
		} else {
			console.log("create innerServer succ,listening on port " + configs.innerServerPort);
		}
	});


innerServer.on('connection', function(gameServer) {
	//console.log(JSON.stringify(gameServer.upgradeReq.remoteAddress));
	console.log(gameServer.upgradeReq.headers.origin);
	var flags = gameServer.upgradeReq.headers.origin + "/" + parseInt(Math.random() * 10000);
	global.gameServersIP.push(flags); //收集gameServer
	console.log(flags);
	global.gameServers[flags] = {
		"gameServer": gameServer,
		'msg': [],
		"hasCons": 0,
		"isOk": true
	};
	console.log("a innerServer has connected");

	gameServer.on('message', function(data) {
		//console.log(gameServer.bufferSize);
		//data = data.toString();
		console.log("---" + data);
		var JSONdata = JSON.parse(data);

		if (JSONdata.url == "/account/login") { //登录返回的信息
			console.log(JSONdata.username + " logged succ");
			//console.log(JSONdata.data.info.user._id);
			global.tempClients[JSONdata.username].logged = true;
			global.tempClients[JSONdata.username]._id=JSONdata.data.info.user._id;
		}
		if (JSONdata.uuidGate) {
			console.timeEnd(JSONdata.uuidGate + JSONdata.url);
		}
		if (global.clients.hasOwnProperty(JSONdata.username)) { //消息发给客户端
			global.clients[JSONdata.username].connection.send(data);
		}
	});

	gameServer.on('close',function(code,message){//服务器close了
		for(var innerServerIP in global.gameServers){
			if(gameServer==global.gameServers[innerServerIP].gameServer){
				global.gameServers[innerServerIP].isOk=false;

				global.gameServersIP.splice(global.gameServersIP.indexOf(innerServerIP),1);
				console.log(global.gameServersIP);
			}
		}
	});
});



// var innerServer = net.createServer(function(gameServer) {
// 	var n=gameServer.address().port+parseInt(Math.random() * 1000);
// 	console.log(gameServer.address().address+"/"+n);
// 	global.gameServers[gameServer.address().address+"/"+n] = {
// 		"gameServer": gameServer,
// 		'msg':[],
// 		"hasCons": 0,
// 		"isOk": true
// 	};
// 	console.log("a innerServer has connected");
// 	global.gameServersIP.push(gameServer.address().address+"/"+n);//收集gameServer
// 	gameServer.on('data', function(data) {
// 		//console.log(gameServer.bufferSize);
// 		//data = data.toString();
// 		console.log("---"+data);

// 		var JSONdata = JSON.parse(data);

// 		if (JSONdata.url == "/account/login") {//登录返回的信息
// 			console.log(JSONdata.username + " logged succ");

// 			global.tempClients[JSONdata.username].logged = true;
// 			if (!global.clients.hasOwnProperty(JSONdata.username)) {//把链接放到cilents中
// 				global.clients[JSONdata.username] = global.tempClients[JSONdata.username];
// 				global.tempClients[JSONdata.username] = null;
// 			}
// 		}
// 		if (JSONdata.uuidGate) {
// 			//console.timeEnd(JSONdata.uuidGate + JSONdata.url);
// 		}
// 		if (global.clients.hasOwnProperty(JSONdata.username)) {//消息发给客户端
// 			global.clients[JSONdata.username].connection.send(data);
// 		}
// 	});
// 	gameServer.on('drain',function(){
// 		console.log("drain...");
// 	});
// });

// innerServer.listen(configs.innerServerPort, function() {
// 	console.log('innerServer listening on port:' + configs.innerServerPort);
// });