// Backend API Base URL
const API_BASE_URL = 'https://student-form-system-production.up.railway.app/api/auth';

// Tab Switch
function switchTab(tab) {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const tabLogin = document.getElementById('tabLogin');
    const tabRegister = document.getElementById('tabRegister');

    if (tab === 'login') {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        tabLogin.classList.add('active');
        tabRegister.classList.remove('active');
    } else {
        registerForm.classList.remove('hidden');
        loginForm.classList.add('hidden');
        tabRegister.classList.add('active');
        tabLogin.classList.remove('active');
    }
}

function showMessage(elementID, text, type) {
    const el = document.getElementById(elementID);
    el.textContent = text;
    el.className = 'form-message ' + type;
}

// LOGIN Handle 
const loginForm = document.getElementById('loginForm');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('loginEmail').value.trim();
    const password = document.getElementById('loginPassword').value;

    const submitBtn = loginForm.querySelector('.submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in...';

    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            showMessage('loginMessage', data.message, 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Login';
            return;
        }

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        showMessage('loginMessage', 'Login Successful! Redirecting...', 'success');

        setTimeout(() => {
            window.location.href = 'dashboard.html';
        }, 800);

    } catch (error) {
        console.error('Login Error:', error);
        showMessage('loginMessage', 'Unable to connect to the server', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Login';
    }
});

// REGISTER Handle করা

const registerForm = document.getElementById('registerForm');

registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('registerUsername').value.trim();
    const email = document.getElementById('registerEmail').value.trim();
    const password = document.getElementById('registerPassword').value;

    const submitBtn = registerForm.querySelector('.submit-btn');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Creating...';

    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            showMessage('registerMessage', data.message, 'error');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Create Account';
            return;
        }

        showMessage('registerMessage', 'Account is ready now. Please Login', 'success');

        registerForm.reset();
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account';

        setTimeout(() => {
            switchTab('login');
        }, 1200);

    } catch (error) {
        console.error('Register Error:', error);
        showMessage('registerMessage', 'Unable to connect to the server', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Create Account';
    }
});

//  when Login --- Dashboard

window.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (token) {
        window.location.href = 'dashboard.html';
    }
});