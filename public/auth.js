// === AUTHENTICATION ===

// === INITIALIZATION ===
window.onload = async function() {
    await checkAutoLogin();
};

async function checkAutoLogin() {
    // Check for session parameter in URL first
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session');
    
    const savedUser = localStorage.getItem('lawnCurrentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        document.getElementById('loginModal').classList.remove('active');
        await initializeApp(sessionId);
    } else {
        // Store session ID for later use after login
        if (sessionId) {
            localStorage.setItem('pendingSession', sessionId);
        }
        await loadUsersForLogin();
    }
}

async function loadUsersForLogin() {
    try {
        const data = await apiCall('/users');
        users = data.users;
        document.getElementById('loadingUsers').classList.add('hidden');
        document.getElementById('loginForm').classList.remove('hidden');
        populateUserDropdown();
    } catch (error) {
        document.getElementById('loadingUsers').innerHTML = '<p style="color: #991b1b;">Failed to load users. Please configure your backend API.</p>';
    }
}

// === LOGIN ===
function populateUserDropdown() {
    const dropdown = document.getElementById('userOptions');
    dropdown.innerHTML = users.map(user => 
        `<div class="user-option" onclick="selectUser('${user.name.replace(/'/g, "\\'")}')">${user.name}</div>`
    ).join('');
}

function showUserDropdown() {
    document.getElementById('userOptions').classList.add('active');
    populateUserDropdown();
}

function filterUsers() {
    const input = document.getElementById('userSelect').value.toLowerCase();
    const dropdown = document.getElementById('userOptions');
    const filtered = users.filter(u => u.name.toLowerCase().includes(input));
    
    dropdown.innerHTML = filtered.map(user => 
        `<div class="user-option" onclick="selectUser('${user.name.replace(/'/g, "\\'")}')">${user.name}</div>`
    ).join('');
    
    dropdown.classList.add('active');
    
    if (input.toLowerCase().includes('max adams')) {
        document.getElementById('passwordGroup').classList.remove('hidden');
    } else {
        document.getElementById('passwordGroup').classList.add('hidden');
    }
}

function selectUser(name) {
    document.getElementById('userSelect').value = name;
    document.getElementById('userOptions').classList.remove('active');
    
    if (name === ADMIN_NAME) {
        document.getElementById('passwordGroup').classList.remove('hidden');
    } else {
        document.getElementById('passwordGroup').classList.add('hidden');
    }
}

document.addEventListener('click', function(e) {
    if (!e.target.closest('.user-dropdown')) {
        document.getElementById('userOptions').classList.remove('active');
    }
    if (!e.target.closest('.session-modal-content') && !e.target.closest('.calendar-day')) {
        document.getElementById('sessionModal').classList.remove('active');
    }
    // Don't close edit user modal on outside click
    if (!e.target.closest('#editUserModal') && !e.target.closest('#loginModal')) {
        // Modal close handling is done by specific buttons
    }
});

async function handleLogin(e) {
    e.preventDefault();
    const selectedName = document.getElementById('userSelect').value;
    const password = document.getElementById('passwordInput').value;
    
    if (!selectedName) {
        showAlert('Please select your name', 'error');
        return;
    }
    
    try {
        const data = await apiCall('/auth/login', 'POST', {
            name: selectedName,
            password: password || null
        });
        
        currentUser = data.user;
        localStorage.setItem('lawnCurrentUser', JSON.stringify(currentUser));
        document.getElementById('loginModal').classList.remove('active');
        await initializeApp();
    } catch (error) {
        // Error already shown by apiCall
    }
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        currentUser = null;
        localStorage.removeItem('lawnCurrentUser');
        document.getElementById('loginModal').classList.add('active');
        document.getElementById('userSelect').value = '';
        document.getElementById('passwordInput').value = '';
        document.getElementById('passwordGroup').classList.add('hidden');
        document.getElementById('adminSections').classList.add('hidden');
        document.getElementById('userSections').classList.add('hidden');
        document.getElementById('loadingUsers').classList.remove('hidden');
        document.getElementById('loginForm').classList.add('hidden');
        loadUsersForLogin();
    }
}

async function initializeApp(pendingSessionId) {
    document.getElementById('currentUserBadge').textContent = currentUser.name;
    
    try {
        // Load users and sessions
        const [usersData, sessionsData] = await Promise.all([
            apiCall('/users'),
            apiCall('/sessions')
        ]);
        
        users = usersData.users;
        sessions = sessionsData.sessions;
        
        if (currentUser.isAdmin) {
            document.getElementById('adminSections').classList.remove('hidden');
            document.getElementById('userSections').classList.add('hidden');
            renderUsers();
            renderUnassignedSessions();
            renderCalendar('admin');
            renderMyRoster('admin');
        } else {
            document.getElementById('adminSections').classList.add('hidden');
            document.getElementById('userSections').classList.remove('hidden');
            renderMyRoster('user');
            renderCalendar('user');
        }
        
        // Check for session parameter in URL or pending session
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = pendingSessionId || urlParams.get('session') || localStorage.getItem('pendingSession');
        
        if (sessionId) {
            const session = sessions.find(s => s._id === sessionId);
            if (session) {
                const date = new Date(session.date);
                openSessionModal(date.toISOString().split('T')[0]);
                // Clear the pending session
                localStorage.removeItem('pendingSession');
                // Clean URL
                window.history.replaceState({}, document.title, window.location.pathname);
            }
        }
    } catch (error) {
        showAlert('Failed to load data', 'error');
    }
}

