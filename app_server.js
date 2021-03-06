'use strict';

var net          = require("net");
var util         = require('util');
var EventEmitter = require('events').EventEmitter;
var APP_client   = require("./app_client.js");

function APP_server(server, port) {
    this.server = server;
    this._port  = port;
    
    this.socket_server = null;
    this.client_list   = {};
}

util.inherits(APP_server, EventEmitter);

APP_server.prototype.on_client_close = function (session) {
    console.log("[APP Server] on app client closed: ", session.sessionId);

    delete this.client_list[session.sessionId];
};

APP_server.prototype.on_client_data = function (data) {
    //console.log("[APP Server] on app client data: ", data);

    this.emit('app-data', data);
        
};

APP_server.prototype.new_session_id = function () {
    var s;
    s = (Math.random() * 10000).toFixed(0);
    s = s + '-' + (Math.random() * 10000).toFixed(0);
    return s;
};

APP_server.prototype.on_new_connection = function (socket) {
    var client = new APP_client(this.server, this, this.new_session_id(), socket);
    
    this.client_list[client.sessionId] = client;

    client.on('data',  this.on_client_data.bind(this));
    client.on('close', this.on_client_close.bind(this));
};

APP_server.prototype.start = function () {
    this.socket_server = net.createServer({}, this.on_new_connection.bind(this));
    this.socket_server.listen(this._port);
    console.log("app server listen on port: ", this._port);
};

module.exports = APP_server;
