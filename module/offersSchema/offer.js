const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
      requestID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Request', 
        required: true
    },
    technicalID: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Technical',
        required: true
    },
      bid: {
        type: Number,
      },
      comments: {
        type: String,
      },
      status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
      }
});

const Offer = mongoose.model('Offer', offerSchema);

module.exports = Offer;
