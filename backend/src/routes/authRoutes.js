const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs'); // 🚀 FIX: Isko top par import kiya gaya hai
const authController = require('../controllers/authController');

// Models Import (Sabhi roles ke liye)
const Student = require('../models/Student');
const Warden = require('../models/Warden');
const Guard = require('../models/Guard');
const User = require('../models/User'); // 🚀 FIX: Admin ke liye User model import kiya

// Login Route: http://localhost:5000/api/auth/login
router.post('/login', authController.login);

// =========================================================
// REGISTRATION API (Saves to Student Model)
// =========================================================
router.post('/register', async (req, res) => {
    try {
        const { name, college, fatherName, motherName, address, email, password, role } = req.body;

        // Check if email exists in ANY collection
        const checkStudent = await Student.findOne({ email });
        const checkWarden = await Warden.findOne({ email });
        const checkGuard = await Guard.findOne({ email });
        const checkAdmin = await User.findOne({ email }); // Admin collection check bhi jod diya security ke liye

        if (checkStudent || checkWarden || checkGuard || checkAdmin) {
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

// =========================================================
// 🚀 NEW SMART CHANGE PASSWORD API (Universal for All Roles)
// =========================================================
router.post('/change-password', async (req, res) => {
    try {
        const { userId, role, currentPassword, newPassword } = req.body;

        // 1. Role ke hisaab se sahi Database Model chunein
        let Model;
        if (role === 'admin') Model = User;
        else if (role === 'student') Model = Student;
        else if (role === 'warden') Model = Warden;
        else if (role === 'guard') Model = Guard;
        else return res.status(400).json({ success: false, message: 'Invalid User Role!' });

        // 2. User ko database mein dhundein
        const user = await Model.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found!' });
        }

        // 3. Password Check Karein (Smart Hashed vs Plain Text Logic)
        let isMatch = false;
        
        // Agar password encrypt (hash) hua hai (Jaise Admin ka hota hai)
        if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
            isMatch = await bcrypt.compare(currentPassword, user.password);
        } else {
            // Agar password normal text hai (Jaise Student ka hota hai)
            isMatch = (user.password === currentPassword);
        }

        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Incorrect Current Password!' });
        }

        // 4. Naya Password Save Karein (Pichle format ke hisaab se)
        if (user.password.startsWith('$2a$') || user.password.startsWith('$2b$')) {
            user.password = await bcrypt.hash(newPassword, 10);
        } else {
            user.password = newPassword;
        }

        await user.save();
        res.json({ success: true, message: 'Password updated successfully!' });

    } catch (error) {
        console.error('Change Password Error:', error);
        res.status(500).json({ success: false, message: 'Server error while changing password!' });
    }
});

// =========================================================
// EK BAAR CHALANE KE LIYE ADMIN SETUP
// =========================================================
router.get('/setup-admin', async (req, res) => {
    try {
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
