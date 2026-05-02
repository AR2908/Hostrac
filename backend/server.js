const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const app = express();
const path = require('path');

// --- 1. Routes Import ---
const authRoutes = require('./src/routes/authRoutes');
const studentRoutes = require('./src/routes/studentRoutes');
const wardenRoutes = require('./src/routes/wardenRoutes');
const guardRoutes = require('./src/routes/guardRoutes');
const adminRoutes = require('./src/routes/adminRoutes');

dotenv.config();

// Middlewares
app.use(cors());
app.use(express.json());

// Frontend connection
app.use(express.static(path.join(__dirname, '../frontend')));

// --- 2. API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/warden', wardenRoutes);
app.use('/api/guard', guardRoutes);
app.use('/api/admin', adminRoutes);

app.post('/api/guard/scan', async (req, res) => {
    const { studentId, requestId } = req.body;
    // Yahan backend logic aayega jo studentStatus ko IN/OUT switch karega
    // Note: Iska poora logic guardRoutes.js mein likhna hoga
    res.json({ success: true, message: "Status Updated via QR" });
});

// Database Connection
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("✅ MongoDB Connected Successfully..."))
.catch(err => console.log("❌ MongoDB Connection Error:", err));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`\n🚀 SERVER RUNNING SUCCESSFULLY!`);
    console.log(`=============================================`);
    console.log(`👉 Click here to open Project:`);
    console.log(`\x1b[36mhttp://hostrac.onrender.com/pages/login.html\x1b[0m`);
    console.log(`=============================================\n`);
});
