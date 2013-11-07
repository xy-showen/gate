var EventEmitter = require('events').EventEmitter,
	util = require('util');
var count=0;
var sendEvents = function sendEvents() {
	if (sendEvents.caller != sendEvents.getInstance) {
		throw new Error("This object cannot be instanciated");
	}
	EventEmitter.call(this);
	this._eventInited = false;
};

util.inherits(sendEvents,EventEmitter);

sendEvents.prototype.start = function(){
	if(this._eventInited) return;
    this._eventInited=true;
    this._sendMsgEvent();
};

sendEvents.prototype._sendMsgEvent = function(){
	var _self=this;

	for( innerServerIP in global.gameServers){
		if(global.gameServers[innerServerIP].msg.length>0&&global.gameServers[innerServerIP].isOk){
			var msg=global.gameServers[innerServerIP].msg.shift();

			global.gameServers[innerServerIP].gameServer.send(msg);
		}
		else{
			
		}
	}
	setImmediate(_self._sendMsgEvent.bind(_self));

};

sendEvents.instance=null;

sendEvents.getInstance = function(){
	if(this.instance === null){
		this.instance = new sendEvents();
	}
	return this.instance;
};
module.exports = sendEvents.getInstance();