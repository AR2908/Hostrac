const mongoose = require('mongoose');

const WardenSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    mobile: { type: String },
    role: { type: String, default: 'warden' }
});

module.exports = mongoose.model('Warden', WardenSchema);