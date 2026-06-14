// routes/messageRoutes.js
const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Connection = require('../models/Connection');
const { protect } = require('../middleware/auth');

router.use(protect);

// GET all messages for a specific connection
router.get('/:connectionId', async (req, res) => {
  try {
    const { connectionId } = req.params;

    // Optional Security Check: Verify the connection is actually ACCEPTED
    const connection = await Connection.findById(connectionId);
    if (!connection || connection.status !== 'ACCEPTED') {
      return res.status(403).json({ message: "Cannot fetch messages for an invalid or unaccepted connection." });
    }
    const isParticipant =
      connection.senderId.toString() === req.user.id ||
      connection.receiverId.toString() === req.user.id;
    if (!isParticipant) {
      return res.status(403).json({ message: "You are not part of this connection." });
    }

    // Fetch messages and sort by oldest first
    const messages = await Message.find({ connectionId })
      .sort({ createdAt: 1 })
      .populate('senderId', 'username'); // Get the sender's username to display in the UI

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
