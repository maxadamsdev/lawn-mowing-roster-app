// === USER MANAGEMENT (Admin Only) ===
async function addUser() {
    const name = document.getElementById('userName').value.trim();
    const email = document.getElementById('userEmail').value.trim();
    const phone = document.getElementById('userPhone').value.trim();
    
    if (!name || !email) {
        showAlert('Please enter both name and email', 'error');
        return;
    }
    
    try {
        await apiCall('/users', 'POST', { name, email, phone });
        const data = await apiCall('/users');
        users = data.users;
        renderUsers();
        populateUserDropdown();
        
        document.getElementById('userName').value = '';
        document.getElementById('userEmail').value = '';
        document.getElementById('userPhone').value = '';
        
        showAlert('User added successfully!');
    } catch (error) {
        // Error already shown
    }
}

async function removeUser(id) {
    if (confirm('Are you sure you want to remove this user?')) {
        try {
            await apiCall(`/users/${id}`, 'DELETE');
            const data = await apiCall('/users');
            users = data.users;
            renderUsers();
            populateUserDropdown();
            showAlert('User removed successfully!');
        } catch (error) {
            // Error already shown
        }
    }
}

function renderUsers() {
    const userList = document.getElementById('userList');
    userList.innerHTML = users.map(user => {
        // Check if current user can edit this user (admin or self)
        const canEdit = currentUser.isAdmin || currentUser._id === user._id;
        const isCurrentUser = currentUser._id === user._id;
        
        return `
        <li class="user-item">
            <div class="user-info">
                <div class="user-name">${user.name} ${isCurrentUser ? '(You)' : ''}</div>
                <div class="user-email">${user.email}</div>
                ${user.phone ? `<div style="font-size: 13px; color: #999;">📞 ${user.phone}</div>` : ''}
            </div>
            <div style="display: flex; gap: 8px;">
                ${canEdit ? `<button class="btn" style="background: #48bb78; padding: 8px 16px; font-size: 14px;" onclick="openEditUserModal('${user._id}')">Edit</button>` : ''}
                ${currentUser.isAdmin && !user.isAdmin ? `<button class="btn btn-danger" onclick="removeUser('${user._id}')">Remove</button>` : ''}
            </div>
        </li>
        `;
    }).join('');
}

// === USER EDITING ===
function openEditUserModal(userId) {
    const user = users.find(u => u._id === userId);
    if (!user) return;
    
    const isCurrentUser = currentUser._id === user._id;
    
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            <h2>Edit User Details</h2>
            <form onsubmit="updateUser(event, '${userId}')">
                <div class="form-group">
                    <label>Name:</label>
                    <input type="text" id="editUserName" value="${user.name}" required>
                </div>
                <div class="form-group">
                    <label>Email:</label>
                    <input type="email" id="editUserEmail" value="${user.email}" required>
                </div>
                <div class="form-group">
                    <label>Phone:</label>
                    <input type="tel" id="editUserPhone" value="${user.phone || ''}">
                </div>
                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button type="submit" class="btn btn-primary" style="flex: 1;">Save Changes</button>
                    <button type="button" class="btn btn-logout" style="flex: 1;" onclick="closeEditUserModal()">Cancel</button>
                </div>
            </form>
        </div>
    `;
    modal.id = 'editUserModal';
    document.body.appendChild(modal);
}

function closeEditUserModal() {
    const modal = document.getElementById('editUserModal');
    if (modal) modal.remove();
}

async function updateUser(e, userId) {
    e.preventDefault();
    const name = document.getElementById('editUserName').value.trim();
    const email = document.getElementById('editUserEmail').value.trim();
    const phone = document.getElementById('editUserPhone').value.trim();
    
    if (!name || !email) {
        showAlert('Please enter both name and email', 'error');
        return;
    }
    
    try {
        await apiCall(`/users/${userId}`, 'PUT', { name, email, phone });
        const data = await apiCall('/users');
        users = data.users;
        
        // Update current user if they edited themselves
        if (currentUser._id === userId) {
            const updatedUser = users.find(u => u._id === userId);
            currentUser = updatedUser;
            localStorage.setItem('lawnCurrentUser', JSON.stringify(currentUser));
            document.getElementById('currentUserBadge').textContent = currentUser.name;
        }
        
        renderUsers();
        populateUserDropdown();
        closeEditUserModal();
        showAlert('User updated successfully!');
    } catch (error) {
        // Error already shown
    }
}

