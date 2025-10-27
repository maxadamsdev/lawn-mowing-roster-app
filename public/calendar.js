// === CALENDAR ===
function previousMonth() {
    currentMonth.setMonth(currentMonth.getMonth() - 1);
    renderCalendar(currentUser.isAdmin ? 'admin' : 'user');
}

function nextMonth() {
    currentMonth.setMonth(currentMonth.getMonth() + 1);
    renderCalendar(currentUser.isAdmin ? 'admin' : 'user');
}

function renderCalendar(view) {
    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];
    
    const monthElement = view === 'admin' ? 
        document.getElementById('currentMonth') : 
        document.getElementById('currentMonthUser');
    
    monthElement.textContent = `${monthNames[currentMonth.getMonth()]} ${currentMonth.getFullYear()}`;
    
    const gridElement = view === 'admin' ? 
        document.getElementById('calendarGrid') : 
        document.getElementById('calendarGridUser');
    
    const firstDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const startDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();
    
    let calendarHTML = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
        .map(day => `<div class="calendar-day-header">${day}</div>`)
        .join('');
    
    const prevMonthLastDay = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
        const day = prevMonthLastDay - i;
        calendarHTML += `<div class="calendar-day other-month"><div class="day-number">${day}</div></div>`;
    }
    
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
        const dateStr = date.toISOString().split('T')[0];
        
        // Get just the date part (YYYY-MM-DD) for comparison
        const currentDateStr = dateStr;
        const currentDate = new Date(currentDateStr);
        
        const sessionOnDate = sessions.find(session => {
            const sessionDate = new Date(session.date);
            const sessionDateStr = sessionDate.toISOString().split('T')[0];
            
            // Get day before and day after as date strings
            const dayBefore = new Date(sessionDate);
            dayBefore.setDate(dayBefore.getDate() - 1);
            const dayBeforeStr = dayBefore.toISOString().split('T')[0];
            
            const dayAfter = new Date(sessionDate);
            dayAfter.setDate(dayAfter.getDate() + 1);
            const dayAfterStr = dayAfter.toISOString().split('T')[0];
            
            // Compare date strings
            return currentDateStr === sessionDateStr || 
                   currentDateStr === dayBeforeStr || 
                   currentDateStr === dayAfterStr;
        });
        
        let classes = 'calendar-day';
        let indicator = '';
        
        if (sessionOnDate) {
            classes += ' has-session';
            if (sessionOnDate.confirmed) {
                classes += ' confirmed';
            }
            const user = users.find(u => u._id === sessionOnDate.userId);
            if (user) {
                indicator = `<div class="session-indicator">${user.name.split(' ')[0]}</div>`;
            } else {
                indicator = `<div class="session-indicator">Unassigned</div>`;
            }
        }
        
        calendarHTML += `
            <div class="${classes}" onclick="openSessionModal('${dateStr}')">
                <div class="day-number">${day}</div>
                ${indicator}
            </div>
        `;
    }
    
    const remainingCells = 42 - (startDay + daysInMonth);
    for (let day = 1; day <= remainingCells; day++) {
        calendarHTML += `<div class="calendar-day other-month"><div class="day-number">${day}</div></div>`;
    }
    
    gridElement.innerHTML = calendarHTML;
}

