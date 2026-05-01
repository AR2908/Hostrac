/**
 * Hostrac - Student Dashboard (Final: Cache Bypass & Multi-Outpass Support)
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
    if(document.getElementById('welcomeMsg')) document.getElementById('welcomeMsg').innerText = "WELCOME, " + user.name + "!";
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
        // 🚀 FIX 1: CACHE BYPASS - Browser ko majboor karna ki fresh data laye
        const res = await fetch(`${API_BASE_URL}/api/student/history/${user._id}?t=${new Date().getTime()}`, {
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache'
            }
        });
        
        if (!res.ok) throw new Error("Connection Error");
        
        let history = await res.json();
        
        const qrContainer = document.getElementById('qrcode');
        const qrMsg = document.getElementById('qrStatusMsg');
        
        if (history.length > 0) {
            // 🚀 FIX 2: STRICT SORTING - Hamesha sabse latest (nayi) request uthana MongoDB ki ID ke base par
            history.sort((a, b) => a._id.localeCompare(b._id));
            const latestRequest = history[history.length - 1]; 
            
            const safeStatus = latestRequest.status ? latestRequest.status.trim().toLowerCase() : "";
            
            if (qrContainer) {
                qrContainer.innerHTML = ""; 
                
                // CASE 1: Warden Approved
                if (safeStatus === 'approved' && !latestRequest.entryTime) {
                    if(qrMsg) {
                        qrMsg.innerText = "✅ Approved! Show this QR to the Guard";
                        qrMsg.style.color = "#27ae60";
                    }
                    if (!user._id || !latestRequest._id) {
                        qrContainer.innerHTML = "<p style='color:red;'>Data Error.</p>";
                    } else {
                        // Image cache bust karne ke liye timestamp lagaya hai
                        const qrData = JSON.stringify({ studentId: user._id, requestId: latestRequest._id });
                        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(qrData)}&color=000000&bgcolor=ffffff&_t=${new Date().getTime()}`;
                        
                        qrContainer.innerHTML = `<img src="${qrUrl}" alt="Gate Pass QR" style="border: 4px solid #fff; border-radius: 10px; box-shadow: 0 4px 10px rgba(0,0,0,0.15); width: 160px; height: 160px; display: block; margin: 0 auto;">`;
                    }
                } 
                // CASE 2: Pending
                else if (safeStatus === 'pending') {
                    qrContainer.innerHTML = "<p style='color: #636e72; padding: 20px; font-size: 24px; margin: 0;'>⏳</p>";
                    if(qrMsg) {
                        qrMsg.innerText = "Wait for Warden's Approval...";
                        qrMsg.style.color = "#e17055";
                    }
                } 
                // CASE 3: Rejected
                else if (safeStatus === 'rejected') {
                    qrContainer.innerHTML = "<p style='color: #d63031; font-size: 40px; margin:0;'>❌</p>";
                    if(qrMsg) {
                        qrMsg.innerText = "Outpass Rejected by Warden";
                        qrMsg.style.color = "#d63031";
                    }
                } 
                // CASE 4: Completed
                else {
                    qrContainer.innerHTML = "<p style='color: #27ae60; font-size: 40px; margin:0;'>🏠</p>";
                    if(qrMsg) {
                        qrMsg.innerText = "You are currently in the Hostel";
                        qrMsg.style.color = "#2d3436";
                    }
                }
            }

            if (lastRequestStatus !== "" && safeStatus !== lastRequestStatus) {
                bell.play().catch(e => {});
                alert(`📢 Update: Your outpass is now ${latestRequest.status.toUpperCase()}`);
            }
            lastRequestStatus = safeStatus;
        } else {
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
        if(document.getElementById('statActive')) {
            document.getElementById('statActive').innerText = history.filter(h => h.status && h.status.trim().toLowerCase() === 'approved').length;
        }

        // Yahan display ke liye array ko ulta kiya hai (newest on top)
        [...history].reverse().forEach((h) => {
            const hStatus = h.status ? h.status.trim().toLowerCase() : "";
            const statusColor = hStatus === 'approved' ? '#27ae60' : (hStatus === 'rejected' ? '#e74c3c' : '#f39c12');
            const displayStatus = h.status ? h.status.toUpperCase() : "UNKNOWN";
            const leaveDateStr = new Date(h.leaveDate).toLocaleDateString('en-GB');

            if (h.entryTime) {
                const outTimeDisplay = h.exitTime ? formatDateTime(h.exitTime) : "---";
                const inTimeDisplay = formatDateTime(h.entryTime);
                
                const entryRow = `
                    <tr style="background-color: #f0fff4;">
                        <td>${leaveDateStr}</td>
                        <td>${h.reason}</td>
                        <td><b style="color: #27ae60">COMPLETED</b></td>
                        <td>
                            <div style="line-height: 1.4; text-align: left;">
                                <span style="color:#d63031; font-size: 11px;"><b>OUT 🚩:</b> ${outTimeDisplay}</span><br>
                                <span style="color:#27ae60; font-size: 11px;"><b>IN ✅:</b> ${inTimeDisplay}</span>
                            </div>
                        </td>
                    </tr>`;
                if (historyTable) historyTable.innerHTML += entryRow;
                if (recentTable) recentTable.innerHTML += entryRow;
            } else if (h.exitTime) {
                const exitRow = `
                    <tr style="background-color: #fff5f5;">
                        <td>${h.reason}</td>
                        <td>${leaveDateStr}</td>
                        <td><b style="color: ${statusColor}">${displayStatus}</b></td>
                        <td><b style="color:#d63031">OUT 🚩</b><br><small>${formatDateTime(h.exitTime)}</small></td>
                    </tr>`;
                if (historyTable) historyTable.innerHTML += exitRow;
                if (recentTable) recentTable.innerHTML += exitRow;
            } else {
                const waitingRow = `
                    <tr>
                        <td>${h.reason}</td>
                        <td>${leaveDateStr}</td>
                        <td><b style="color: ${statusColor}">${displayStatus}</b></td>
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

setInterval(loadMyHistory, 10000);
window.onload = loadMyHistory;

// ========================================================
// 🛑 1. PAST DATE & 2. DOUBLE APPLY BLOCKER (FIXED)
// ========================================================
document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. Past Date Logic ---
    const leaveInput = document.getElementById('leaveDate');
    const returnInput = document.getElementById('returnDate');

    if (leaveInput && returnInput) {
        const today = new Date().toISOString().split('T')[0];
        leaveInput.setAttribute('min', today);
        returnInput.setAttribute('min', today);

        leaveInput.addEventListener('change', function() {
            returnInput.setAttribute('min', this.value);
        });
    }

    // --- 2. Double Apply Blocker Logic ---
    // Naya variable naam (myForm) use kiya hai taaki error na aaye
    const myForm = document.getElementById('applyForm');
    
    if (myForm) {
        myForm.addEventListener('submit', function(e) {
            const recentTable = document.getElementById('recentTable');
            
            if (recentTable && recentTable.querySelector('tr')) {
                const latestRecordText = recentTable.querySelector('tr').innerText.toLowerCase();
                
                const isActive = latestRecordText.includes('pending') || 
                                 latestRecordText.includes('approved') || 
                                 latestRecordText.includes('out');
                
                const isFinished = latestRecordText.includes('completed') || 
                                   latestRecordText.includes('in') || 
                                   latestRecordText.includes('rejected');

                if (isActive && !isFinished) {
                    e.preventDefault(); 
                    e.stopImmediatePropagation(); 
                    
                    alert("⚠️ WARNING: Your outpass already acvtive or pending !");
                    return false;
                }
            }
        }, true); 
    }
});
