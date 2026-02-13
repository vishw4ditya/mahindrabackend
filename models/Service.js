const mongoose = require('mongoose');

const serviceSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  phone: { type: String, required: true },
  product: { type: String, required: true },
  type: { 
    type: String, 
    enum: ['Installation', 'Service'], 
    required: true 
  },
  location: {
    lat: Number,
    lng: Number,
    address: String,
    area: String,
    town: String,
    district: String,
    zipcode: String
  },
  lastVisitDate: { type: Date },
  nextVisitDate: { type: Date },
  visits: { type: Number, default: 0 },
  technician: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  zone: { type: String },
  branch: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Service', serviceSchema);