function openSessionModal(dateStr) {
    const clickedDate = dateStr;
    
    const session = sessions.find(s => {
        const sessionDate = new Date(s.date);
        const sessionDateStr = sessionDate.toISOString().split('T')[0];
        
        // Get day before and day after
        const dayBefore = new Date(sessionDate);
        dayBefore.setDate(dayBefore.getDate() - 1);
        const dayBeforeStr = dayBefore.toISOString().split('T')[0];
        
        const dayAfter = new Date(sessionDate);
        dayAfter.setDate(dayAfter.getDate() + 1);
        const dayAfterStr = dayAfter.toISOString().split('T')[0];
        
        // Compare date strings
        return clickedDate === sessionDateStr || 
               clickedDate === dayBeforeStr || 
               clickedDate === dayAfterStr;
    });
    
    if (!session) {
        showAlert('No session found for this date', 'error');
        return;
    }
    
    const user = users.find(u => u._id === session.userId);
    const sessionDate = new Date(session.date);
    const dayBefore = new Date(sessionDate);
    dayBefore.setDate(dayBefore.getDate() - 1);
    const dayAfter = new Date(sessionDate);
    dayAfter.setDate(dayAfter.getDate() + 1);
    
    const formattedRange = `${dayBefore.toLocaleDateString('en-US', { 
        weekday: 'short', month: 'short', day: 'numeric' 
    })} - ${dayAfter.toLocaleDateString('en-US', { 
        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' 
    })}`;
    
    let modalContent = `
        <div class="session-detail-row">
            <label>Session Date Range:</label>
            <div class="value">${formattedRange}</div>
        </div>
        <div class="session-detail-row">
            <label>Primary Date:</label>
            <div class="value">${sessionDate.toLocaleDateString('en-US', { 
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
            })}</div>
        </div>
        <div class="session-detail-row">
            <label>Location:</label>
            <div class="value">${MEETING_LOCATION}</div>
        </div>
        <div class="session-detail-row">
            <label>Duration:</label>
            <div class="value">2-3hr</div>
        </div>
    `;
    
    if (currentUser.isAdmin) {
        modalContent += `
            <div class="session-detail-row">
                <label>Assigned To:</label>
                <div class="value">${user ? user.name + ' (' + user.email + ')' : 'Not assigned'}</div>
            </div>
            <div class="session-actions">
                <select id="sessionUserSelect" style="flex: 1; padding: 10px; border: 2px solid #ddd; border-radius: 5px;">
                    <option value="">Select user...</option>
                    ${users.map(u => 
                        `<option value="${u._id}" ${session.userId === u._id ? 'selected' : ''}>${u.name}</option>`
                    ).join('')}
                </select>
                <button class="btn btn-primary" onclick="assignSessionUser('${session._id}')">Assign</button>
                ${session.userId && !session.confirmed ? `<button class="btn btn-success" onclick="openConfirmSessionModal('${session._id}')">Confirm</button>` : ''}
            </div>
        `;
    } else if (user && user._id === currentUser._id) {
        if (!session.confirmed) {
            modalContent += `
                <div class="session-detail-row">
                    <label>Instructions:</label>
                    <div class="value">You can come any time during this 3-day window. Please confirm your arrival details below.</div>
                </div>
                <div class="session-actions" style="margin-top: 20px; flex-direction: column; gap: 10px;">
                    <button class="btn btn-success" onclick="openConfirmSessionModal('${session._id}')" style="width: 100%;">Confirm Session Details</button>
                    <button class="btn btn-danger" onclick="withdrawFromSession('${session._id}')" style="width: 100%;">Withdraw from This Session</button>
                    <button class="btn" style="background: #48bb78; width: 100%;" onclick="requestCoverage('${session._id}')">Request Coverage via Email</button>
                </div>
            `;
        } else {
            // Build arrival info if assistance was requested
            let arrivalInfo = '';
            if (session.needsAssistance && session.arrivalDay && session.arrivalTime) {
                const sessionDate = new Date(session.date);
                const dayBefore = new Date(sessionDate);
                dayBefore.setDate(dayBefore.getDate() - 1);
                const dayAfter = new Date(sessionDate);
                dayAfter.setDate(dayAfter.getDate() + 1);
                
                let dayName = '';
                if (session.arrivalDay === 'before') {
                    dayName = dayBefore.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
                } else if (session.arrivalDay === 'primary') {
                    dayName = sessionDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
                } else if (session.arrivalDay === 'after') {
                    dayName = dayAfter.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
                }
                
                arrivalInfo = `You'll arrive on ${dayName} at ${session.arrivalTime} for assistance from Max`;
            } else if (session.needsAssistance) {
                arrivalInfo = 'Assistance requested from Max (arrival time pending)';
            }
            
            modalContent += `
                <div class="session-detail-row">
                    <label>Status:</label>
                    <div class="value">✓ Confirmed</div>
                </div>
                ${arrivalInfo ? `<div class="session-detail-row"><label>Your Arrival:</label><div class="value">${arrivalInfo}</div></div>` : ''}
                <div class="session-detail-row">
                    <label>Instructions:</label>
                    <div class="value">You can come any time during this 3-day window (Friday midday through Sunday evening). Please bring appropriate clothing and equipment.</div>
                </div>
                <div class="session-actions" style="margin-top: 20px; flex-direction: column; gap: 10px;">
                    <button class="btn btn-danger" onclick="withdrawFromSession('${session._id}')" style="width: 100%;">Withdraw from This Session</button>
                </div>
            `;
        }
    } else if (!session.userId) {
        // Unassigned session - user can assign themselves
        modalContent += `
            <div class="session-detail-row">
                <label>This session is unassigned.</label>
                <div class="value">Would you like to volunteer for this session?</div>
            </div>
            <div class="session-actions">
                <button class="btn btn-success" onclick="assignMyselfToSession('${session._id}')" style="width: 100%;">Assign This Session to Me</button>
            </div>
        `;
    }
    
    modalContent += `
        <div style="margin-top: 20px;">
            <button class="btn btn-logout" onclick="closeSessionModal()" style="width: 100%;">Close</button>
        </div>
    `;
    
    document.getElementById('sessionModalBody').innerHTML = modalContent;
    document.getElementById('sessionModal').classList.add('active');
}

