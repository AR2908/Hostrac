const Student = require('../models/Student');
const Warden = require('../models/Warden');
const Guard = require('../models/Guard');
const Admin = require('../models/Admin'); // 1. Admin Model Import karein

exports.login = async (req, res) => {
    const { email, password, role } = req.body;
    try {
        let user;
        
        // 2. Role ke hisaab se check karein
        if (role === 'student') {
            user = await Student.findOne({ email, password });
        } 
        else if (role === 'warden') {
            user = await Warden.findOne({ email, password });
        } 
        else if (role === 'guard') {
            user = await Guard.findOne({ email, password });
        }
        else if (role === 'admin') { // 3. Admin Login Logic
            user = await Admin.findOne({ email, password });
        }

        if (user) {
            // Role ko user object mein add kar dena taaki frontend pe redirect sahi ho
            const userData = user.toObject();
            userData.role = role; 
            
            res.json({ success: true, user: userData });
        } else {
            res.status(401).json({ success: false, message: "Invalid email, password or role" });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};