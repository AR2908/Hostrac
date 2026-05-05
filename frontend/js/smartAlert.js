/**
 * UNIVERSAL SMART ALERT LOGIC
 * Isko poore project me kahin bhi call kiya ja sakta hai
 */

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
