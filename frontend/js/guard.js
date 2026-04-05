/**
 * Hostrac - Guard Dashboard (Final Professional Version)
 * Features: Auto-Sync every 12s, Sound on Action, EX-Student Logic
 */

const API_BASE_URL = 'https://hostrac.onrender.com';
const guard = JSON.parse(localStorage.getItem('user'));
const bell = new Audio('bell.mp3'); // Ensure bell.wav is in your root folder
let lastApprovedCount = 0;

// 1. Authentication & Security Check
if (!guard || guard.role !== 'guard') {
    window.location.href = 'login.html';
} else {
    const guardNameDisp = document.getElementById('guardName');
    if (guardNameDisp) {
        guardNameDisp.innerText = guard.name;
    }
}

// 2. Panel Switcher Logic
function showPanel(id, el) {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    const targetPanel = document.getElementById('panel-' + id);
    if (targetPanel) {
        targetPanel.classList.add('active');
    }
    
    document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
    if (el) el.classList.add('active');
}

/**
 * 3. Load Approved Leaves & Update UI (Real-time)
 */
async function loadApprovedLeaves() {
    try {
        // Fetching all leave requests from Warden API
        const res = await fetch(`${API_BASE_URL}/api/warden/leave-requests`);
        if (!res.ok) throw new Error("Backend connection failed");
        
        const allData = await res.json();
        
        // Filter only those which are 'Approved'
        const approvedLeaves = allData.filter(req => req.status === 'Approved');

        // Notification Sound if a new approved request is found
        if (approvedLeaves.length > lastApprovedCount && lastApprovedCount !== 0) {
            bell.play().catch(e => console.log("Sound blocked: Click anywhere on page to enable audio."));
        }
        lastApprovedCount = approvedLeaves.length;

        const tableBody = document.getElementById('guardTableBody');
        if (!tableBody) return;
        tableBody.innerHTML = '';
        
        let outCount = 0;

        // Process and Reverse (latest on top)
        [...approvedLeaves].reverse().forEach(req => {
            // --- EX-STUDENT / DELETED STUDENT LOGIC ---
            let studentDisplayName = "";
            let roomDisplay = "";
            let nameStyle = "";

            if (req.studentId) {
                studentDisplayName = req.studentId.name;
                roomDisplay = req.studentId.roomNo || 'N/A';
                nameStyle = "color: #2d3436;"; 
            } else {
                studentDisplayName = `EX- ${req.studentName || 'Student'}`;
                roomDisplay = req.roomNo || 'Left';
                nameStyle = "color: #d63031; font-weight: bold;"; 
            }

            const leaveDateFormatted = new Date(req.leaveDate).toLocaleDateString('en-GB');

            // --- ACTION BUTTON LOGIC ---
            let actionHtml = "";

            // If Student has returned (In status + Entry Time recorded)
            if (req.gateStatus === 'In' && req.entryTime) {
                actionHtml = `<span style="color:#27ae60; font-weight:bold; font-size:12px;">✅ COMPLETED</span>`;
            } 
            // If Student is inside Hostel (Ready to Exit)
            else if (req.gateStatus === 'In') {
                actionHtml = `
                    <button class="btn" style="background:#e67e22; color:white; border:none; padding:8px 15px; border-radius:8px; cursor:pointer; font-weight:bold;" 
                        onclick="updateGate('${req._id}', 'Out')">Mark EXIT 🚪</button>`;
            } 
            // If Student is outside (Ready to Enter)
            else if (req.gateStatus === 'Out') {
                actionHtml = `
                    <button class="btn" style="background:#2ecc71; color:white; border:none; padding:8px 15px; border-radius:8px; cursor:pointer; font-weight:bold;" 
                        onclick="updateGate('${req._id}', 'In')">Mark ENTRY 🏠</button>`;
                outCount++;
            }

            // Append Row to Table
            tableBody.innerHTML += `
                <tr>
                    <td><b style="${nameStyle}">${studentDisplayName}</b></td>
                    <td>${roomDisplay}</td>
                    <td>${leaveDateFormatted}</td>
                    <td>
                        <b style="color:${req.gateStatus === 'Out' ? '#d63031' : '#27ae60'}">
                            ${(req.gateStatus === 'In' && req.entryTime) ? 'RETURNED' : req.gateStatus.toUpperCase()}
                        </b>
                    </td>
                    <td style="text-align:center;">${actionHtml}</td>
                </tr>
            `;
        });

        // Update Dashboard Stats
        if(document.getElementById('countApproved')) document.getElementById('countApproved').innerText = approvedLeaves.length;
        if(document.getElementById('countOut')) document.getElementById('countOut').innerText = outCount;
        if(document.getElementById('countIn')) document.getElementById('countIn').innerText = (approvedLeaves.length - outCount);

    } catch (err) {
        console.error("Guard Sync Error:", err);
    }
}

/**
 * 4. Update Gate Status (POST Request)
 */
async function updateGate(id, status) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/guard/update-gate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requestId: id, gateStatus: status })
        });

        const result = await response.json();

        if (result.success) {
            bell.play().catch(e => {}); // Play sound on success
            // Instant Refresh after action
            loadApprovedLeaves();
        } else {
            alert("❌ Failed to update status: " + (result.message || "Unknown error"));
        }
    } catch (err) {
        console.error("Update Gate Error:", err);
        alert("Server connection error. Please try again.");
    }
}

/**
 * 5. Global Functions
 */
function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}

// AUTO-REFRESH: Har 12 Seconds mein data sync hoga
setInterval(loadApprovedLeaves, 12000);

// Initialize on Page Load
window.onload = loadApprovedLeaves;
