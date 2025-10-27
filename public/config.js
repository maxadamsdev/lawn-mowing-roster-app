// === CONFIGURATION ===
const ADMIN_NAME = "Max Adams";
const MEETING_LOCATION = "2 Headingly Lane, Richmond 7020, New Zealand";
const SESSION_DURATION_DAYS = 3;

// === STATE ===
let currentUser = null;
let users = [];
let sessions = [];
let currentMonth = new Date();

// Default API URL - auto-detect based on current origin
let API_URL = window.location.origin + '/api';

// Custom alert function for better notifications
function showAlert(message, type = 'success') {
    const alertContainer = document.getElementById('alertContainer');
    
    // Create alert element
    const alert = document.createElement('div');
    alert.className = `custom-alert custom-alert-${type}`;
    
    // Add icon based on type
    let icon = '✓';
    if (type === 'error') icon = '✕';
    if (type === 'warning') icon = '⚠';
    
    alert.innerHTML = `
        <div class="alert-content">
            <span class="alert-icon">${icon}</span>
            <span class="alert-message">${message}</span>
        </div>
    `;
    
    alertContainer.appendChild(alert);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        alert.style.opacity = '0';
        alert.style.transform = 'translateX(100%)';
        setTimeout(() => {
            alert.remove();
        }, 300);
    }, 5000);
    
    // Add click to dismiss
    alert.addEventListener('click', () => {
        alert.style.opacity = '0';
        alert.style.transform = 'translateX(100%)';
        setTimeout(() => {
            alert.remove();
        }, 300);
    });
}

