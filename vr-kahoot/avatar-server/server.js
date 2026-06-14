const https = require("https"); // ADD
const fs = require("fs");       // ADD
const express = require("express");
const socketIo = require("socket.io");
const easyrtc = require("easyrtc");

const app = express();

// ADD: Load certificates from the parent directory
const options = {
    key: fs.readFileSync("../key.pem"),
    cert: fs.readFileSync("../cert.pem")
};

// CHANGE: Create HTTPS server
const server = https.createServer(options, app);

// Socket.IO v2 style initialization
const io = socketIo.listen(server, {
    origins: "*:*" // Allow connections from localhost:8000
});

const rtc = easyrtc.listen(app, io, null, (err, rtcRef) => {
    console.log("Avatar Server (v2.5) Ready on Port 8081");
});

server.listen(8081, "0.0.0.0", () => {
    console.log("Avatar Server listening on 0.0.0.0:8081 (accessible to local network)");
});