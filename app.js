'use strict';

const http = require("http");
const express = require("express");
const app = express();
const SocketServer = require('ws').Server;


const PORT = process.env.PORT || 3000;


const server = http.createServer(app);

//server.use((req, res) => res.send('Hello'));
server.listen(PORT, () => console.log(`Listening on ${ PORT }`));

const wss = new SocketServer({ server });

wss.on('connection', (ws) => {
    console.log('Client connected');
    ws.on('request', (req) => {
        console.log('Client request from origin: ' + req.origin);
    });
    ws.on('close', () => {
        console.log('Client disconnected');
    });
    ws.on('message', (data) => {
        console.log(data);
});
});



// setInterval(() => {
//   wss.clients.forEach((client) => {
//     client.send(new Date().toTimeString());
//   });
// }, 1000);
