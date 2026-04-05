const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const app = express();
app.use(cors());
const path = require('path');

// --- 1. Routes Import (Admin Route Yahan Add Kiya) ---
const authRoutes = require('./src/routes/authRoutes');
const studentRoutes = require('./src/routes/studentRoutes');
const wardenRoutes = require('./src/routes/wardenRoutes');
const guardRoutes = require('./src/routes/guardRoutes');
const adminRoutes = require('./src/routes/adminRoutes'); // <--- Yeh Nayi Line

dotenv.config();


// Middlewares
app.use(cors());
app.use(express.json());

// Frontend connection
app.use(express.static(path.join(__dirname, '../frontend')));

// --- 2. API Routes (Admin API Yahan Register Ki) ---
app.use('/api/auth', authRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/warden', wardenRoutes);
app.use('/api/guard', guardRoutes);
app.use('/api/admin', adminRoutes); // <--- Yeh Nayi Line (Address setup)

// Database Connection
mongoose.connect(process.env.MONGO_URI)
.then(() => console.log("✅ MongoDB Connected Successfully..."))
.catch(err => console.log("❌ MongoDB Connection Error:", err));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`\n🚀 SERVER RUNNING SUCCESSFULLY!`);
    console.log(`=============================================`);
    console.log(`👉 Click here to open Project:`);
    console.log(`\x1b[36mhttp://localhost:${PORT}/pages/login.html\x1b[0m`);
    console.log(`=============================================\n`);
});