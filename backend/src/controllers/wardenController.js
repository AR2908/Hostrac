const LeaveRequest = require('../models/LeaveRequest');

exports.getAllRequests = async (req, res) => {
    try {
        // Student details (Name, Fees, Room) ke saath data nikalna
        const requests = await LeaveRequest.find().populate('studentId', 'name feesStatus roomNo');
        res.json(requests);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const { requestId, status } = req.body;
        await LeaveRequest.findByIdAndUpdate(requestId, { status });
        res.json({ message: `Request ${status} successfully`, success: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};