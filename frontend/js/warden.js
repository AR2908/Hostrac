const API_BASE_URL = 'https://hostrac.onrender.com';
const user = JSON.parse(localStorage.getItem('user'));
let studentsCache = [];
let lastRequestCount = 0; 
const bell = new Audio('bell.mp3'); 

if (!user || user.role !== 'warden') {
    window.location.href = 'login.html';
} else {
    const nameDisp = document.getElementById('wNameDisp');
    if(nameDisp) nameDisp.innerText = user.name;
}

function showPanel(id, el) {
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    const target = document.getElementById('panel-' + id);
    if(target) target.classList.add('active');
    
    document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
    if(el) el.classList.add('active');
    
    if (id === 'admissions') loadPendingAdmissions();
    if (id === 'outpass') loadOutpass();
    if (id === 'records') loadRecords();
}

// ==========================================
// 🚀 RECORDS & SEARCH LOGIC
// ==========================================
async function loadRecords() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/warden/all-students`);
        if (!res.ok) throw new Error("Failed to fetch");
        
      const allFetchedStudents = await res.json();

studentsCache = allFetchedStudents
  .filter(s => s.status !== 'Pending')
  .sort((a, b) => a.name.localeCompare(b.name)); 

        const outStudentsCount = studentsCache.filter(s => s.currentStatus === 'Out').length;
        if(document.getElementById('count-total')) document.getElementById('count-total').innerText = studentsCache.length;
        if(document.getElementById('count-out')) document.getElementById('count-out').innerText = outStudentsCount;
        if(document.getElementById('count-in')) document.getElementById('count-in').innerText = studentsCache.length - outStudentsCount;
        searchStudents(); 
        
    } catch (err) { console.error(err); }
}

function searchStudents() {
    const searchTerm = document.getElementById('studentSearchInput').value.toLowerCase();
    
    const filteredList = studentsCache.filter(s => 
        s.name.toLowerCase().includes(searchTerm) || 
        (s.roomNo && s.roomNo.toString().toLowerCase().includes(searchTerm))
    );
    
    renderStudentTable(filteredList);
}

function renderStudentTable(list) {
    const tbody = document.getElementById('recordsBody');
    if(!tbody) return;
    tbody.innerHTML = '';

    if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding: 20px; color: gray;">No students found matching your search.</td></tr>';
        return;
    }

    list.forEach((s) => {
        const isOut = s.currentStatus === 'Out';
        const statusStyle = isOut 
            ? "background: #fff5f5; color: #e53e3e; border: 1px solid #feb2b2;" 
            : "background: #f0fff4; color: #38a169; border: 1px solid #9ae6b4;";

        const isFeesPaid = s.feesStatus === 'Paid';
        const feesBadgeStyle = isFeesPaid 
            ? "background: #f0fff4; color: #27ae60; padding: 4px 8px; border-radius: 6px; font-weight: bold; border: 1px solid #27ae60;" 
            : "background: #fff5f5; color: #e74c3c; padding: 4px 8px; border-radius: 6px; font-weight: bold; border: 1px solid #e74c3c;";

        tbody.innerHTML += `
            <tr>
                <td>
                    <b class="clickable-name" onclick="viewStudentHistory('${s._id}', '${s.name}')">
                        ${s.name}
                    </b>
                </td>
                <td>${s.roomNo || 'N/A'}</td>
                <td>
                    <span style="padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: bold; display: inline-block; ${statusStyle}">
                        ${isOut ? 'OUT 🚩' : 'IN ✅'}
                    </span>
                </td>
                <td><span style="${feesBadgeStyle}">${s.feesStatus || 'Unpaid'}</span></td>
                <td><button class="btn btn-primary" style="padding:5px 12px; font-size:11px;" onclick="openProfileFromList('${s._id}')">View Profile</button></td>
            </tr>`;
    });
}

function openProfileFromList(studentId) {
    const index = studentsCache.findIndex(s => s._id === studentId);
    if(index !== -1) openProfile(index);
}

// ==========================================
// 🚀 OUTPASS LOGIC (LATEST ON TOP)
// ==========================================
async function loadOutpass() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/warden/leave-requests`);
        const data = await res.json();
        
        const pendingRequests = data.filter(r => r.status === 'Pending');
        if (pendingRequests.length > lastRequestCount && lastRequestCount !== 0) {
            bell.play().catch(e => {});
        }
        lastRequestCount = pendingRequests.length;

        const tbody = document.getElementById('outpassBody');
        if(!tbody) return;
        tbody.innerHTML = '';

        [...data].reverse().forEach(req => {
            let displayName = req.studentId ? req.studentId.name : `EX- ${req.studentName || ''}`;
            let displayRoom = req.studentId ? req.studentId.roomNo : (req.roomNo || 'N/A');
            
            let actionHtml = (req.status === 'Pending') ? `
                    <div style="display: flex; gap: 8px; justify-content: center; align-items: center;">
                        <button class="btn btn-primary" style="padding: 8px 12px; font-size: 12px; background: #10b981; box-shadow: 0 4px 10px rgba(16, 185, 129, 0.2);" onclick="updateReq('${req._id}', 'Approved')">
                            <i class="fas fa-check-circle"></i> Approve
                        </button>
                        <button class="btn btn-danger" style="padding: 8px 12px; font-size: 12px;" onclick="updateReq('${req._id}', 'Rejected')">
                            <i class="fas fa-times-circle"></i> Reject
                        </button>
                    </div>
                ` : `<span class="${req.status === 'Approved' ? 'fees-paid' : 'fees-unpaid'}">${req.status}</span>`;

            tbody.innerHTML += `
                <tr>
                    <td><b>${displayName}</b></td>
                    <td>${displayRoom}</td>
                    <td class="reason-text">${req.reason}</td>
                    <td>
                        <small>Leave: ${new Date(req.leaveDate).toLocaleDateString('en-GB')}</small><br>
                        <small>Return: ${new Date(req.returnDate).toLocaleDateString('en-GB')}</small>
                    </td>
                    <td style="text-align:center;">${actionHtml}</td>
                </tr>`;
        });
    } catch (err) { console.error(err); }
}

