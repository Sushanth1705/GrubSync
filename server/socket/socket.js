const { Server } = require('socket.io');

const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: '*', // For dev, allow all
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
    }
  });

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // Join Room
    socket.on('join-room', ({ roomCode, userId }) => {
      socket.join(roomCode);
      console.log(`User ${userId} joined room ${roomCode}`);
      // Broadcast to others in room that a member joined
      socket.to(roomCode).emit('member-joined', { userId });
    });

    // Add Item
    socket.on('add-item', ({ roomCode, item }) => {
      // Broadcast the newly added item to everyone in the room
      io.to(roomCode).emit('order-updated', { action: 'add', item });
    });

    // Remove Item
    socket.on('remove-item', ({ roomCode, itemId }) => {
      io.to(roomCode).emit('order-updated', { action: 'remove', itemId });
    });

    // Edit Item
    socket.on('edit-item', ({ roomCode, item }) => {
      io.to(roomCode).emit('order-updated', { action: 'edit', item });
    });

    // Update Status
    socket.on('update-status', ({ roomCode, status }) => {
      io.to(roomCode).emit('status-changed', { status });
    });

    // Mark Paid
    socket.on('mark-paid', ({ roomCode, paymentInfo }) => {
      io.to(roomCode).emit('payment-updated', { paymentInfo });
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected', socket.id);
    });
  });

  return io;
};

module.exports = initSocket;
