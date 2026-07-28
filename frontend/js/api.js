const API_BASE = 'http://localhost:5000/api';

// ==========================================
// Profile Data আনা (Dashboard-এর জন্য)
// ==========================================
async function fetchProfile(token) {
    const response = await fetch(`${API_BASE}/form/profile`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Profile আনতে সমস্যা হয়েছে');
    }

    return data;
}

// ==========================================
// Admin — সব User-এর List আনা
// ==========================================
async function fetchAllUsers(token) {
    const response = await fetch(`${API_BASE}/admin/users`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'User List আনতে সমস্যা হয়েছে');
    }

    return data;
}

// ==========================================
// Admin — একজন নির্দিষ্ট User-এর পুরো Profile আনা
// ==========================================
async function fetchUserProfileById(token, id) {
    const response = await fetch(`${API_BASE}/admin/users/${id}/profile`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Profile আনতে সমস্যা হয়েছে');
    }

    return data;
}

// ==========================================
// Admin — একজন নির্দিষ্ট User-এর Activity History আনা
// ==========================================
async function fetchUserHistory(token, id) {
    const response = await fetch(`${API_BASE}/admin/users/${id}/history`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'History আনতে সমস্যা হয়েছে');
    }

    return data;
}