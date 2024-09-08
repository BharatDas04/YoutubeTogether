const express = require("express");
const http = require("http");
const SocketIO = require("socket.io").Server;
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new SocketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  },
});

app.use(cors());
app.use(express.json());

const rooms = {};

const generateRoomCode = () => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let code;
  do {
    code = Array.from(
      { length: 6 },
      () => characters[Math.floor(Math.random() * characters.length)]
    ).join("");
  } while (rooms[code]);
  return code;
};

app.post("/createRoom", (req, res) => {
  const roomCode = generateRoomCode();
  rooms[roomCode] = { users: [], playing: [""] };
  res.json({ roomCode });
});

app.post("/joinRoom", (req, res) => {
  const { roomCode } = req.body;
  console.log(rooms);
  if (rooms[roomCode]) {
    res.json({ success: true });
  } else {
    res.json({ success: false });
  }
});

io.on("connection", (socket) => {
  console.log("A user Connected:", socket.id);
  socket.on("joinRoom", (roomCode) => {
    if (rooms[roomCode]) {
      socket.join(roomCode);
      rooms[roomCode].users.push(socket.id);
      const url = rooms[roomCode].playing;
      io.to(roomCode).emit("videoURL", { url: url[0] });
      admin = rooms[roomCode].users.length > 1;
      io.to(roomCode).emit("someoneJoined", { admin: admin });
      console.log(`User ${socket.id} joined room ${roomCode}`);
    } else {
      console.log("Invalid room code", roomCode);
    }
  });

  socket.on("chatMessage", (data) => {
    const { roomCode, message, name } = data;
    console.log("hello", data);
    io.to(roomCode).emit("message", { userId: socket.id, message, name });
  });

  socket.on("play", (data) => {
    const { roomCode } = data;
    io.to(roomCode).emit("play", { play: true });
  });

  socket.on("pause", (data) => {
    const { roomCode } = data;
    io.to(roomCode).emit("pause", { play: false });
  });

  socket.on("seek", (data) => {
    console.log("seeked");
    const { roomCode, currentTime } = data;
    io.to(roomCode).emit("seek", { currentTime: currentTime });
  });

  socket.on("videoURL", (data) => {
    const { roomCode, url } = data;
    console.log("IN VIDEO URL : ", data);
    rooms[roomCode].playing = [url];
    io.to(roomCode).emit("videoURL", { url: url });
  });

  socket.on("disconnect", () => {
    for (const [roomCode, room] of Object.entries(rooms)) {
      const index = room.users.indexOf(socket.id);
      if (index !== 1) {
        room.users.splice(index, 1);
        console.log(`User ${socket.id} left room ${roomCode}`);
        if (room.users.length === 0) {
          delete rooms[roomCode];
          console.log(`Room ${roomCode} deleted as it became empty`);
        }
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
