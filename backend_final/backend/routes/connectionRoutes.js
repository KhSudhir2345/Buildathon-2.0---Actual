const express = require('express');
const router = express.Router();
const Connection = require('../models/Connection');
const { protect } = require('../middleware/auth');

router.use(protect);

// 1. SEND A REQUEST (Swipe Right)
router.post('/request', async (req, res) => {
  try {
    const { receiverId } = req.body;
    const senderId = req.user.id;

    // Prevent users from sending a request to themselves
    if (senderId === receiverId) {
      return res.status(400).json({ message: "You cannot match with yourself." });
    }

    // Check if a connection already exists between these two (in either direction)
    const existingConnection = await Connection.findOne({
      $or: [
        { senderId, receiverId },
        { senderId: receiverId, receiverId: senderId }
      ]
    });

    if (existingConnection) {
      return res.status(400).json({ message: "A connection request already exists or you are already matched." });
    }

    // Create the new pending connection
    const newConnection = new Connection({
      senderId,
      receiverId,
      status: 'PENDING'
    });

    await newConnection.save();
    res.status(201).json({ message: "Request sent successfully!", connection: newConnection });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// 2. GET PENDING REQUESTS (See who swiped on you)
router.get('/pending/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    if (userId !== req.user.id) {
      return res.status(403).json({ message: "You can only view your own pending requests." });
    }
    
    // Find requests where this user is the receiver AND status is PENDING
    // We populate the senderId so the frontend gets the sender's username and tech stack
    const pendingRequests = await Connection.find({ receiverId: userId, status: 'PENDING' })
      .populate('senderId', 'username githubHandle techStack topSkills bio lookingFor projects');
    res.status(200).json(pendingRequests);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// 3. ACCEPT A REQUEST
router.put('/accept/:connectionId', async (req, res) => {
  try {
    const { connectionId } = req.params;

    const connection = await Connection.findById(connectionId);
    if (!connection) {
      return res.status(404).json({ message: "Connection not found." });
    }
    if (connection.receiverId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Only the receiver can accept this request." });
    }

    connection.status = 'ACCEPTED';
    const updatedConnection = await connection.save();

    if (!updatedConnection) {
      return res.status(404).json({ message: "Connection not found." });
    }

    res.status(200).json({ message: "Request accepted! You can now chat.", connection: updatedConnection });

  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// REJECT A REQUEST
router.put('/reject/:connectionId', async (req, res) => {
  try {
    const { connectionId } = req.params;

    const connection = await Connection.findById(connectionId);
    if (!connection) {
      return res.status(404).json({ message: "Connection not found." });
    }
    if (connection.receiverId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Only the receiver can reject this request." });
    }

    connection.status = 'REJECTED';
    const updatedConnection = await connection.save();

    res.status(200).json({ message: "Request rejected.", connection: updatedConnection });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});
// GET all accepted matches for a specific user
router.get('/accepted/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    if (userId !== req.user.id) {
      return res.status(403).json({ message: "You can only view your own matches." });
    }
    // Find connections where user is either sender or receiver, and status is ACCEPTED
    const connections = await Connection.find({
      $or: [{ senderId: userId }, { receiverId: userId }],
      status: 'ACCEPTED'
    }).populate('senderId receiverId'); // Populate both so frontend can pick the other person
    
    res.status(200).json(connections);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
module.exports = router;
