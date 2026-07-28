const token = requireAuth();

async function init() {
    try {
        const data = await fetchAllUsers(token);
        renderUsers(data.users);
    } catch (error) {
        console.error('Admin Users Load Error:', error.message);
        alert('User List আনতে সমস্যা হয়েছে (হয়তো তুমি Admin না)');
        window.location.href = 'dashboard.html';
    }
}

function renderUsers(users) {
    const tbody = document.getElementById('usersTableBody');

    if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="admin-empty">কোনো Student পাওয়া যায়নি</td></tr>';
        return;
    }

    tbody.innerHTML = '';

    users.forEach(user => {
        const row = document.createElement('tr');

        const isCompleted = user.application_status === 'Completed';
        const badgeClass = isCompleted ? 'completed' : 'not-started';

        const joinedDate = new Date(user.created_at).toLocaleDateString('en-GB', {
            day: 'numeric', month: 'short', year: 'numeric'
        });

        row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.username}</td>
            <td>${user.email}</td>
            <td><span class="admin-badge ${badgeClass}">${user.application_status}</span></td>
            <td>${joinedDate}</td>
        `;

        row.addEventListener('click', () => {
            window.location.href = `admin-user-detail.html?id=${user.id}`;
        });

        tbody.appendChild(row);
    });
}

init();