async function updateReq(id, status) {
    try {
        const res = await fetch(`${API_BASE_URL}/api/warden/update-leave`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requestId: id, status })
        });
        if(res.ok) {
            showSmartAlert('success', 'Updated!', `Outpass request ${status} successfully.`);
            loadOutpass();
            loadRecords(); 
        }
    } catch (err) { console.error("Update failed:", err); }
}

async function viewStudentHistory(studentId, studentName) {
    try {
        const res = await fetch(`${API_BASE_URL}/api/student/history/${studentId}`);
        const history = await res.json();
        
        document.getElementById('historyStudentName').innerText = `${studentName}'s Record`;
        const tbody = document.getElementById('historyModalBody');
        tbody.innerHTML = '';

        if (history.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:20px;">No history found.</td></tr>';
        } else {
            [...history].reverse().forEach(h => {
                const statusColor = h.status === 'Approved' ? '#27ae60' : (h.status === 'Rejected' ? '#e74c3c' : '#f39c12');
                tbody.innerHTML += `
                    <tr>
                        <td><span class="date-box">${new Date(h.leaveDate).toLocaleDateString('en-GB')}</span></td>
                        <td class="reason-text">${h.reason}</td>
                        <td><b style="color: ${statusColor}">${h.status}</b></td>
                       <td>
    <small>
        <b>Exit:</b> ${h.exitTime ? new Date(h.exitTime).toLocaleString('en-IN', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : '---'}
    </small><br>
    <small>
        <b>Entry:</b> ${h.entryTime ? new Date(h.entryTime).toLocaleString('en-IN', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : '---'}
    </small>
</td>
                    </tr>`;
            });
        }
        document.getElementById('historyModal').style.display = 'block';
    } catch (err) { showSmartAlert('error', 'Error', 'History fetch failed'); }
}

