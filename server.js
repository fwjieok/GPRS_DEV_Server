'use strict';

var net = require("net");
var Dev_server = require("./dev_server.js");
var APP_server = require("./app_server.js");

var ACK = String.fromCharCode(0x06);

function Server() {

    this.dev_server_port = 8000;
    this.app_server_port = 9000;
    
    this.dev_server      = null;
    this.dev_data_buf    = "";
    this.dev_package_buf = "";

    this.app_server    = null;
}


Server.prototype.on_dev_package = function (data) {
    var list = this.app_server.client_list;
    for (var sid in list) {
        var client = list[sid];
        if (client) {
            client.send(data);
        }
    }

    if (this.dev_server) {
        this.dev_server.write(ACK);
    }
};

Server.prototype.on_dev_heart = function (data) {
    if (this.dev_server) {
        this.dev_server.write(data);
    }
};

Server.prototype.on_dev_data = function (data) {
    this.dev_data_buf = this.dev_data_buf + data.toString();
    while (this.dev_data_buf.length > 0) {
        var ch = this.dev_data_buf[0];
        this.dev_data_buf = this.dev_data_buf.substring(1);
        if (ch === '@') {
            this.on_dev_heart(ch);
        } else if (ch === '\n' || ch === '\r') {
            if (this.dev_package_buf.length > 0) {
                console.log("on dev package: ", this.dev_package_buf);
                this.on_dev_package(this.dev_package_buf + "\n");
                this.dev_package_buf = "";
            }
        } else {
            this.dev_package_buf = this.dev_package_buf + ch;
        }
    }
};


Server.prototype.start = function () {
    this.dev_server = new Dev_server(this, this.dev_server_port);
    this.dev_server.on('dev-data', this.on_dev_data.bind(this));

    this.dev_server.start();

    this.app_server = new APP_server(this, this.app_server_port);
    this.app_server.start();
};

var server = new Server();
server.start();

