const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  connectionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Connection', required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Message', messageSchema);