const { mysqlPool } = require('../config/mysqlDB');

// ==========================================
// Action Type গুলোর জন্য Constant (Typo আটকাতে)
// ==========================================
const ACTIONS = {
    REGISTER: 'REGISTER',
    LOGIN: 'LOGIN',
    FORM_SUBMIT: 'FORM_SUBMIT',
    FORM_UPDATE: 'FORM_UPDATE',
    APPLICATION_DELETE: 'APPLICATION_DELETE',
    ACCOUNT_DELETE: 'ACCOUNT_DELETE'
};

// ==========================================
// Activity Log লেখা (MySQL-এ)
// ==========================================
const logActivity = async ({ user_id, user_name, user_email, action_type, description }) => {
    try {
        await mysqlPool.query(
            `INSERT INTO user_activity_logs (user_id, user_name, user_email, action_type, description)
             VALUES (?, ?, ?, ?, ?)`,
            [user_id, user_name || null, user_email || null, action_type, description || null]
        );
    } catch (error) {
        // Log লেখা Fail করলেও Main Feature আটকাবে না, শুধু Console-এ Error দেখাবে
        console.error('Activity Log Error:', error.message);
    }
};

module.exports = { logActivity, ACTIONS };