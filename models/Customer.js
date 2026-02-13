const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  productModel: { type: String, required: true },
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
  salesman: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  zone: { type: String },
  branch: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Customer', customerSchema);