function closeSessionModal() {
    document.getElementById('sessionModal').classList.remove('active');
}

async function assignSessionUser(sessionId) {
    const userId = document.getElementById('sessionUserSelect').value;
    if (!userId) {
        showAlert('Please select a user', 'error');
        return;
    }
    
    try {
        await apiCall(`/sessions/${sessionId}`, 'PUT', { userId });
        const data = await apiCall('/sessions');
        sessions = data.sessions;
        
        renderCalendar('admin');
        renderUnassignedSessions();
        closeSessionModal();
        showAlert('User assigned successfully!');
    } catch (error) {
        // Error already shown
    }
}

function openConfirmSessionModal(sessionId) {
    const session = sessions.find(s => s._id === sessionId);
    if (!session) return;
    
    const sessionDate = new Date(session.date);
    const dayBefore = new Date(sessionDate);
    dayBefore.setDate(dayBefore.getDate() - 1);
    const dayAfter = new Date(sessionDate);
    dayAfter.setDate(dayAfter.getDate() + 1);
    
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'confirmSessionModal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Confirm Your Session Details</h2>
            <form onsubmit="handleConfirmSession(event, '${sessionId}')">
                <div class="form-group">
                    <label style="display: flex; align-items: center; gap: 10px; margin-bottom: 15px;">
                        <input type="checkbox" id="needsAssistance" style="width: 20px; height: 20px;" onchange="toggleAssistanceRequired()">
                        <span>I need Max to help me get started with the lawn mower</span>
                    </label>
                    <p style="color: #666; font-size: 14px; margin-top: 5px;">Max will show you how to operate the equipment and get you started. This is especially helpful if it's your first time.</p>
                </div>
                <div class="form-group" id="assistanceDateTimeGroup" style="display: none;">
                    <label>When will you arrive for assistance? (Required)</label>
                    <input type="datetime-local" id="arrivalDateTime" style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 8px; font-size: 16px;">
                    <p style="color: #666; font-size: 13px; margin-top: 5px;">Choose the date and time when you'll arrive so Max can meet you</p>
                </div>
                <p style="color: #666; font-size: 14px; margin-top: 15px;">You can come any time during the 3-day window: ${dayBefore.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${dayAfter.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button type="submit" class="btn btn-primary" style="flex: 1;">Confirm Session</button>
                    <button type="button" class="btn btn-logout" style="flex: 1;" onclick="closeConfirmSessionModal()">Cancel</button>
                </div>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
}

function toggleAssistanceRequired() {
    const needsAssistance = document.getElementById('needsAssistance').checked;
    const assistanceDateTimeGroup = document.getElementById('assistanceDateTimeGroup');
    const arrivalDateTimeInput = document.getElementById('arrivalDateTime');
    
    if (needsAssistance) {
        assistanceDateTimeGroup.style.display = 'block';
        arrivalDateTimeInput.setAttribute('required', 'required');
    } else {
        assistanceDateTimeGroup.style.display = 'none';
        arrivalDateTimeInput.removeAttribute('required');
    }
}

function closeConfirmSessionModal() {
    const modal = document.getElementById('confirmSessionModal');
    if (modal) modal.remove();
}

async function handleConfirmSession(e, sessionId) {
    e.preventDefault();
    const needsAssistance = document.getElementById('needsAssistance').checked;
    let arrivalDay = null;
    let arrivalTime = null;
    
    // Only capture arrival date/time if assistance is needed
    if (needsAssistance) {
        const arrivalDateTimeInput = document.getElementById('arrivalDateTime');
        const arrivalDateTime = new Date(arrivalDateTimeInput.value);
        
        // Determine which day they're coming (before, primary, or after)
        const session = sessions.find(s => s._id === sessionId);
        const sessionDate = new Date(session.date);
        const dayBefore = new Date(sessionDate);
        dayBefore.setDate(dayBefore.getDate() - 1);
        const dayAfter = new Date(sessionDate);
        dayAfter.setDate(dayAfter.getDate() + 1);
        
        const arrivalDateStr = arrivalDateTime.toISOString().split('T')[0];
        const sessionDateStr = sessionDate.toISOString().split('T')[0];
        const dayBeforeStr = dayBefore.toISOString().split('T')[0];
        const dayAfterStr = dayAfter.toISOString().split('T')[0];
        
        if (arrivalDateStr === dayBeforeStr) {
            arrivalDay = 'before';
        } else if (arrivalDateStr === sessionDateStr) {
            arrivalDay = 'primary';
        } else if (arrivalDateStr === dayAfterStr) {
            arrivalDay = 'after';
        } else {
            arrivalDay = 'primary'; // fallback
        }
        
        // Format time as HH:MM
        arrivalTime = arrivalDateTime.toTimeString().split(' ')[0].slice(0, 5);
    }
    
    try {
        await apiCall(`/sessions/${sessionId}/confirm`, 'PUT', { arrivalDay, arrivalTime, needsAssistance });
        const data = await apiCall('/sessions');
        sessions = data.sessions;
        
        renderCalendar(currentUser.isAdmin ? 'admin' : 'user');
        if (currentUser.isAdmin) {
            renderUnassignedSessions();
        } else {
            renderMyRoster();
        }
        closeSessionModal();
        closeConfirmSessionModal();
        showAlert('Session confirmed!');
    } catch (error) {
        // Error already shown
    }
}

async function assignMyselfToSession(sessionId) {
    try {
        await apiCall(`/sessions/${sessionId}`, 'PUT', { userId: currentUser._id });
        const data = await apiCall('/sessions');
        sessions = data.sessions;
        
        renderCalendar(currentUser.isAdmin ? 'admin' : 'user');
        renderMyRoster(currentUser.isAdmin ? 'admin' : 'user');
        closeSessionModal();
        
        // Automatically open the confirmation modal
        setTimeout(() => {
            openConfirmSessionModal(sessionId);
        }, 300);
    } catch (error) {
        // Error already shown
    }
}

function showWithdrawConfirm(sessionId) {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'withdrawConfirmModal';
    
    // Get list of users for assignment dropdown
    const userOptions = users
        .filter(u => u._id !== currentUser._id)
        .map(u => `<option value="${u._id}">${u.name}</option>`)
        .join('');
    
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <h2>Withdraw from Session</h2>
            <p style="margin-bottom: 20px; color: #666;">You have a few options for withdrawing from this session:</p>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="margin-top: 0; font-size: 16px; margin-bottom: 10px;">Option 1: Assign to Someone Else</h3>
                <p style="color: #666; font-size: 14px; margin-bottom: 10px;">If you've already spoken to someone who can take your place:</p>
                <select id="assignToUser" class="input" style="width: 100%; margin-bottom: 10px;">
                    <option value="">Select a user...</option>
                    ${userOptions}
                </select>
                <button class="btn btn-primary" onclick="handleWithdrawAssign('${sessionId}')" style="width: 100%;">Assign & Withdraw</button>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="margin-top: 0; font-size: 16px; margin-bottom: 10px;">Option 2: Request Coverage via Email</h3>
                <p style="color: #666; font-size: 14px; margin-bottom: 10px;">Send an email to all team members asking for someone to take your place:</p>
                <button class="btn btn-logout" onclick="handleWithdraw('${sessionId}', true)" style="width: 100%;">Withdraw & Email Everyone</button>
            </div>
            
            <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                <h3 style="margin-top: 0; font-size: 16px; margin-bottom: 10px;">Option 3: Just Withdraw</h3>
                <p style="color: #856404; font-size: 14px; margin-bottom: 10px;">⚠️ Only use this if you've made other arrangements. This will leave the session unassigned without notifying anyone.</p>
                <button class="btn btn-danger" onclick="handleWithdraw('${sessionId}', false)" style="width: 100%;">Just Withdraw (No Notification)</button>
            </div>
            
            <button class="btn btn-primary" onclick="closeWithdrawModal()" style="width: 100%;">Cancel</button>
        </div>
    `;
    document.body.appendChild(modal);
}

function closeWithdrawModal() {
    const modal = document.getElementById('withdrawConfirmModal');
    if (modal) modal.remove();
}

async function handleWithdrawAssign(sessionId) {
    const selectedUserId = document.getElementById('assignToUser').value;
    
    if (!selectedUserId) {
        showAlert('Please select a user to assign to.', 'error');
        return;
    }
    
    closeWithdrawModal();
    
    try {
        // Assign the new user
        await apiCall(`/sessions/${sessionId}`, 'PUT', { userId: selectedUserId });
        
        const data = await apiCall('/sessions');
        sessions = data.sessions;
        
        renderCalendar(currentUser.isAdmin ? 'admin' : 'user');
        renderMyRoster(currentUser.isAdmin ? 'admin' : 'user');
        closeSessionModal();
        
        const assignedUser = users.find(u => u._id === selectedUserId);
        showAlert(`Session reassigned to ${assignedUser.name}!`);
    } catch (error) {
        // Error already shown
    }
}

async function handleWithdraw(sessionId, requestCoverage) {
    closeWithdrawModal();
    
    try {
        await apiCall(`/sessions/${sessionId}/withdraw`, 'PUT');
        
        if (requestCoverage) {
            await apiCall(`/sessions/${sessionId}/request-coverage`, 'POST', { assignedUser: currentUser });
        }
        
        const data = await apiCall('/sessions');
        sessions = data.sessions;
        
        renderCalendar(currentUser.isAdmin ? 'admin' : 'user');
        renderMyRoster(currentUser.isAdmin ? 'admin' : 'user');
        closeSessionModal();
        
        const message = requestCoverage ? 
            'You have withdrawn and coverage request emails have been sent!' : 
            'You have withdrawn from this session.';
        showAlert(message);
    } catch (error) {
        // Error already shown
    }
}

async function withdrawFromSession(sessionId) {
    showWithdrawConfirm(sessionId);
}

async function requestCoverage(sessionId) {
    try {
        const response = await apiCall(`/sessions/${sessionId}/request-coverage`, 'POST', { assignedUser: currentUser });
        showAlert(`Coverage request emails sent to ${response.recipients.length} team members!`);
    } catch (error) {
        // Error already shown
    }
}

// === MY ROSTER (Regular Users) ===
function renderMyRoster(view = 'user') {
    const myList = view === 'admin' ? document.getElementById('adminRosterList') : document.getElementById('myRosterList');
    const mySessions = sessions.filter(s => s.userId === currentUser._id);
    
    if (mySessions.length === 0) {
        myList.innerHTML = '<p style="color: #666;">No sessions assigned to you yet.</p>';
        return;
    }
    
    mySessions.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    myList.innerHTML = mySessions.map(session => {
        const sessionDate = new Date(session.date);
        const dayBefore = new Date(sessionDate);
        dayBefore.setDate(dayBefore.getDate() - 1);
        const dayAfter = new Date(sessionDate);
        dayAfter.setDate(dayAfter.getDate() + 1);
        
        return `
            <div class="roster-item ${session.confirmed ? 'confirmed' : ''}" onclick="openSessionModalFromRoster('${session._id}')" style="cursor: pointer;">
                <div class="roster-date">
                    ${dayBefore.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - 
                    ${dayAfter.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
                <div class="roster-details">
                    <strong>Primary Date:</strong> ${sessionDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}<br>
                    <strong>Location:</strong> ${MEETING_LOCATION}<br>
                    <strong>Duration:</strong> 2-3hr<br>
                    <strong>Status:</strong> ${session.confirmed ? 'Confirmed ✓' : 'Pending Confirmation'}<br>
                    <em>Click to view details</em>
                </div>
            </div>
        `;
    }).join('');
}

// Helper function to open session modal from roster click
function openSessionModalFromRoster(sessionId) {
    console.log('openSessionModalFromRoster called with:', sessionId);
    console.log('Available sessions:', sessions);
    const session = sessions.find(s => s._id === sessionId);
    console.log('Found session:', session);
    
    if (session) {
        const sessionDate = new Date(session.date);
        const dateStr = sessionDate.toISOString().split('T')[0];
        console.log('Opening modal for date:', dateStr);
        openSessionModal(dateStr);
    } else {
        console.error('Session not found with ID:', sessionId);
        showAlert('Session not found', 'error');
    }
}

// === UNASSIGNED SESSIONS (Admin) ===
function renderUnassignedSessions() {
    const list = document.getElementById('unassignedList');
    const unassigned = sessions.filter(s => !s.userId);
    
    if (unassigned.length === 0) {
        list.innerHTML = '<p style="color: #666;">All sessions are assigned! 🎉</p>';
        return;
    }
    
    unassigned.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    list.innerHTML = unassigned.map(session => {
        const date = new Date(session.date);
        return `
            <div class="unassigned-item">
                <div class="unassigned-date">
                    ${date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
                <div style="font-size: 14px; color: #666; margin-top: 5px;">
                    Click on the calendar date to assign a user
                </div>
            </div>
        `;
    }).join('');
}

// === ALERTS ===
function showAlert(message, type = 'success') {
    const alertContainer = document.getElementById('alertContainer');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    alertContainer.appendChild(alert);
    
    setTimeout(() => {
        alert.remove();
    }, 5000);
}

