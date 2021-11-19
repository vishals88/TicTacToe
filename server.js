const express = require('express')
const app = express()
app.use(express.static('client'))
const port = process.argv[2]
const server = require('http').createServer(app);
const io = require('socket.io')(server);

server.listen(port,()=>{
  console.log(`Server Listening on ${port}`);
})

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});


var players = {},
  unmatched;

io.sockets.on("connection", function (socket) {
    console.log("Player connected")
  socket.emit('connect',{msg:"hello"})
  joinGame(socket);

  if (getOpponent(socket)) {
    socket.emit("game.begin", {
      symbol: players[socket.id].symbol,
    });
    getOpponent(socket).emit("game.begin", {
      symbol: players[getOpponent(socket).id].symbol,
    });
  }

  socket.on("make.move", function (data) {
    if (!getOpponent(socket)) {
      return;
    }
    socket.emit("move.made", data);
    getOpponent(socket).emit("move.made", data);
  });

  socket.on("disconnect", function () {
    if (getOpponent(socket)) {
      getOpponent(socket).emit("opponent.left");
    }
  });
});

function joinGame(socket) {
  players[socket.id] = {
    opponent: unmatched,

    symbol: "X",
    // The socket that is associated with this player
    socket: socket,
  };
  if (unmatched) {
    players[socket.id].symbol = "O";
    players[unmatched].opponent = socket.id;
    unmatched = null;
  } else {
    unmatched = socket.id;
  }
}

function getOpponent(socket) {
  if (!players[socket.id].opponent) {
    return;
  }
  return players[players[socket.id].opponent].socket;
}
