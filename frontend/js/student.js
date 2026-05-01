/**
 * Hostrac - Student Dashboard (Ultimate API QR Logic)
 */

const API_BASE_URL = 'https://hostrac.onrender.com';
const user = JSON.parse(localStorage.getItem('user'));
const bell = new Audio(window.location.origin + '/bell.mp3'); 
let lastRequestStatus = ""; 

if (!user || user.role !== 'student') {
    window.location.href = 'login.html';
} else {
    if(document.getElementById('sidebarName')) document.getElementById('sidebarName').innerText = user.name;
    if(document.getElementById('sidebarRoom')) document.getElementById('sidebarRoom').innerText = "Room: " + (user.roomNo || "N/A");
    if(document.getElementById('welcomeMsg')) document.getElementById('welcomeMsg').innerText = "Welcome, " + user.name + "!";
}

function formatDateTime(dateString) {
    if (!dateString) return "---";
    const date = new Date(dateString);
    const d = date.getDate().toString().padStart(2, '0');
    const m = (date.getMonth() + 1).toString().padStart(2, '0');
    const y = date.getFullYear();
    const t = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    return `${d}/${m}/${y} | ${t}`;
}

function showPanel(id, el) {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    const targetPanel = document.getElementById('panel-' + id);
    if(targetPanel) targetPanel.classList.add('active');
    
    document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
    if(el) el.classList.add('active');

    if(id === 'history' || id === 'dashboard') loadMyHistory();
}

async function loadMyHistory() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/student/history/${user._id}`);
        if (!res.ok) throw new Error("Connection Error");
        
        const history = await res.json();
        
        const qrContainer = document.getElementById('qrcode');
        const qrMsg = document.getElementById('qrStatusMsg');
        
        if (history.length > 0) {
            const latestRequest = history[history.length - 1]; 
            
            // --- ULTIMATE API QR CODE GENERATION ---
            if (qrContainer) {
                qrContainer.innerHTML = ""; // Purana data clean karo
                
                // CASE 1: Warden Approved, but Student not back yet (IN)
                if (latestRequest.status === 'Approved' && !latestRequest.entryTime) {
                    
                    if(qrMsg) {
                        qrMsg.innerText = "✅ Approved! Show this QR to the Guard";
                        qrMsg.style.color = "#27ae60";
                    }
                    
                    // Error Check: Ensure IDs are present
                    if (!user._id || !latestRequest._id) {
                        console.error("Missing Data for QR", user, latestRequest);
                        qrContainer.innerHTML = "<p style='color:red; font-size:12px;'>Data Error. Please re-login.</p>";
                    } else {
                        // ULTIMATE FIX: Direct Image API Approach (No external JS library needed)
                        const qrData = JSON.stringify({ studentId: user._id, requestId: latestRequest._id });
                        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrData)}&color=000000&bgcolor=ffffff`;
                        
                        // Seedha Image tag insert kar diya
                        qrContainer.innerHTML = `<img src="${qrUrl}" alt="Gate Pass QR" style="border: 4px solid #fff; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.15); width: 160px; height: 160px; display: block; margin: 0 auto;">`;
                        console.log("✅ API QR Successfully Loaded!");
                    }

                } 
                // CASE 2: Still Pending
                else if (latestRequest.status === 'Pending') {
                    qrContainer.innerHTML = "<p style='color: #636e72; padding: 20px; font-size: 24px; margin: 0;'>⏳</p>";
                    if(qrMsg) {
                        qrMsg.innerText = "Wait for Warden's Approval...";
                        qrMsg.style.color = "#e17055";
                    }
                } 
                // CASE 3: Rejected
                else if (latestRequest.status === 'Rejected') {
                    qrContainer.innerHTML = "<p style='color: #d63031; font-size: 40px; margin:0;'>❌</p>";
                    if(qrMsg) {
                        qrMsg.innerText = "Outpass Rejected by Warden";
                        qrMsg.style.color = "#d63031";
                    }
                } 
                // CASE 4: Completed (Student is IN)
                else {
                    qrContainer.innerHTML = "<p style='color: #27ae60; font-size: 40px; margin:0;'>🏠</p>";
                    if(qrMsg) {
                        qrMsg.innerText = "You are currently in the Hostel";
                        qrMsg.style.color = "#2d3436";
                    }
                }
            }

            // Notification Audio
            if (lastRequestStatus !== "" && latestRequest.status !== lastRequestStatus) {
                bell.play().catch(e => console.log("Audio needs user interaction first."));
                alert(`📢 Update: Your outpass is now ${latestRequest.status.toUpperCase()}`);
            }
            lastRequestStatus = latestRequest.status;
        } else {
            // No history yet
            if (qrContainer) qrContainer.innerHTML = "<p style='color:gray;'>No Outpass Applied</p>";
            if (qrMsg) {
                qrMsg.innerText = "Apply for an outpass to generate QR";
                qrMsg.style.color = "#636e72";
            }
        }

        // --- TABLE LOGIC ---
        const recentTable = document.getElementById('recentTable');
        const historyTable = document.getElementById('historyTable');
        
        if (recentTable) recentTable.innerHTML = '';
        if (historyTable) historyTable.innerHTML = '';

        if(document.getElementById('statTotal')) document.getElementById('statTotal').innerText = history.length;
        if(document.getElementById('statActive')) document.getElementById('statActive').innerText = history.filter(h => h.status === 'Approved').length;

        [...history].reverse().forEach((h) => {
            const statusColor = h.status === 'Approved' ? '#27ae60' : (h.status === 'Rejected' ? '#e74c3c' : '#f39c12');
            const leaveDateStr = new Date(h.leaveDate).toLocaleDateString('en-GB');

            if (h.entryTime) {
                const entryRow = `
                    <tr style="background-color: #f0fff4;">
                        <td>${h.reason}</td>
                        <td>${leaveDateStr}</td>
                        <td><b style="color: #27ae60">COMPLETED</b></td>
                        <td><b style="color:#27ae60">IN ✅</b><br><small>${formatDateTime(h.entryTime)}</small></td>
                    </tr>`;
                if (historyTable) historyTable.innerHTML += entryRow;
                if (recentTable) recentTable.innerHTML += entryRow;
            } else if (h.exitTime) {
                const exitRow = `
                    <tr style="background-color: #fff5f5;">
                    <td>${h.reason}</td>
                        <td>${leaveDateStr}</td>
                        <td><b style="color: ${statusColor}">${h.status}</b></td>
                        <td><b style="color:#d63031">OUT 🚩</b><br><small>${formatDateTime(h.exitTime)}</small></td>
                    </tr>`;
                if (historyTable) historyTable.innerHTML += exitRow;
                if (recentTable) recentTable.innerHTML += exitRow;
            } else {
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

// 10 Second Auto-Refresh
setInterval(loadMyHistory, 10000);
window.onload = loadMyHistory;
