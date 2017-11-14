'use strict';

var util         = require('util');
var EventEmitter = require('events').EventEmitter;
var global       = require('./global.js');

var ACK = String.fromCharCode(0x06);

function Dev_client(server, daemon, sessionId, socket) {

    this.sessionId    = sessionId;
    this.socket       = socket;
    this.buffer       = "";
    this.package_buf  = "";
    this.closed       = false;
    this.raddr        = socket.remoteAddress;
    this.rport        = socket.remotePort;

    this.timeout_counter = 0;
    
    this.socket.on("data",    this.on_net_data.bind(this));
    this.socket.on("error",   this.on_net_error.bind(this));
    this.socket.on("end",     this.on_net_end.bind(this));
    this.socket.on("timeout", this.on_net_timeout.bind(this));
    this.socket.on("drain",   this.on_net_drain.bind(this));
    this.socket.on("close",   this.on_net_close.bind(this));
}

util.inherits(Dev_client, EventEmitter);

Dev_client.prototype.log = function (msg) {
    console.log((new Date()).now(), "[Dev_client]", msg);
};

Dev_client.prototype.on_package = function (data) {
    this.log("on dev data: " + data);
    
    if (data.indexOf("GPRS") !== 0) {
        this.close();
        return;
    }

    this.send(ACK);
    this.emit('data', data);
};

Dev_client.prototype.on_net_data = function (data) {
    this.timeout_counter = 0;
    
    this.buffer = this.buffer + data.toString();
    while (this.buffer.length > 0) {
        var ch = this.buffer[0];
        this.buffer = this.buffer.substring(1);
        if (ch === '@') {     //心跳包
            this.send(ch);
        } else if (ch === '\n' || ch === '\r') {
            if (this.package_buf.length > 0) {
                this.on_package(this.package_buf + "\n");
                this.package_buf = "";
            }
        } else {
            this.package_buf = this.package_buf + ch;
        }
    }
};

Dev_client.prototype.on_net_error = function (err) {
    console.log("dev client, on_net_error", err);
    this.close();
};

Dev_client.prototype.on_net_end = function () {
    console.log("dev client, on_net_end");
};

Dev_client.prototype.on_net_timeout = function () {
    console.log("dev client, on_net_timeout");
};

Dev_client.prototype.on_net_drain = function () {
    console.log("dev client, on_net_drain");
};

Dev_client.prototype.on_net_close = function (had_error) {
    if (had_error) {
        console.log("dev client, on_net_close with error");
    } else {
        console.log("dev client, on_net_close");
    }
    this.emit('close', this);
};

Dev_client.prototype.send = function (data) {
    try {
        this.socket.write(data);
    } catch (error) {
        console.log(error, data);
    }
};

Dev_client.prototype.close = function () {
    if (this.socket) {
        this.socket.end();
        this.socket.destroy();
        this.socket = null;
    }
};

module.exports = Dev_client;
