const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Models Import (Sabhi roles ke liye)
const Student = require('../models/Student');
const Warden = require('../models/Warden');
const Guard = require('../models/Guard');
const Admin = require('../models/Admin'); // Admin ke liye Admin model import kiya

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
        const checkAdmin = await Admin.findOne({ email }); 

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
// 🚀 NEW SMART CHANGE PASSWORD API (FIXED)
// =========================================================
router.post('/change-password', async (req, res) => {
    try {
        // FIX 1: Frontend 'userId' bhej raha tha, isliye ise userId kiya
        const { userId, role, currentPassword, newPassword } = req.body;

        // FIX 2: Role check safe kiya (uppercase/lowercase dono chalenge)
        const checkRole = role ? role.toLowerCase() : '';
        let Model;
        
        if (checkRole === 'admin') Model = Admin;
        else if (checkRole === 'student') Model = Student;
        else if (checkRole === 'warden') Model = Warden;
        else if (checkRole === 'guard') Model = Guard;
        else return res.status(400).json({ success: false, message: 'Invalid User Role!' });

        // FIX 3: Variable ka naam userDoc rakha taaki uper wale Admin Model se clash na ho
        const userDoc = await Model.findById(userId);
        if (!userDoc) {
            return res.status(404).json({ success: false, message: 'Account not found!' });
        }

        // 3. Current Password ko simply match karein
        if (userDoc.password !== currentPassword) {
            return res.status(400).json({ success: false, message: 'Incorrect Current Password!' });
        }

        // 4. Naya Password simple text me save karein
        userDoc.password = newPassword;
        
        await userDoc.save();
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
        const oldAdmin = await Admin.findOne({ email: 'admin@gmail.com' });
        if (oldAdmin) return res.send("<h1>Admin already exists!</h1><p>Login with: admin@gmail.com / admin123</p>");

        const newAdmin = new Admin({
            name: "Super Admin",
            email: "admin@gmail.com",
            password: "admin123", // Plain text password
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
