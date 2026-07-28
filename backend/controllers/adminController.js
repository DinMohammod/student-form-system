const pool = require('../config/db');
const { mysqlPool } = require('../config/mysqlDB');
const { getBloodDonorInfo } = require('./bloodDonorController');

// ==========================================
// 1. সব User-এর List (Admin Panel-এর প্রথম Page)
// ==========================================
const getAllUsers = async (req, res) => {
    try {
        const usersResult = await pool.query(
            `SELECT u.id, u.username, u.email, u.role, u.created_at,
                    CASE WHEN pi.id IS NOT NULL THEN 'Completed' ELSE 'Not Started' END AS application_status
             FROM users u
             LEFT JOIN personal_information pi ON pi.user_id = u.id
             WHERE u.role = 'user'
             ORDER BY u.id ASC`
        );

        res.status(200).json({ users: usersResult.rows });

    } catch (error) {
        console.error('Get All Users Error:', error.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

// ==========================================
// 2. একজন নির্দিষ্ট User-এর পুরো Profile (Personal, Family, Education ইত্যাদি)
// ==========================================
const getUserProfile = async (req, res) => {
    const { id } = req.params;

    try {
        const userResult = await pool.query(
            'SELECT id, username, email, role, created_at FROM users WHERE id = $1',
            [id]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'User পাওয়া যায়নি' });
        }

        const personalResult = await pool.query(
            'SELECT * FROM personal_information WHERE user_id = $1',
            [id]
        );

        const isSubmitted = personalResult.rows.length > 0;

        if (!isSubmitted) {
            return res.status(200).json({
                user: userResult.rows[0],
                application_status: 'Not Started',
                personal: null,
                family: null,
                siblings: [],
                education: null,
                skills: [],
                experience: [],
                bloodInfo: null
            });
        }

        const familyResult = await pool.query(
            'SELECT * FROM family_information WHERE user_id = $1',
            [id]
        );

        let siblings = [];
        if (familyResult.rows.length > 0) {
            const siblingsResult = await pool.query(
                'SELECT sibling_name, sibling_relation FROM siblings WHERE family_id = $1',
                [familyResult.rows[0].id]
            );
            siblings = siblingsResult.rows;
        }

        const educationResult = await pool.query(
            'SELECT * FROM education WHERE user_id = $1',
            [id]
        );

        const skillsResult = await pool.query(
            'SELECT skill_name, proficiency FROM skills WHERE user_id = $1',
            [id]
        );

        const experienceResult = await pool.query(
            'SELECT company_name, position, start_date, end_date, is_current, description FROM experience WHERE user_id = $1 ORDER BY start_date DESC',
            [id]
        );

        let bloodInfo = null;
        try {
            bloodInfo = await getBloodDonorInfo(id);
        } catch (mongoError) {
            console.error('Get Blood Donor Info Error:', mongoError.message);
        }

        res.status(200).json({
            user: userResult.rows[0],
            application_status: 'Completed',
            personal: personalResult.rows[0],
            family: familyResult.rows[0] || null,
            siblings: siblings,
            education: educationResult.rows[0] || null,
            skills: skillsResult.rows,
            experience: experienceResult.rows,
            bloodInfo: bloodInfo
        });

    } catch (error) {
        console.error('Get User Profile Error:', error.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

// ==========================================
// 3. একজন নির্দিষ্ট User-এর সব Activity History (MySQL থেকে)
// ==========================================
const getUserHistory = async (req, res) => {
    const { id } = req.params;

    try {
        const [rows] = await mysqlPool.query(
            'SELECT * FROM user_activity_logs WHERE user_id = ? ORDER BY created_at DESC',
            [id]
        );

        res.status(200).json({ history: rows });

    } catch (error) {
        console.error('Get User History Error:', error.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { getAllUsers, getUserProfile, getUserHistory };