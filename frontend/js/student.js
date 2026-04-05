/**
 * Hostrac - Student Dashboard (Fixed for Separate In/Out Entries)
 */

const API_BASE_URL = 'https://hostrac.onrender.com';
const user = JSON.parse(localStorage.getItem('user'));
const bell = new Audio(window.location.origin + '/bell.mp3'); // Path fixed
let lastRequestStatus = ""; 

// 1. Authentication Check
if (!user || user.role !== 'student') {
    window.location.href = 'login.html';
} else {
    if(document.getElementById('sidebarName')) document.getElementById('sidebarName').innerText = user.name;
    if(document.getElementById('sidebarRoom')) document.getElementById('sidebarRoom').innerText = "Room: " + (user.roomNo || "N/A");
    if(document.getElementById('welcomeMsg')) document.getElementById('welcomeMsg').innerText = "Welcome, " + user.name + "!";
}

/**
 * 2. Helper: Format Date & Time
 */
function formatDateTime(dateString) {
    if (!dateString) return "---";
    const date = new Date(dateString);
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    const t = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${d}/${m}/${y} | ${t}`;
}

/**
 * 3. Panel Switcher
 */
function showPanel(id, el) {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    const targetPanel = document.getElementById('panel-' + id);
    if(targetPanel) targetPanel.classList.add('active');
    
    document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
    if(el) el.classList.add('active');

    if(id === 'history' || id === 'dashboard') loadMyHistory();
}

/**
 * 4. Load Outpass History (With Separate In/Out Rows)
 */
async function loadMyHistory() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/student/history/${user._id}`);
        if (!res.ok) throw new Error("Connection Error");
        
        const history = await res.json();
        
        // --- NOTIFICATION LOGIC ---
        if (history.length > 0) {
            const latestRequest = history[history.length - 1]; 
            if (lastRequestStatus !== "" && latestRequest.status !== lastRequestStatus) {
                bell.play().catch(e => console.log("Audio needs interaction"));
                alert(`📢 Status Update: Your outpass is now ${latestRequest.status.toUpperCase()}`);
            }
            lastRequestStatus = latestRequest.status;
        }

        const recentTable = document.getElementById('recentTable');
        const historyTable = document.getElementById('historyTable');
        
        if (recentTable) recentTable.innerHTML = '';
        if (historyTable) historyTable.innerHTML = '';

        // Update Stats
        if(document.getElementById('statTotal')) document.getElementById('statTotal').innerText = history.length;
        if(document.getElementById('statActive')) document.getElementById('statActive').innerText = history.filter(h => h.status === 'Approved').length;

        // Process Table Rows (Latest on Top)
        [...history].reverse().forEach((h) => {
            const statusColor = h.status === 'Approved' ? '#27ae60' : (h.status === 'Rejected' ? '#e74c3c' : '#f39c12');
            const leaveDateStr = new Date(h.leaveDate).toLocaleDateString('en-GB');

            // --- CASE 1: ENTRY RECORD (Agar wapas aa chuke hain) ---
            if (h.entryTime) {
                const entryRow = `
                    <tr style="background-color: #f0fff4;">
                        <td>${leaveDateStr}</td>
                        <td>${h.reason}</td>
                        <td><b style="color: #27ae60">COMPLETED</b></td>
                        <td><b style="color:#27ae60">IN ✅</b><br><small>${formatDateTime(h.entryTime)}</small></td>
                    </tr>`;
                if (historyTable) historyTable.innerHTML += entryRow;
                if (recentTable) recentTable.innerHTML += entryRow;
            }

            // --- CASE 2: EXIT RECORD (Agar bahar gaye hain) ---
            if (h.exitTime) {
                const exitRow = `
                    <tr style="background-color: #fff5f5;">
                        <td>${leaveDateStr}</td>
                        <td>${h.reason}</td>
                        <td><b style="color: ${statusColor}">${h.status}</b></td>
                        <td><b style="color:#d63031">OUT 🚩</b><br><small>${formatDateTime(h.exitTime)}</small></td>
                    </tr>`;
                if (historyTable) historyTable.innerHTML += exitRow;
                if (recentTable) recentTable.innerHTML += exitRow;
            }

            // --- CASE 3: WAITING (Approved but not exited yet) ---
            if (!h.exitTime && !h.entryTime) {
                const waitingRow = `
                    <tr>
                        <td>${leaveDateStr}</td>
                        <td>${h.reason}</td>
                        <td><b style="color: ${statusColor}">${h.status}</b></td>
                        <td><b style="color:#b2bec3">Not Started</b></td>
                    </tr>`;
                if (historyTable) historyTable.innerHTML += waitingRow;
                if (recentTable) recentTable.innerHTML += waitingRow;
            }
        });
    } catch (err) {
        console.error("History Fetch Error:", err);
    }
}

/**
 * 5. Apply Outpass Form Logic
 */
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
                    reason: reason, 
                    leaveDate: leaveDate, 
                    returnDate: returnDate 
                })
            });

            const data = await response.json();

            if (data.success) {
                alert("✅ Outpass Applied Successfully!");
                applyForm.reset();
                showPanel('dashboard', document.querySelector('nav a:first-child'));
                loadMyHistory();
            } else {
                alert("❌ Failed: " + data.message);
            }
        } catch (err) {
            console.error("Apply Error:", err);
            alert("Server Error! Backend check karein.");
        }
    });
}

function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}

// Auto-Refresh
setInterval(loadMyHistory, 15000);
window.onload = loadMyHistory;
