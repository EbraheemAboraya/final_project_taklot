const socketIO = require('socket.io');
const socketManager = require('./socketManager');

let io = null;

exports.init = (server) => {
  io = socketIO(server);

  io.on('connection', (socket) => {
    const userId = socket.handshake.query.userId;
    console.log("User connected user ID:", userId, "Socket ID:", socket.id);
    socketManager.addUserSocket(userId,socket.id);


    socket.on('disconnect', () => {
        // Remove mapping on disconnect
        socketManager.removeUserSocket(userId);
    });
  });

  return io;
};

exports.getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

exports.sendNotificationToUser = (userId, event, message) => {
  const socketId = socketManager.getUserSocket(userId);
  if (socketId) {
    io.to(socketId).emit(event, message);
    console.log(`Notification sent to user ${userId} on socket ${socketId}`);
  } else {
    console.log(`No socket found for user ${userId}`);
  }
};