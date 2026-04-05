/**
 * Hostrac - Guard Dashboard (Updated with EX-Student Logic)
 */
const API_BASE_URL = 'https://hostrac.onrender.com';
const guard = JSON.parse(localStorage.getItem('user'));

if (!guard || guard.role !== 'guard') {
    window.location.href = 'login.html';
} else {
    document.getElementById('guardName').innerText = guard.name;
}

// Panel Switcher
function showPanel(id, el) {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.getElementById('panel-' + id).classList.add('active');
    document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
    el.classList.add('active');
}

/**
 * Load Approved Leaves & Update UI
 */
async function loadApprovedLeaves() {
    try {
        const res = await fetch('${API_BASE_URL}/guard/approved');
        const leaves = await res.json();
        const tableBody = document.getElementById('guardTableBody');
        tableBody.innerHTML = '';

        let outCount = 0;

        leaves.reverse().forEach(req => {
            // --- EX-STUDENT LOGIC START ---
            let studentDisplayName = "";
            let roomDisplay = "";
            let nameStyle = "";

            if (req.studentId) {
                // Agar student active hai (Database mein maujood hai)
                studentDisplayName = req.studentId.name;
                roomDisplay = req.studentId.roomNo;
                nameStyle = "color: #2d3436;"; // Normal color
            } else {
                // Agar student delete (Ex-Student) ho gaya hai, toh backup fields use karein
                studentDisplayName = `EX- ${req.studentName || 'Student'}`;
                roomDisplay = req.roomNo || 'Left';
                nameStyle = "color: #d63031; font-weight: bold;"; // Red color alert for Guard
            }
            // --- EX-STUDENT LOGIC END ---

            const leaveDateFormatted = new Date(req.leaveDate).toLocaleDateString('en-GB');

            // --- BUTTON LOGIC START ---
            let actionHtml = "";

            // Agar student wapas aa chuka hai (In status + Entry Time exists)
            if (req.gateStatus === 'In' && req.entryTime) {
                actionHtml = `<span style="color:#27ae60; font-weight:bold; font-size:12px;">✅ COMPLETED</span>`;
            } 
            // Agar student abhi hostel ke andar hai (Pehli baar exit karega)
            else if (req.gateStatus === 'In') {
                actionHtml = `<button class="btn" style="background:#e67e22; color:white; border:none; padding:8px 12px; border-radius:8px; cursor:pointer;" 
                                onclick="updateGate('${req._id}', 'Out')">Mark Exit 🚪</button>`;
            } 
            // Agar student bahar hai (Wapas aane wala hai)
            else if (req.gateStatus === 'Out') {
                actionHtml = `<button class="btn" style="background:#2ecc71; color:white; border:none; padding:8px 12px; border-radius:8px; cursor:pointer;" 
                                onclick="updateGate('${req._id}', 'In')">Mark Entry 🏠</button>`;
                outCount++;
            }
            // --- BUTTON LOGIC END ---

            tableBody.innerHTML += `
                <tr>
                    <td><b style="${nameStyle}">${studentDisplayName}</b></td>
                    <td>${roomDisplay}</td>
                    <td>${leaveDateFormatted}</td>
                    <td>
                        <b style="color:${req.gateStatus === 'Out' ? '#d63031' : '#27ae60'}">
                            ${req.gateStatus === 'In' && req.entryTime ? 'RETURNED' : req.gateStatus.toUpperCase()}
                        </b>
                    </td>
                    <td style="text-align:center;">${actionHtml}</td>
                </tr>
            `;
        });

        // Update Stats
        document.getElementById('countApproved').innerText = leaves.length;
        document.getElementById('countOut').innerText = outCount;
        document.getElementById('countIn').innerText = (leaves.length - outCount);

    } catch (err) {
        console.error("Error loading guard data:", err);
    }
}

/**
 * Gate Update Function
 */
async function updateGate(id, status) {
    try {
        const res = await fetch('${API_BASE_URL}/api/guard/update-gate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requestId: id, gateStatus: status })
        });
        const data = await res.json();
        if(data.success) {
            loadApprovedLeaves(); // Refresh table immediately
        }
    } catch (err) {
        console.error("Gate update failed:", err);
    }
}

window.onload = loadApprovedLeaves;
