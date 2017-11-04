'use strict';
/*jslint vars:true*/

var env          = process.env;
var fs           = require('fs');
var net          = require('net');
var util         = require('util');
var EventEmitter = require('events').EventEmitter;

function Dev_server(server, port) {
    this.server          = server;
    this._ip             = "0.0.0.0";
    this._port           = port;
    this.soket_server    = null;
    this.socket_client   = null;

    this.timeout_counter = 0;
}

util.inherits(Dev_server, EventEmitter);

Dev_server.prototype.connected = function () {
    if (this.socket_client) {
        return true;
    }
    
    return false;
};

Dev_server.prototype.write = function (data) {
    try {
        if (this.socket_client) {
            this.socket_client.write(data);
        }
    } catch (error) {
        console.log(error, data);
    }
};

Dev_server.prototype.on_new_connection = function (socket) {
    if (this.socket_client) {
        socket.end();
        socket.destroy();
    }

    this.timeout_counter = 0;

    var raddr = socket.remoteAddress;
    var rport = socket.remotePort;

    console.log("dev server on new connection: ", raddr, rport);

    this.socket_client = socket;
    
    this.socket_client.on("data",    this.on_net_data.bind(this));
    this.socket_client.on("error",   this.on_net_error.bind(this));
    this.socket_client.on("end",     this.on_net_end.bind(this));
    this.socket_client.on("timeout", this.on_net_timeout.bind(this));
    this.socket_client.on("drain",   this.on_net_drain.bind(this));
    this.socket_client.on("close",   this.on_net_close.bind(this));
};

Dev_server.prototype.on_net_data = function (data) {
    this.timeout_counter = 0;
    this.emit("dev-data", data);
};

Dev_server.prototype.on_net_error = function (err) {
    console.log("on_net_error", err);
    this.close();
};

Dev_server.prototype.on_net_end = function () {
    console.log("on_net_end");
};

Dev_server.prototype.on_net_timeout = function () {
    console.log("on_net_timeout");
};

Dev_server.prototype.on_net_drain = function () {
    console.log("on_net_drain");
};

Dev_server.prototype.on_net_close = function (had_error) {
    if (had_error) {
        console.log("on_net_close with error");
    } else {
        console.log("on_net_close");
    }

    this.close();
};

Dev_server.prototype.close = function () {
    if (this.socket_client) {
        this.socket_client.end();
        this.socket_client.destroy();
        this.socket_client = null;
    }
};

Dev_server.prototype.check_dev_alive = function () {
    console.log("check dev alive, timeout counter: ", ++this.timeout_counter);
    if (this.timeout_counter > 3) {
        this.close();
    }
};

Dev_server.prototype.start = function () {
    this.socket_server = net.createServer({}, this.on_new_connection.bind(this));
    this.socket_server.listen(this._port);

    console.log("Dev_Server listen on port: " + this._port);

    setInterval(this.check_dev_alive.bind(this), 5 * 1000);
};

module.exports = Dev_server;
