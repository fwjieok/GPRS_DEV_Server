#!/bin/bash

while true; do

    node server.js
    pid=$!
    wait $!
    sleep 1

done
