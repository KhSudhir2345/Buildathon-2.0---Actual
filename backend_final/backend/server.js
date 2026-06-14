// server.js
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const http = require('http'); // Required for Socket.io
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');
const Message = require('./models/Message');

// Route Imports
const connectionRoutes = require('./routes/connectionRoutes');
const messageRoutes = require('./routes/messageRoutes');
const skillRoutes = require('./routes/skillRoutes');
const authRoutes = require('./routes/authRoutes');
const profileRoutes = require('./routes/profileRoutes');

// Initialize Express & HTTP Server
const app = express();
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: "*", // During development, allow all origins. Change this for production!
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Connect to Database
connectDB();

// Mount REST Routes
app.use('/api/connections', connectionRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
const userRoutes = require('./routes/userRoutes');
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'DevTinder API, Auth, Ranked Discovery, and WebSockets running' });
});
// --- THE REAL-TIME CHAT LOGIC (SOCKET.IO) ---
io.on('connection', (socket) => {
  console.log(`User connected to socket: ${socket.id}`);

  // 1. Join a specific chat room
  socket.on('join_chat', (connectionId) => {
    socket.join(connectionId);
    console.log(`Socket ${socket.id} joined room: ${connectionId}`);
  });

  // 2. Listen for incoming messages
  socket.on('send_message', async (data) => {
    // data should look like: { connectionId, senderId, content }
    try {
      // Step A: Save the message to MongoDB for permanence
      const newMessage = new Message({
        connectionId: data.connectionId,
        senderId: data.senderId,
        content: data.content
      });
      await newMessage.save();

      // We need the populated sender info before sending it back to the room
      const populatedMessage = await newMessage.populate('senderId', 'username');

      // Step B: Broadcast the message ONLY to the users in that specific connection room
      io.to(data.connectionId).emit('receive_message', populatedMessage);
      
    } catch (error) {
      console.error("Error saving message via socket:", error);
    }
  });

  // 3. Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

// --- SERVER BOOT ---
const PORT = process.env.PORT || 5000;

// IMPORTANT: Start the 'server', not 'app', so sockets work!
server.listen(PORT, () => {
  console.log(`Server & WebSockets running on port ${PORT}`);
});
