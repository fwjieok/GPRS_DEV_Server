'use strict';

var net = require("net");
var Dev_server = require("./dev_server.js");
var APP_server = require("./app_server.js");

function Server() {

    this.dev_server_port = 8000;
    this.app_server_port = 9000;
    
    this.dev_server      = null;
    this.dev_data_buf    = "";
    this.dev_package_buf = "";

    this.app_server    = null;
}

Server.prototype.on_dev_data = function (data) {
    console.log("[Server] on dev data:", data);

    if (0 === data.indexOf("GPRS:")) {
        data = data.split(":")[1];
    } else {
        return;
    }
        
    var list = this.app_server.client_list;
    for (var sid in list) {
        var client = list[sid];
        if (client) {
            client.send(data);
        }
    }
};

Server.prototype.on_app_data = function (data) {
    console.log("[Server] on app data:", data);
    
    var list = this.dev_server.dev_list;
    
    for (var sid in list) {
        var dev = list[sid];
        if (dev) {
            dev.send(data);
        }
    }
};

Server.prototype.start = function () {
    this.dev_server = new Dev_server(this, this.dev_server_port);
    this.dev_server.on('dev-data', this.on_dev_data.bind(this));

    this.dev_server.start();

    this.app_server = new APP_server(this, this.app_server_port);
    this.app_server.on('app-data', this.on_app_data.bind(this));

    this.app_server.start();
};

var server = new Server();
server.start();

