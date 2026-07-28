// ==========================================
// Protected Page-এ Token Check করা
// ==========================================
function requireAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = 'login.html';
        return null;
    }
    return token;
}

// ==========================================
// Logged-in User-এর Info পাওয়া (localStorage থেকে)
// ==========================================
function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// ==========================================
// Logout করা
// ==========================================
function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}