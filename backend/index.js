const express = require("express");
const http = require("http");
const {Server} = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
	cors: {
		origin: "http://localhost:3000",
		methods: ["GET", "POST"],
	},
});

io.on("connection", (socket) => {
	socket.on("join_room", (roomId) => {
		socket.join(roomId);
		console.log(`User ${socket.id} joined room: ${roomId}`);

		socket.to(roomId).emit("user_joined", {userId: socket.id});
	});

	socket.on("request_canvas_state", (data) => {
		socket
			.to(data.roomId)
			.emit("request_canvas_state", {requesterId: socket.id});
	});

	socket.on("draw", (data) => {
		socket.to(data.roomId).emit("draw", data);
	});

	socket.on("send_canvas_state", (data) => {
		const {requesterId, canvasState} = data;
		io.to(requesterId).emit("receive_canvas_state", canvasState);
	});
});

server.listen(3001, () => {
	console.log("server running on http://localhost:3001");
});
