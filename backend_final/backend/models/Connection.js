const mongoose = require('mongoose');

const connectionSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { 
    type: String, 
    enum: ['PENDING', 'ACCEPTED', 'REJECTED'], 
    default: 'PENDING' 
  }
}, { timestamps: true });


// Prevent duplicate requests between the same two users
connectionSchema.index({ senderId: 1, receiverId: 1 }, { unique: true });

module.exports = mongoose.model('Connection', connectionSchema);