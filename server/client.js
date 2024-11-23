const express = require("express");
const http = require("http");
const app = express();
const PORT = 8080;
const server = http.createServer(app);
app.use(express.static("client"));
server.listen(PORT, () => console.log("client started"));
