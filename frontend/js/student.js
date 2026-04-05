/**
 * Hostrac - Student Dashboard (Fixed for Separate In/Out Entries)
 */
const API_BASE_URL = 'https://hostrac.onrender.com';
const user = JSON.parse(localStorage.getItem('user'));
if (!user || user.role !== 'student') window.location.href = 'login.html';

// Sidebar & Welcome
document.getElementById('sidebarName').innerText = user.name;
document.getElementById('sidebarRoom').innerText = "Room: " + (user.roomNo || "N/A");
document.getElementById('welcomeMsg').innerText = "Welcome, " + user.name + "!";

// Helper: Format Date & Time
function formatDateTime(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    const t = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${d}/${m}/${y} | ${t}`;
}

// Panel Switcher
function showPanel(id, el) {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.getElementById('panel-' + id).classList.add('active');
    document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
    if(el) el.classList.add('active');
}


async function loadMyHistory() {
    try {
        const res = await fetch(`https://hostrac.onrender.com/api/student/history/${user._id}`);
        const history = await res.json();
        
        const recentTable = document.getElementById('recentTable');
        const historyTable = document.getElementById('historyTable');
        
        if (recentTable) recentTable.innerHTML = '';
        if (historyTable) historyTable.innerHTML = '';

        // Stats
        document.getElementById('statTotal').innerText = history.length;
        document.getElementById('statActive').innerText = history.filter(h => h.status === 'Approved').length;

        // Data ko process karna
        history.reverse().forEach((h) => {
            const statusColor = h.status === 'Approved' ? '#27ae60' : (h.status === 'Rejected' ? '#e74c3c' : '#f39c12');
            const leaveDate = new Date(h.leaveDate).toLocaleDateString('en-GB');

            // 1. ENTRY (Wapas Aane Ka Record) - Agar entryTime exist karta hai
            if (h.entryTime) {
                const entryRow = `
                    <tr style="background-color: #f0fff4;">
                        <td>${leaveDate}</td>
                        <td>${h.reason}</td>
                        <td><b style="color: #27ae60">COMPLETED</b></td>
                        <td><b style="color:#27ae60">IN</b><br><small>${formatDateTime(h.entryTime)}</small></td>
                    </tr>
                `;
                if (historyTable) historyTable.innerHTML += entryRow;
                if (recentTable) recentTable.innerHTML += entryRow;
            }

            // 2. EXIT (Bahar Jaane Ka Record) - Agar exitTime exist karta hai
            if (h.exitTime) {
                const exitRow = `
                    <tr style="${h.gateStatus === 'Out' ? 'background-color: #fff5f5;' : ''}">
                        <td>${leaveDate}</td>
                        <td>${h.reason}</td>
                        <td><b style="color: ${statusColor}">${h.status}</b></td>
                        <td><b style="color:#d63031">OUT</b><br><small>${formatDateTime(h.exitTime)}</small></td>
                    </tr>
                `;
                if (historyTable) historyTable.innerHTML += exitRow;
                if (recentTable) recentTable.innerHTML += exitRow;
            }

            // 3. PENDING/APPROVED (Jab tak Gate Activity shuru nahi hui)
            if (!h.exitTime && !h.entryTime) {
                const pendingRow = `
                    <tr>
                        <td>${leaveDate}</td>
                        <td>${h.reason}</td>
                        <td><b style="color: ${statusColor}">${h.status}</b></td>
                        <td><b style="color:#b2bec3">Not Started</b></td>
                    </tr>
                `;
                if (historyTable) historyTable.innerHTML += pendingRow;
                if (recentTable) recentTable.innerHTML += pendingRow;
            }
        });
    } catch (err) {
        console.error("Error:", err);
    }
}

// Apply Form Logic
document.getElementById('applyForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const reason = document.getElementById('reason').value;
    const leaveDate = document.getElementById('leaveDate').value;
    const returnDate = document.getElementById('returnDate').value;

    const res = await fetch('${API_BASE_URL}/api/student/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: user._id, reason, leaveDate, returnDate })
    });

    const data = await res.json();
    if (data.success) {
        alert("Application Submitted Succesfully");
        document.getElementById('applyForm').reset();
        showPanel('dashboard', document.querySelector('nav a:first-child'));
        loadMyHistory();
    }
});

window.onload = loadMyHistory;
