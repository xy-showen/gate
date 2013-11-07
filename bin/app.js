global.tempClients = {};
global.clients = {};
global.gameServers = {};
global.gameServersIP=[];


 var sendEvents = require('../lib/sendCacheMsg/sendToInner.js');

sendEvents.start();
require('../lib/server/innerServer');
require('../lib/server/serverGate');