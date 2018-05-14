'use strict';
/*jslint vars:true*/

var env          = process.env;
var fs           = require('fs');
var net          = require('net');
var util         = require('util');
var EventEmitter = require('events').EventEmitter;
var Dev_client   = require("./dev_client.js");

function Dev_server(server, port) {
    this.server          = server;
    this._ip             = "0.0.0.0";
    this._port           = port;
    this.soket_server    = null;
    this.dev_list     = {};

    //this.timeout_counter = 0;
}

util.inherits(Dev_server, EventEmitter);

Dev_server.prototype.log = function (msg) {
    console.log((new Date()).now(), "[Dev_server]", msg);
};

Dev_server.prototype.on_client_close = function (session) {
    this.log("on dev client closed: " + session.sessionId);

    delete this.dev_list[session.sessionId];
};

Dev_server.prototype.on_client_data = function (data) {
    this.emit('dev-data', data);
};

Dev_server.prototype.on_new_connection = function (socket) {
    var client = new Dev_client(this.server, this, this.new_session_id(), socket);

    var raddr = socket.remoteAddress;
    var rport = socket.remotePort;
    this.log("on new connection: " + raddr, rport);
    
    this.dev_list[client.sessionId] = client;

    client.on('data',  this.on_client_data.bind(this));
    client.on('close', this.on_client_close.bind(this));
};

Dev_server.prototype.check_dev_alive = function () {
    //console.log("check dev alive, timeout counter: ", ++this.timeout_counter);
    // for (var sid in this.dev_list) {
    //     var client = this.dev_list[sid];
    //     if (++client.timeout_counter > 10) {
	//         this.log("client data timeout........");
    //         client.close();
    //         delete this.dev_list[sid];
    //     }
    // }
};

Dev_server.prototype.new_session_id = function () {
    var s;
    s = (Math.random() * 10000).toFixed(0);
    s = s + '-' + (Math.random() * 10000).toFixed(0);
    return s;
};

Dev_server.prototype.start = function () {
    this.socket_server = net.createServer({}, this.on_new_connection.bind(this));
    this.socket_server.listen(this._port);

    console.log("Dev_Server listen on port: " + this._port);

    setInterval(this.check_dev_alive.bind(this), 5 * 1000);
};

module.exports = Dev_server;
