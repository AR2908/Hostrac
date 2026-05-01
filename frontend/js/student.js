const API_BASE_URL = 'https://hostrac.onrender.com';
const user = JSON.parse(localStorage.getItem('user'));
const bell = new Audio(window.location.origin + '/bell.mp3'); 
let lastRequestStatus = ""; 

if (!user || user.role !== 'student') {
    window.location.href = 'login.html';
} else {
    if(document.getElementById('sidebarName')) document.getElementById('sidebarName').innerText = user.name;
    if(document.getElementById('sidebarRoom')) document.getElementById('sidebarRoom').innerText = "Room: " + (user.roomNo || "N/A");
}

function formatDateTime(dateString) {
    if (!dateString) return "---";
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} | ${date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
}

async function loadMyHistory() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/student/history/${user._id}`);
        if (!res.ok) throw new Error("Connection Error");
        const history = await res.json();
        
        if (history.length > 0) {
            const latestRequest = history[history.length - 1]; 
            
            // --- QR CODE GENERATION LOGIC ---
            const qrContainer = document.getElementById('qrcode');
            if (qrContainer) {
                qrContainer.innerHTML = ""; // Clear old QR
                if (latestRequest.status === 'Approved' && !latestRequest.entryTime) {
                    // QR mein student ID aur request ID store kar rahe hain scan ke liye
                    new QRCode(qrContainer, {
                        text: JSON.stringify({ studentId: user._id, requestId: latestRequest._id }),
                        width: 180,
                        height: 180,
                        colorDark : "#2d3436",
                        colorLight : "#ffffff"
                    });
                    document.getElementById('qrStatusMsg').innerText = "Scan this at the Gate";
                } else {
                    qrContainer.innerHTML = "<p style='font-size:12px; color:#636e72;'>QR will appear here once Approved</p>";
                }
            }

            if (lastRequestStatus !== "" && latestRequest.status !== lastRequestStatus) {
                bell.play().catch(e => {});
                alert(`📢 Status Update: Your outpass is now ${latestRequest.status.toUpperCase()}`);
            }
            lastRequestStatus = latestRequest.status;
        }

        const recentTable = document.getElementById('recentTable');
        if (recentTable) recentTable.innerHTML = '';

        [...history].reverse().forEach((h) => {
            const statusColor = h.status === 'Approved' ? '#27ae60' : (h.status === 'Rejected' ? '#e74c3c' : '#f39c12');
            const leaveDateStr = new Date(h.leaveDate).toLocaleDateString('en-GB');

            let row = `<tr>
                <td>${leaveDateStr}</td>
                <td>${h.reason}</td>
                <td><b style="color: ${statusColor}">${h.status}</b></td>
                <td>${h.exitTime ? `<b style="color:#d63031">OUT</b>` : (h.entryTime ? `<b style="color:#27ae60">IN</b>` : 'Waiting')}</td>
            </tr>`;
            if (recentTable) recentTable.innerHTML += row;
        });
    } catch (err) { console.error(err); }
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
