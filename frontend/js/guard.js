/**
 * Hostrac - Guard Dashboard (Fixed URL & Template Literals)
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
    if(el) el.classList.add('active');
}

/**
 * Load Approved Leaves & Update UI
 */
async function loadApprovedLeaves() {
    try {
        // --- FIXED: Backticks use kiye hain aur URL wahi rakha hai jo aapne check kiya ---
        const res = await fetch(`${API_BASE_URL}/api/warden/leave-requests`);
        const leavesAll = await res.json();
        
        // Sirf wahi dikhayein jo Approved hain
        const leaves = leavesAll.filter(req => req.status === 'Approved');

        const tableBody = document.getElementById('guardTableBody');
        if(!tableBody) return;
        tableBody.innerHTML = '';

        let outCount = 0;

        // Reverse taaki naye requests upar dikhen
        [...leaves].reverse().forEach(req => {
            // --- EX-STUDENT LOGIC ---
            let studentDisplayName = "";
            let roomDisplay = "";
            let nameStyle = "";

            if (req.studentId) {
                studentDisplayName = req.studentId.name;
                roomDisplay = req.studentId.roomNo;
                nameStyle = "color: #2d3436;"; 
            } else {
                studentDisplayName = `EX- ${req.studentName || 'Student'}`;
                roomDisplay = req.roomNo || 'Left';
                nameStyle = "color: #d63031; font-weight: bold;"; 
            }

            const leaveDateFormatted = new Date(req.leaveDate).toLocaleDateString('en-GB');

            // --- BUTTON LOGIC ---
            let actionHtml = "";
            if (req.gateStatus === 'In' && req.entryTime) {
                actionHtml = `<span style="color:#27ae60; font-weight:bold; font-size:12px;">✅ COMPLETED</span>`;
            } else if (req.gateStatus === 'In') {
                actionHtml = `<button class="btn" style="background:#e67e22; color:white; border:none; padding:8px 12px; border-radius:8px; cursor:pointer;" 
                                onclick="updateGate('${req._id}', 'Out')">Mark Exit 🚪</button>`;
            } else if (req.gateStatus === 'Out') {
                actionHtml = `<button class="btn" style="background:#2ecc71; color:white; border:none; padding:8px 12px; border-radius:8px; cursor:pointer;" 
                                onclick="updateGate('${req._id}', 'In')">Mark Entry 🏠</button>`;
                outCount++;
            }

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
        if(document.getElementById('countApproved')) document.getElementById('countApproved').innerText = leaves.length;
        if(document.getElementById('countOut')) document.getElementById('countOut').innerText = outCount;
        if(document.getElementById('countIn')) document.getElementById('countIn').innerText = (leaves.length - outCount);

    } catch (err) {
        console.error("Error loading guard data:", err);
    }
}

/**
 * Gate Update Function
 */
async function updateGate(id, status) {
    try {
        // --- FIXED: Backticks use kiye hain ---
        const res = await fetch(`${API_BASE_URL}/api/guard/update-gate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requestId: id, gateStatus: status })
        });
        const data = await res.json();
        if(data.success) {
            alert(`✅ Marked ${status.toUpperCase()} Successfully`);
            loadApprovedLeaves(); 
        } else {
            alert("❌ Update Failed: " + data.message);
        }
    } catch (err) {
        console.error("Gate update failed:", err);
    }
}

window.onload = loadApprovedLeaves;
