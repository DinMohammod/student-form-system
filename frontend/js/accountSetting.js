const token = requireAuth();

// ==========================================
// Confirmation Modal Handle করা (Type "DELETE" করে Confirm)
// ==========================================
const confirmModal = document.getElementById('confirmModal');
const modalTitle = document.getElementById('modalTitle');
const modalDesc = document.getElementById('modalDesc');
const modalConfirmInput = document.getElementById('modalConfirmInput');
const modalConfirmError = document.getElementById('modalConfirmError');
const modalCancelBtn = document.getElementById('modalCancelBtn');
const modalConfirmBtn = document.getElementById('modalConfirmBtn');

let pendingAction = null;
const CONFIRM_WORD = 'DELETE';

function showConfirmModal(title, desc, onConfirm) {
    modalTitle.textContent = title;
    modalDesc.textContent = desc;
    modalConfirmInput.value = '';
    modalConfirmError.classList.add('hidden');
    pendingAction = onConfirm;
    confirmModal.classList.remove('hidden');
    modalConfirmInput.focus();
}

function hideConfirmModal() {
    confirmModal.classList.add('hidden');
    pendingAction = null;
    modalConfirmInput.value = '';
}

modalCancelBtn.addEventListener('click', hideConfirmModal);

modalConfirmBtn.addEventListener('click', async () => {
    const typedValue = modalConfirmInput.value.trim();

    if (typedValue !== CONFIRM_WORD) {
        modalConfirmError.classList.remove('hidden');
        return;
    }

    modalConfirmError.classList.add('hidden');
    modalConfirmBtn.disabled = true;
    modalConfirmBtn.textContent = 'Deleting...';

    if (pendingAction) {
        await pendingAction();
    }

    modalConfirmBtn.disabled = false;
    modalConfirmBtn.textContent = 'Yes, Delete';
});

confirmModal.addEventListener('click', (e) => {
    if (e.target === confirmModal) {
        hideConfirmModal();
    }
});

// ==========================================
// Delete Application
// ==========================================
document.getElementById('deleteAppBtn').addEventListener('click', () => {
    showConfirmModal(
        'Delete Application?',
        'তোমার Personal, Family, Education, Skills, এবং Experience — সব Data মুছে যাবে। তোমার Account থাকবে, চাইলে আবার নতুন Application Submit করতে পারবে।',
        deleteApplication
    );
});

async function deleteApplication() {
    try {
        const response = await fetch(`${API_BASE}/form/application`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || 'Delete করতে সমস্যা হয়েছে');
            return;
        }

        window.location.href = 'dashboard.html';

    } catch (error) {
        console.error('Delete Application Error:', error);
        alert('Server-এর সাথে Connect করা যাচ্ছে না');
    }
}

// ==========================================
// Delete Account
// ==========================================
document.getElementById('deleteAccountBtn').addEventListener('click', () => {
    showConfirmModal(
        'Delete Account?',
        'তোমার Account এবং সব Data স্থায়ীভাবে মুছে যাবে। এটা ফিরিয়ে আনা সম্ভব না।',
        deleteAccountHandler
    );
});

async function deleteAccountHandler() {
    try {
        const response = await fetch(`${API_BASE}/form/account`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || 'Account Delete করতে সমস্যা হয়েছে');
            return;
        }

        logout();

    } catch (error) {
        console.error('Delete Account Error:', error);
        alert('Server-এর সাথে Connect করা যাচ্ছে না');
    }
}