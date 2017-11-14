'use strict';

var util         = require('util');
var EventEmitter = require('events').EventEmitter;

function APP_client(server, daemon, sessionId, socket) {
    console.log("new connection from:", socket.remoteAddress);

    this.sessionId    = sessionId;
    this.socket       = socket;
    this.data_buffer  = "";
    this.package_buf  = "";
    this.closed       = false;
    this.raddr        = socket.remoteAddress;
    this.rport        = socket.remotePort;

    this.socket.on("data",    this.on_net_data.bind(this));
    this.socket.on("error",   this.on_net_error.bind(this));
    this.socket.on("end",     this.on_net_end.bind(this));
    this.socket.on("timeout", this.on_net_timeout.bind(this));
    this.socket.on("drain",   this.on_net_drain.bind(this));
    this.socket.on("close",   this.on_net_close.bind(this));
}

util.inherits(APP_client, EventEmitter);


APP_client.prototype.on_package  = function (data) {
    //console.log("on app client package: ", data);
    this.emit('close', this);
};

APP_client.prototype.on_net_data = function (data) {
    this.buffer = this.buffer + data.toString();
    while (this.buffer.length > 0) {
        var ch = this.buffer[0];
        this.buffer = this.buffer.substring(1);
        if (ch === '\n' || ch === '\r') {
            this.on_package(this.package_buf);
        } else {
            this.package_buf = this.package_buf + ch;
        }
    }
};

APP_client.prototype.on_net_error = function (err) {
    console.log("app client, on_net_error", err);
    this.close();
};

APP_client.prototype.on_net_end = function () {
    console.log("app client, on_net_end");
};

APP_client.prototype.on_net_timeout = function () {
    console.log("app client, on_net_timeout");
};

APP_client.prototype.on_net_drain = function () {
    console.log("app client, on_net_drain");
};

APP_client.prototype.on_net_close = function (had_error) {
    if (had_error) {
        console.log("app client, on_net_close with error");
    } else {
        console.log("app client, on_net_close");
    }
    if (this.socket) {
        this.socket.destroy();
        this.socket = null;
    }
    this.emit('close', this);
};

APP_client.prototype.send = function (data) {
    try {
        this.socket.write(data);
    } catch (error) {
        console.log(error, data);
    }
};

APP_client.prototype.close = function () {
    if (this.socket) {
        this.socket.end();
        this.socket.destroy();
        this.socket = null;
    }
};

module.exports = APP_client;
