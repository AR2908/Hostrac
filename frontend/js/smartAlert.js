
function showSmartAlert(type, title, message) {
    // Agar pehle se koi alert khula hai, toh usko hata do
    const existingAlert = document.getElementById('smartAlertOverlay');
    if (existingAlert) {
        existingAlert.remove();
    }

    // Type ke hisaab se Icon aur Theme set karna
    let iconClass = "";
    let themeClass = "";

    if (type === 'success') {
        iconClass = "fas fa-check";
        themeClass = "smart-alert-success";
    } else if (type === 'error') {
        iconClass = "fas fa-times";
        themeClass = "smart-alert-error";
    } else if (type === 'warning') {
        iconClass = "fas fa-exclamation-triangle";
        themeClass = "smart-alert-warning";
    } else {
        // Default (agar koi galat spelling daal de)
        iconClass = "fas fa-info";
        themeClass = "smart-alert-success"; 
    }

    // HTML Structure Generate karna (Bina kisi extra page HTML ke!)
    const alertHTML = `
        <div id="smartAlertOverlay" class="smart-alert-overlay">
            <div class="smart-alert-box ${themeClass}">
                <div class="smart-icon-ring">
                    <i class="${iconClass}"></i>
                </div>
                <h2>${title}</h2>
                <p>${message}</p>
                <button class="smart-ok-btn" onclick="closeSmartAlert()">OK</button>
            </div>
        </div>
    `;

    // Code ko page (body) ke aakhiri me chipka dena
    document.body.insertAdjacentHTML('beforeend', alertHTML);
}

// ==========================================
// SMART CONFIRM (For Logout & Delete Actions)
// ==========================================
function showSmartConfirm(title, message, onConfirmCallback) {
    const existingAlert = document.getElementById('smartAlertOverlay');
    if (existingAlert) existingAlert.remove();

    const alertHTML = `
        <div id="smartAlertOverlay" class="smart-alert-overlay">
            <div class="smart-alert-box" style="transform: scale(1); opacity: 1;">
                <div class="smart-icon-ring" style="border-color: #fecaca; color: #ef4444; background: #fef2f2;">
                    <i class="fas fa-sign-out-alt"></i>
                </div>
                <h2>${title}</h2>
                <p>${message}</p>
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button class="smart-ok-btn" style="background: #f1f5f9; color: #475569; box-shadow: none;" onclick="closeSmartAlert()">Cancel</button>
                    <button class="smart-ok-btn" style="background: #ef4444; box-shadow: 0 4px 15px rgba(239, 68, 68, 0.3);" id="smartConfirmBtn">Yes, Logout</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', alertHTML);
    
    // Jab user "Yes, Logout" par click kare
    document.getElementById('smartConfirmBtn').addEventListener('click', function() {
        closeSmartAlert(); // Pehle popup smoothly band karo
        setTimeout(() => {
            onConfirmCallback(); // Phir actual action (logout) chalao
        }, 300);
    });
}

function closeSmartAlert() {
    const alertOverlay = document.getElementById('smartAlertOverlay');
    if (alertOverlay) {
        // Band hone ka chota sa animation effect
        alertOverlay.style.opacity = '0';
        alertOverlay.querySelector('.smart-alert-box').style.transform = 'scale(0.8)';
        
        // 300ms baad screen se delete kar dena
        setTimeout(() => {
            alertOverlay.remove();
        }, 300);
    }
}
// ========================================================
// UNIVERSAL CHANGE PASSWORD MODAL & LOGIC
// ========================================================
function openChangePasswordModal() {
    // Agar pehle se khula hai toh hata do
    let existing = document.getElementById('changePassModal');
    if (existing) existing.remove();

    const modalHTML = `
    <div id="changePassModal" style="display: flex; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 10000; justify-content: center; align-items: center; backdrop-filter: blur(4px);">
        <div style="background: white; padding: 30px; border-radius: 15px; width: 400px; max-width: 90%; box-shadow: 0 10px 30px rgba(0,0,0,0.5); animation: popIn 0.3s ease-out;">
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f1f5f9; padding-bottom: 10px; margin-bottom: 20px;">
                <h3 style="margin: 0; color: #333;"><i class="fas fa-key" style="color: #6c63ff;"></i> Change Password</h3>
                <span style="cursor: pointer; font-size: 20px; color: #94a3b8;" onclick="document.getElementById('changePassModal').remove()"><i class="fas fa-times"></i></span>
            </div>
            <form onsubmit="event.preventDefault(); submitChangePassword();">
                <div style="margin-bottom: 15px;">
                    <label style="font-size: 13px; font-weight: bold; color: #475569;">Current Password</label>
                    <input type="password" id="cpCurrent" style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; margin-top: 5px;" required>
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="font-size: 13px; font-weight: bold; color: #475569;">New Password</label>
                    <input type="password" id="cpNew" style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; margin-top: 5px;" required>
                </div>
                <div style="margin-bottom: 20px;">
                    <label style="font-size: 13px; font-weight: bold; color: #475569;">Confirm New Password</label>
                    <input type="password" id="cpConfirm" style="width: 100%; padding: 10px; border: 1px solid #cbd5e1; border-radius: 8px; margin-top: 5px;" required>
                </div>
                <button type="submit" style="width: 100%; background: #6c63ff; color: white; border: none; padding: 12px; border-radius: 8px; font-weight: bold; cursor: pointer; transition: 0.3s;">Update Password</button>
            </form>
        </div>
    </div>
    `;
    
    // Page ke aakhiri me chipkakar turant dikha do
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

async function submitChangePassword() {
    const currentPass = document.getElementById('cpCurrent').value;
    const newPass = document.getElementById('cpNew').value;
    const confirmPass = document.getElementById('cpConfirm').value;

    // Validation
    if (newPass !== confirmPass) {
        return showSmartAlert('warning', 'Mismatch!', 'New passwords do not match.');
    }

    // LocalStorage se user ki details nikalo
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;

    try {
        const res = await fetch('https://hostrac.onrender.com/api/auth/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                userId: user._id, 
                role: user.role, 
                currentPassword: currentPass, 
                newPassword: newPass 
            })
        });
        
        const data = await res.json();

        if (data.success) {
            document.getElementById('changePassModal').remove(); // Modal band karo
            showSmartAlert('success', 'Success!', 'Password updated successfully! Please login again.');
            
            // Password change hone ke baad security ke liye wapas login page par bhejo
            setTimeout(() => {
                localStorage.clear();
                window.location.href = 'login.html';
            }, 2500);
        } else {
            showSmartAlert('error', 'Failed!', data.message);
        }
    } catch (err) {
        showSmartAlert('error', 'Error', 'Server connection failed.');
    }
}