// ==========================================
// 🚀 ADMISSION MANAGEMENT
// ==========================================
async function loadPendingAdmissions() {
    try {
        const res = await fetch(`${API_BASE_URL}/api/admin/pending-students`);
        const students = await res.json();
        
        const tbody = document.getElementById('admissionTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (students.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; color: gray; padding: 20px;">No pending admissions right now.</td></tr>`;
            return;
        }

        students.forEach(student => {
            tbody.innerHTML += `
                <tr>
                    <td>
                        <b>${student.name || 'No Name'}</b><br>
                        <small style="color: #64748b;">${student.email || 'No Email'}</small><br>
                        <small style="color: #64748b;">${student.mobile || 'No Mob'}</small><br>
                        <small style="color: #6c63ff; font-weight: bold;">${student.collegeName || 'N/A'}</small>
                    </td>
                    <td>
                        <small><b>FATHER:</b> ${student.fatherName || '---'}</small><br>
                        <small><b>MOTHER:</b> ${student.motherName || '---'}</small>
                    </td>
                    <td><small style="color: #64748b;">${student.address || '---'}</small></td>
                    <td style="text-align: center;">
                        <div style="display: flex; gap: 8px; justify-content: center; align-items: center;">
                            <button class="btn btn-primary" style="padding: 8px 12px; font-size: 12px; background: #10b981;" onclick="approveStudent('${student._id}')">
                                <i class="fas fa-check-circle"></i> Approve
                            </button>
                            <button class="btn btn-danger" style="padding: 8px 12px; font-size: 12px;" onclick="rejectStudent('${student._id}')">
                                <i class="fas fa-times-circle"></i> Reject
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
    } catch (err) { console.error("Error loading admissions:", err); }
}

function approveStudent(studentId) {
    document.getElementById('allotStudentId').value = studentId;
    document.getElementById('allotRoomNo').value = ""; 
    document.getElementById('roomAllotModal').style.display = 'flex';
}

function closeRoomModal() {
    document.getElementById('roomAllotModal').style.display = 'none';
}

async function confirmRoomAllotment() {
    const studentId = document.getElementById('allotStudentId').value;
    const roomNo = document.getElementById('allotRoomNo').value;
    
    if (!roomNo || roomNo.trim() === "") {
        showSmartAlert('warning', 'Missing Room', 'Please enter a room number to approve.');
        return;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/api/admin/approve-student`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ studentId: studentId, roomNo: roomNo, status: 'Active' })
        });

        const data = await res.json();
        if (data.success) {
            closeRoomModal(); 
            showSmartAlert('success', 'Approved!', `Student has been approved & allotted Room: ${roomNo}`);
            loadPendingAdmissions(); 
            loadRecords(); 
        } else {
            showSmartAlert('error', 'Error', data.message);
        }
    } catch (err) {
        showSmartAlert('error', 'Network Error', 'Server is down or unreachable!');
    }
}

async function rejectStudent(studentId) {
    if(confirm("❌ Are you sure you want to reject and delete this registration request?")) {
        try {
            const res = await fetch(`${API_BASE_URL}/api/admin/reject-student`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ studentId: studentId })
            });
            
            if (res.ok) {
                showSmartAlert('success', 'Rejected', 'Registration request rejected and deleted.');
                loadPendingAdmissions();
            }
        } catch (err) { console.error(err); }
    }
}

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
function openProfile(i) {
    const s = studentsCache[i];
    const formattedDate = s.admissionDate ? new Date(s.admissionDate).toLocaleDateString('en-GB') : '09/04/2026';
    
    const isFeesPaid = s.feesStatus === 'Paid';
    const feesBadgeStyle = isFeesPaid 
        ? "background: #f0fff4; color: #27ae60; padding: 4px 8px; border-radius: 6px; font-weight: bold; border: 1px solid #27ae60;" 
        : "background: #fff5f5; color: #e74c3c; padding: 4px 8px; border-radius: 6px; font-weight: bold; border: 1px solid #e74c3c;";

    document.getElementById('modalBody').innerHTML = `
        <div class="modal-item" style="margin-bottom:10px;"><label style="font-size:10px; font-weight:700; color:var(--primary);">COLLEGE</label><br><span>${s.collegeName || '-'}</span></div>
        <div style="margin-bottom:10px;"><label style="font-weight:700; color:var(--primary); font-size:10px;">Hostel Admission Date</label><br><b>${formattedDate}</b></div>
        <div class="modal-item" style="margin-bottom:10px;"><label style="font-size:10px; font-weight:700; color:var(--primary);">MOBILE</label><br><span>${s.mobile || '-'}</span></div>
        <div class="modal-item" style="margin-bottom:10px;"><label style="font-size:10px; font-weight:700; color:var(--primary);">FATHER NAME</label><br><span>${s.fatherName || '-'}</span></div>
        <div class="modal-item" style="margin-bottom:10px;"><label style="font-size:10px; font-weight:700; color:var(--primary);">MOTHER NAME</label><br><span>${s.motherName || '-'}</span></div>
        <div class="modal-item" style="margin-bottom:10px;"><label style="font-size:10px; font-weight:700; color:var(--primary);">FEES STATUS</label><br><span style="${feesBadgeStyle}">${s.feesStatus || 'Unpaid'}</span></div>
        <div class="modal-item" style="margin-bottom:10px;"><label style="font-size:10px; font-weight:700; color:var(--primary);">ADDRESS</label><br><span>${s.address || '-'}</span></div>
    `;
    document.getElementById('profileModal').style.display = 'block';
}

function closeModal() { document.getElementById('profileModal').style.display = 'none'; }

function logout() {
    showSmartConfirm("Logout?", "Are you sure you want to log out?", function() {
        localStorage.clear();
        window.location.href = 'login.html';
    });
}

setInterval(() => { loadOutpass(); loadRecords(); loadPendingAdmissions(); }, 10000);
window.onload = () => { loadOutpass(); loadRecords(); loadPendingAdmissions(); };
