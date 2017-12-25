'use strict';

const http = require("http");
const express = require("express");
const app = express();
const SocketServer = require('ws').Server;


const PORT = process.env.PORT || 3000;
const server = http.createServer(app);

server.use((req, res) => res.send('Hello'));
server.listen(PORT, () => console.log(`Listening on ${ PORT }`));

const wss = new SocketServer({ server });

let clientId = 0;
wss.on('connection', (ws) => {
    let id = ++clientId;
    console.log('Client connected with id: ' + id);
    ws.on('request', (req) => {
        console.log('Client request from origin: ' + req.origin);
    });
    ws.on('close', () => {
        console.log('Client disconnected with id: ' + id);
    });
    ws.on('message', (data) => {
        console.log('Got message from '+ id +': ' + data);
        wss.clients.forEach((client) => {
            if (client !== ws) {
                client.send(data)
            }
        });
});
});



// setInterval(() => {
//   wss.clients.forEach((client) => {
//     client.send(new Date().toTimeString());
//   });
// }, 1000);
