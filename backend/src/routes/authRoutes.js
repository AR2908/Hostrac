const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Models Import (For Registration Check)
const Student = require('../models/Student');
const Warden = require('../models/Warden');
const Guard = require('../models/Guard');

// Login Route: http://localhost:5000/api/auth/login
router.post('/login', authController.login);

// =========================================================
// 🚀 NEW REGISTRATION API (Saves to Student Model)
// =========================================================
router.post('/register', async (req, res) => {
    try {
        const { name, college, fatherName, motherName, address, email, password, role } = req.body;

        // Check if email exists in ANY collection
        const checkStudent = await Student.findOne({ email });
        const checkWarden = await Warden.findOne({ email });
        const checkGuard = await Guard.findOne({ email });

        if (checkStudent || checkWarden || checkGuard) {
            return res.status(400).json({ success: false, message: "Email already registered in system!" });
        }

        // Create new student with 'Pending' status
        const newStudent = new Student({
            name, email, password, collegeName: college, fatherName, motherName, address, role: 'student',
            status: 'Pending' // Admin isko Active karega
        });

        await newStudent.save();
        res.status(200).json({ success: true, message: "Registration successful! Pending Admin approval." });
    } catch (err) {
        console.error("Register Error:", err);
        res.status(500).json({ success: false, message: "Server Error" });
    }
});

// --- EK BAAR CHALANE KE LIYE ADMIN SETUP ---
router.get('/setup-admin', async (req, res) => {
    try {
        const User = require('../models/User'); // Path check kar lein
        const bcrypt = require('bcryptjs');

        // Check if admin already exists
        const oldAdmin = await User.findOne({ email: 'admin@gmail.com' });
        if (oldAdmin) return res.send("<h1>Admin already exists!</h1><p>Login with: admin@gmail.com / admin123</p>");

        const hashedPassword = await bcrypt.hash('admin123', 10);
        
        const newAdmin = new User({
            name: "Super Admin",
            email: "admin@gmail.com",
            password: hashedPassword,
            role: "admin",
            feesStatus: "Paid"
        });

        await newAdmin.save();
        res.send("<h1>✅ Admin Created Successfully!</h1><p>Email: <b>admin@gmail.com</b><br>Password: <b>admin123</b></p>");
    } catch (err) {
        res.status(500).send("Error: " + err.message);
    }
});

module.exports = router;
