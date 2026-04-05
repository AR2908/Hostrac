/**
 * Hostrac - Student Dashboard (Full Updated with Auto-Sync & Sound)
 */
const API_BASE_URL = 'https://hostrac.onrender.com';
const user = JSON.parse(localStorage.getItem('user'));
const bell = new Audio('bell.wav'); // Sound file ka path
let lastStatus = ""; // Purane status ko yaad rakhne ke liye

if (!user || user.role !== 'student') {
    window.location.href = 'login.html';
}

// 1. Sidebar & Welcome Info
function setupUI() {
    if(document.getElementById('sidebarName')) document.getElementById('sidebarName').innerText = user.name;
    if(document.getElementById('sidebarRoom')) document.getElementById('sidebarRoom').innerText = "Room: " + (user.roomNo || "N/A");
    if(document.getElementById('welcomeMsg')) document.getElementById('welcomeMsg').innerText = "Welcome, " + user.name + "!";
}

// 2. Helper: Date & Time Formatting
function formatDateTime(dateString) {
    if (!dateString) return "";
    const date = new Date(dateString);
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    const t = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${d}/${m}/${y} | ${t}`;
}

// 3. Panel Switcher
function showPanel(id, el) {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    const targetPanel = document.getElementById('panel-' + id);
    if(targetPanel) targetPanel.classList.add('active');
    
    document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
    if(el) el.classList.add('active');
}

// 4. Load History & Check for Updates (Auto-Refresh)
async function loadMyHistory() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/student/history/${user._id}`);
        const history = await res.json();
        
        // --- NOTIFICATION LOGIC ---
        // Agar history mein koi data hai aur status change hua hai
        if (history.length > 0) {
            const currentReq = history[history.length - 1]; // Latest request
            
            // Agar status "Pending" se "Approved" ya "Rejected" hua ho
            if (lastStatus !== "" && currentReq.status !== lastStatus) {
                bell.play().catch(e => console.log("Interaction needed for sound"));
                alert(`🔔 Status Update: Your outpass is now ${currentReq.status}`);
            }
            lastStatus = currentReq.status;
        }

        const recentTable = document.getElementById('recentTable');
        const historyTable = document.getElementById('historyTable');
        
        if (recentTable) recentTable.innerHTML = '';
        if (historyTable) historyTable.innerHTML = '';

        // Stats Update
        if(document.getElementById('statTotal')) document.getElementById('statTotal').innerText = history.length;
        if(document.getElementById('statActive')) document.getElementById('statActive').innerText = history.filter(h => h.status === 'Approved').length;

        // Table Rendering
        [...history].reverse().forEach((h) => {
            const statusColor = h.status === 'Approved' ? '#27ae60' : (h.status === 'Rejected' ? '#e74c3c' : '#f39c12');
            const leaveDate = new Date(h.leaveDate).toLocaleDateString('en-GB');

            let rowHtml = "";

            if (h.entryTime) {
                rowHtml = `
                    <tr style="background-color: #f0fff4;">
                        <td>${leaveDate}</td>
                        <td>${h.reason}</td>
                        <td><b style="color: #27ae60">COMPLETED</b></td>
                        <td><b style="color:#27ae60">IN</b><br><small>${formatDateTime(h.entryTime)}</small></td>
                    </tr>`;
            } else if (h.exitTime) {
                rowHtml = `
                    <tr style="${h.gateStatus === 'Out' ? 'background-color: #fff5f5;' : ''}">
                        <td>${leaveDate}</td>
                        <td>${h.reason}</td>
                        <td><b style="color: ${statusColor}">${h.status}</b></td>
                        <td><b style="color:#d63031">OUT</b><br><small>${formatDateTime(h.exitTime)}</small></td>
                    </tr>`;
            } else {
                rowHtml = `
                    <tr>
                        <td>${leaveDate}</td>
                        <td>${h.reason}</td>
                        <td><b style="color: ${statusColor}">${h.status}</b></td>
                        <td><b style="color:#b2bec3">Not Started</b></td>
                    </tr>`;
            }

            if (historyTable) historyTable.innerHTML += rowHtml;
            if (recentTable) recentTable.innerHTML += rowHtml;
        });
    } catch (err) {
        console.error("Error loading history:", err);
    }
}

// 5. Apply Outpass Logic
const applyForm = document.getElementById('applyForm');
if(applyForm) {
    applyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const reason = document.getElementById('reason').value;
        const leaveDate = document.getElementById('leaveDate').value;
        const returnDate = document.getElementById('returnDate').value;

        try {
            const response = await fetch(`${API_BASE_URL}/api/student/apply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    studentId: user._id, 
                    reason, 
                    leaveDate, 
                    returnDate 
                })
            });

            const data = await response.json();

            if (data.success) {
                alert("✅ Application Submitted Successfully");
                applyForm.reset();
                showPanel('dashboard', document.querySelector('nav a:first-child'));
                loadMyHistory();
            } else {
                alert("❌ Error: " + data.message);
            }
        } catch (err) {
            console.error("Apply Error:", err);
            alert("Connection Error! Backend check karein.");
        }
    });
}

// 6. Logout
function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}

// --- AUTO REFRESH LOGIC ---
// Har 15 second mein student ka data update hoga
setInterval(loadMyHistory, 15000);

// Window Load par initialize karein
window.onload = () => {
    setupUI();
    loadMyHistory();
};
