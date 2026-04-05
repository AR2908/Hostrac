const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Login Route: http://localhost:5000/api/auth/login
router.post('/login', authController.login);

module.exports = router;
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