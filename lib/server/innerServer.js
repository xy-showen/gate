var configs = require('../../config.js'),
	net = require('net'),
	WebSocketServer = require('ws').Server,

	innerServer = new WebSocketServer({
		port: configs.innerServerPort,
		verifyClient: function(clientInfo) {

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
	//console.log(gameServer.upgradeReq.headers.origin);
	var flags = gameServer.upgradeReq.headers.origin + "/" + parseInt(Math.random() * 10000);
	global.gameServersIP.push(flags); //收集gameServer IP
	//console.log(flags);
	global.gameServers[flags] = {
		"gameServer": gameServer,
		'msg': [],
		"uids":[],
		"hasCons": 0,
		"isOk": true
	};
	console.log("a innerServer has connected,all:"+global.gameServersIP);

	gameServer.on('message', function(data) {
		//console.log(gameServer.bufferSize);
		//data = data.toString();
		//console.log("---" + data);
		var JSONdata = JSON.parse(data);
		console.log(JSONdata);
		if(JSONdata.url=="/user/updateSession"){//gameServer处理了在别的gameServer玩家的事件之后来让网关通知玩家所在服务器更新session
			if(!global.clients.hasOwnProperty(JSONdata.data.uid)|| !global.clients[JSONdata.data.uid].logined){
				return;
			}else{
			 global.gameServers[global.clients[JSONdata.data.uid].innerServerIP].gameServer.send(data);
			return;
			}
		}
		if (JSONdata.url == "/account/login") { //登录返回的信息
			console.log(JSONdata.data.info.user.uName + " logined succ");
			//console.log(JSONdata.data.info.user._id);
			var uid=JSONdata.data.info.user._id;
			global.tempClients[JSONdata.data.info.user.uName].logined = true;//更新session状态,添加_id信息
			global.tempClients[JSONdata.data.info.user.uName]._id = uid;

			if (!global.clients.hasOwnProperty(uid)) { //把客户端session放到cilents中
				global.clients[uid] = global.tempClients[JSONdata.data.info.user.uName];
				global.clients[uid].connection.send(data);
				delete global.tempClients[JSONdata.data.info.user.uName];

				global.gameServers[global.clients[uid].innerServerIP].hasCons++; //增加一个链接数
				global.gameServers[global.clients[uid].innerServerIP].uids.push(uid);//增加一个用户名
			}else{//此玩家已经登录过
				var returnValue={"_id_":"/system/gameServer/hasLogined","data":{}};//通知客户端
				global.clients[uid].connection.send(JSON.stringify(returnValue));
				global.clients[uid].connection.close(4009,"user has Logined");//提掉线之前登录的
				//global.gameServers[global.clients[uid].innerServerIP].hasCons--; //减少一个链接数
				//global.gameServers[global.clients[uid].innerServerIP].uids.splice(global.gameServers[global.clients[uid].innerServerIP].uids.indexOf(uid), 1);//从此服务器用户列表移除
				//delete global.clients[uid];//删除保存的连接对象

				global.clients[uid] = global.tempClients[JSONdata.data.info.user.uName];
				global.clients[uid].connection.send(data);
				delete global.tempClients[JSONdata.data.info.user.uName];

				global.gameServers[global.clients[uid].innerServerIP].hasCons++; //增加一个链接数
				global.gameServers[global.clients[uid].innerServerIP].uids.push(uid);//加入此服务器用户列表
			}
		}
		if (JSONdata.uuidGate) {//用于打印每次的请求所需要的时间
			console.timeEnd(JSONdata.uuidGate + JSONdata.url);
		}

		if (JSONdata._id&&global.clients.hasOwnProperty(JSONdata._id.toString())) { //根据_id把消息发给客户端
			console.log("--------------------------");
			global.clients[JSONdata._id].connection.send(data);
		}else{

		}
	});

	gameServer.on('close', function(code, message) { //服务器close了
		for (var innerServerIP in global.gameServers) {
			if (gameServer == global.gameServers[innerServerIP].gameServer) {
				global.gameServers[innerServerIP].isOk = false;

				global.gameServersIP.splice(global.gameServersIP.indexOf(innerServerIP), 1);
				var returnValue={"_id_":"/system/gameServer/crash","data":{}};
				for(var i=0;i<global.gameServers[innerServerIP].uids.length;i++){
					global.clients[global.gameServers[innerServerIP].uids[i]].connection.send(JSON.stringify(returnValue));
				}
				console.log(global.gameServersIP+" is close");
				break;
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
// 			console.log(JSONdata.username + " logined succ");

// 			global.tempClients[JSONdata.username].logined = true;
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