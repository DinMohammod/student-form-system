const pool = require('../config/db');
const { saveBloodDonorInfo, getBloodDonorInfo } = require('./bloodDonorController');
const { logActivity, ACTIONS } = require('../utils/activityLogger');

// ==========================================
// SUBMIT FORM (Transaction দিয়ে)
// ==========================================
const submitForm = async (req, res) => {
    const user_id = req.user.user_id;

    // Multer ব্যবহার করলে req.body-র প্রতিটা Field String হিসেবে আসে,
    // তাই JSON Object-গুলো আলাদাভাবে Parse করতে হবে
    let personal, family, education, skills, experience, bloodInfo;

    try {
        personal = JSON.parse(req.body.personal);
        family = JSON.parse(req.body.family);
        education = JSON.parse(req.body.education);
        skills = req.body.skills ? JSON.parse(req.body.skills) : [];
        experience = req.body.experience ? JSON.parse(req.body.experience) : [];
        bloodInfo = req.body.bloodInfo ? JSON.parse(req.body.bloodInfo) : null;
    } catch (err) {
        return res.status(400).json({ message: 'Form Data ঠিকভাবে পাঠানো হয়নি' });
    }

    if (!personal || !family || !education) {
        return res.status(400).json({ message: 'Personal, Family, Education — সবগুলো Data দরকার' });
    }

    // Photo Path (যদি Upload করা হয়ে থাকে)
    const photoPath = req.file ? `/uploads/${req.file.filename}` : null;

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const existing = await client.query(
            'SELECT id FROM personal_information WHERE user_id = $1',
            [user_id]
        );

        if (existing.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'তুমি আগেই Application Submit করেছো' });
        }

        // ---------- 1. Personal Information Insert ----------
        await client.query(
            `INSERT INTO personal_information 
             (user_id, first_name, surname, gender, dob, mobile, email, present_address, permanent_address, photo_url)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
            [
                user_id,
                personal.first_name,
                personal.surname,
                personal.gender,
                personal.dob,
                personal.mobile,
                personal.email,
                personal.present_address,
                personal.permanent_address,
                photoPath
            ]
        );

        // ---------- 2. Family Information Insert ----------
        const siblingsCount = family.siblings ? family.siblings.length : 0;

        const familyResult = await client.query(
            `INSERT INTO family_information
             (user_id, father_name, father_occupation, father_mobile,
              mother_name, mother_occupation, mother_mobile, number_of_siblings)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING id`,
            [
                user_id,
                family.father_name,
                family.father_occupation,
                family.father_mobile,
                family.mother_name,
                family.mother_occupation,
                family.mother_mobile,
                siblingsCount
            ]
        );

        const family_id = familyResult.rows[0].id;

        // ---------- 3. Siblings Insert ----------
        if (siblingsCount > 0) {
            for (const sibling of family.siblings) {
                await client.query(
                    `INSERT INTO siblings (family_id, sibling_name, sibling_relation)
                     VALUES ($1, $2, $3)`,
                    [family_id, sibling.name, sibling.relation]
                );
            }
        }

        // ---------- 4. Education Insert ----------
        await client.query(
            `INSERT INTO education
             (user_id, school_name, ssc_board, ssc_gpa, ssc_year,
              college_name, hsc_board, hsc_gpa, hsc_year,
              university, department, semester, cgpa)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [
                user_id,
                education.school_name,
                education.ssc_board,
                education.ssc_gpa,
                education.ssc_year,
                education.college_name,
                education.hsc_board,
                education.hsc_gpa,
                education.hsc_year,
                education.university,
                education.department,
                education.semester,
                education.cgpa
            ]
        );

        // ---------- 5. Skills Insert ----------
        if (skills.length > 0) {
            for (const skill of skills) {
                await client.query(
                    `INSERT INTO skills (user_id, skill_name, proficiency)
                     VALUES ($1, $2, $3)`,
                    [user_id, skill.skill_name, skill.proficiency]
                );
            }
        }

        // ---------- 6. Experience Insert ----------
        if (experience.length > 0) {
            for (const exp of experience) {
                await client.query(
                    `INSERT INTO experience
                     (user_id, company_name, position, start_date, end_date, is_current, description)
                     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    [
                        user_id,
                        exp.company_name,
                        exp.position,
                        exp.start_date,
                        exp.end_date || null,
                        exp.is_current || false,
                        exp.description || null
                    ]
                );
            }
        }

        await client.query('COMMIT');

        // PostgreSQL Transaction Successful হওয়ার পর MongoDB-তে Blood Info Save করা
        if (bloodInfo) {
            try {
                await saveBloodDonorInfo(user_id, bloodInfo);
            } catch (mongoError) {
                console.error('Blood Donor Info Save Error:', mongoError.message);
                // মূল Application Data (PostgreSQL) ইতিমধ্যে Save হয়ে গেছে,
                // তাই এখানে Error হলেও Main Response Fail করাচ্ছি না
            }
        }

        // Activity Log (MySQL)
        await logActivity({
            user_id,
            user_name: `${personal.first_name} ${personal.surname}`,
            user_email: personal.email,
            action_type: ACTIONS.FORM_SUBMIT,
            description: 'Submitted application form'
        });

        res.status(201).json({ message: 'Application Submitted Successfully' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Submit Form Error:', error.message);
        res.status(500).json({ message: 'Server Error, Data Save হয়নি' });
    } finally {
        client.release();
    }
};

// ==========================================
// UPDATE FORM (Application Edit করা)
// ==========================================
const updateForm = async (req, res) => {
    const user_id = req.user.user_id;

    let personal, family, education, skills, experience, bloodInfo;

    try {
        personal = JSON.parse(req.body.personal);
        family = JSON.parse(req.body.family);
        education = JSON.parse(req.body.education);
        skills = req.body.skills ? JSON.parse(req.body.skills) : [];
        experience = req.body.experience ? JSON.parse(req.body.experience) : [];
        bloodInfo = req.body.bloodInfo ? JSON.parse(req.body.bloodInfo) : null;
    } catch (err) {
        return res.status(400).json({ message: 'Form Data ঠিকভাবে পাঠানো হয়নি' });
    }

    if (!personal || !family || !education) {
        return res.status(400).json({ message: 'Personal, Family, Education — সবগুলো Data দরকার' });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Application আগে থেকেই আছে কিনা Check করা
        const existing = await client.query(
            'SELECT id, photo_url FROM personal_information WHERE user_id = $1',
            [user_id]
        );

        if (existing.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'কোনো Application পাওয়া যায়নি, আগে Submit করো' });
        }

        // নতুন Photo Upload করা হলে সেটার Path নাও, না হলে আগের Photo রাখো
        const photoPath = req.file ? `/uploads/${req.file.filename}` : existing.rows[0].photo_url;

        // ---------- 1. Personal Information Update ----------
        await client.query(
            `UPDATE personal_information SET
                first_name = $1, surname = $2, gender = $3, dob = $4,
                mobile = $5, email = $6, present_address = $7,
                permanent_address = $8, photo_url = $9
             WHERE user_id = $10`,
            [
                personal.first_name,
                personal.surname,
                personal.gender,
                personal.dob,
                personal.mobile,
                personal.email,
                personal.present_address,
                personal.permanent_address,
                photoPath,
                user_id
            ]
        );

        // ---------- 2. Family Information Update ----------
        const siblingsCount = family.siblings ? family.siblings.length : 0;

        const familyResult = await client.query(
            `UPDATE family_information SET
                father_name = $1, father_occupation = $2, father_mobile = $3,
                mother_name = $4, mother_occupation = $5, mother_mobile = $6,
                number_of_siblings = $7
             WHERE user_id = $8
             RETURNING id`,
            [
                family.father_name,
                family.father_occupation,
                family.father_mobile,
                family.mother_name,
                family.mother_occupation,
                family.mother_mobile,
                siblingsCount,
                user_id
            ]
        );

        const family_id = familyResult.rows[0].id;

        // ---------- 3. Siblings — আগের সব Delete করে নতুন Insert ----------
        await client.query('DELETE FROM siblings WHERE family_id = $1', [family_id]);

        if (siblingsCount > 0) {
            for (const sibling of family.siblings) {
                await client.query(
                    `INSERT INTO siblings (family_id, sibling_name, sibling_relation)
                     VALUES ($1, $2, $3)`,
                    [family_id, sibling.name, sibling.relation]
                );
            }
        }

        // ---------- 4. Education Update ----------
        await client.query(
            `UPDATE education SET
                school_name = $1, ssc_board = $2, ssc_gpa = $3, ssc_year = $4,
                college_name = $5, hsc_board = $6, hsc_gpa = $7, hsc_year = $8,
                university = $9, department = $10, semester = $11, cgpa = $12
             WHERE user_id = $13`,
            [
                education.school_name,
                education.ssc_board,
                education.ssc_gpa,
                education.ssc_year,
                education.college_name,
                education.hsc_board,
                education.hsc_gpa,
                education.hsc_year,
                education.university,
                education.department,
                education.semester,
                education.cgpa,
                user_id
            ]
        );

        // ---------- 5. Skills — আগের সব Delete করে নতুন Insert ----------
        await client.query('DELETE FROM skills WHERE user_id = $1', [user_id]);

        if (skills.length > 0) {
            for (const skill of skills) {
                await client.query(
                    `INSERT INTO skills (user_id, skill_name, proficiency)
                     VALUES ($1, $2, $3)`,
                    [user_id, skill.skill_name, skill.proficiency]
                );
            }
        }

        // ---------- 6. Experience — আগের সব Delete করে নতুন Insert ----------
        await client.query('DELETE FROM experience WHERE user_id = $1', [user_id]);

        if (experience.length > 0) {
            for (const exp of experience) {
                await client.query(
                    `INSERT INTO experience
                     (user_id, company_name, position, start_date, end_date, is_current, description)
                     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    [
                        user_id,
                        exp.company_name,
                        exp.position,
                        exp.start_date,
                        exp.end_date || null,
                        exp.is_current || false,
                        exp.description || null
                    ]
                );
            }
        }

        await client.query('COMMIT');

        // PostgreSQL Transaction Successful হওয়ার পর MongoDB-তে Blood Info Save/Update করা
        if (bloodInfo) {
            try {
                await saveBloodDonorInfo(user_id, bloodInfo);
            } catch (mongoError) {
                console.error('Blood Donor Info Update Error:', mongoError.message);
            }
        }

        // Activity Log (MySQL)
        await logActivity({
            user_id,
            user_name: `${personal.first_name} ${personal.surname}`,
            user_email: personal.email,
            action_type: ACTIONS.FORM_UPDATE,
            description: 'Updated application form'
        });

        res.status(200).json({ message: 'Application Updated Successfully' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Update Form Error:', error.message);
        res.status(500).json({ message: 'Server Error, Update করা যায়নি' });
    } finally {
        client.release();
    }
};

// ==========================================
// DELETE APPLICATION (Application Data মুছে ফেলা, Account থাকবে)
// ==========================================
const deleteApplication = async (req, res) => {
    const user_id = req.user.user_id;

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const existing = await client.query(
            'SELECT id FROM personal_information WHERE user_id = $1',
            [user_id]
        );

        if (existing.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ message: 'কোনো Application পাওয়া যায়নি' });
        }

        // personal_information Delete করলে ON DELETE CASCADE এর কারণে
        // সরাসরি Related কিছু নেই, তাই প্রতিটা Table আলাদা করে Delete করতে হবে
        await client.query('DELETE FROM skills WHERE user_id = $1', [user_id]);
        await client.query('DELETE FROM experience WHERE user_id = $1', [user_id]);

        // family_information Delete করলে siblings Auto Delete হবে (ON DELETE CASCADE)
        await client.query('DELETE FROM family_information WHERE user_id = $1', [user_id]);

        await client.query('DELETE FROM education WHERE user_id = $1', [user_id]);
        await client.query('DELETE FROM personal_information WHERE user_id = $1', [user_id]);

        // Delete করার আগে User-এর Info নিয়ে রাখা (Log-এর জন্য)
        const userInfo = await client.query('SELECT username, email FROM users WHERE id = $1', [user_id]);

        await client.query('COMMIT');

        // Activity Log (MySQL)
        await logActivity({
            user_id,
            user_name: userInfo.rows[0]?.username,
            user_email: userInfo.rows[0]?.email,
            action_type: ACTIONS.APPLICATION_DELETE,
            description: 'Deleted application form'
        });

        // MongoDB থেকেও Blood Donor Data Delete করা

        // MongoDB থেকেও Blood Donor Data Delete করা
        try {
            const BloodDonor = require('../models/BloodDonor');
            await BloodDonor.deleteOne({ user_id: user_id });
        } catch (mongoError) {
            console.error('Blood Donor Delete Error:', mongoError.message);
        }

        res.status(200).json({ message: 'Application Deleted Successfully' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Delete Application Error:', error.message);
        res.status(500).json({ message: 'Server Error, Delete করা যায়নি' });
    } finally {
        client.release();
    }
};

// ==========================================
// DELETE ACCOUNT (পুরো User Account মুছে ফেলা)
// ==========================================
const deleteAccount = async (req, res) => {
    const user_id = req.user.user_id;

    try {
        // Delete করার আগে User-এর Info নিয়ে রাখা (Log-এর জন্য)
        const userInfo = await pool.query('SELECT username, email FROM users WHERE id = $1', [user_id]);

        // users Table থেকে Delete করলে ON DELETE CASCADE এর কারণে
        // personal_information, family_information, education, skills, experience
        // সবকিছু Automatic ভাবে Delete হয়ে যাবে
        const result = await pool.query(
            'DELETE FROM users WHERE id = $1 RETURNING id',
            [user_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User পাওয়া যায়নি' });
        }

        // Activity Log (MySQL)
        await logActivity({
            user_id,
            user_name: userInfo.rows[0]?.username,
            user_email: userInfo.rows[0]?.email,
            action_type: ACTIONS.ACCOUNT_DELETE,
            description: 'Account permanently deleted'
        });

        // MongoDB থেকেও Blood Donor Data Delete করা
        try {
            const BloodDonor = require('../models/BloodDonor');
            await BloodDonor.deleteOne({ user_id: user_id });
        } catch (mongoError) {
            console.error('Blood Donor Delete Error:', mongoError.message);
        }

        res.status(200).json({ message: 'Account Deleted Successfully' });

    } catch (error) {
        console.error('Delete Account Error:', error.message);
        res.status(500).json({ message: 'Server Error, Account Delete করা যায়নি' });
    }
};
// ==========================================
// GET PROFILE (Dashboard-এর জন্য — Full Data সহ)
// ==========================================
const getProfile = async (req, res) => {
    const user_id = req.user.user_id;

    try {
        const userResult = await pool.query(
            'SELECT id, username, email, role, created_at FROM users WHERE id = $1',
            [user_id]
        );

        const personalResult = await pool.query(
            'SELECT * FROM personal_information WHERE user_id = $1',
            [user_id]
        );

        const isSubmitted = personalResult.rows.length > 0;

        // Application Submit করা না থাকলে শুধু User Info পাঠিয়ে দেওয়া
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

        // ---------- Family + Siblings ----------
        const familyResult = await pool.query(
            'SELECT * FROM family_information WHERE user_id = $1',
            [user_id]
        );

        let siblings = [];
        if (familyResult.rows.length > 0) {
            const siblingsResult = await pool.query(
                'SELECT sibling_name, sibling_relation FROM siblings WHERE family_id = $1',
                [familyResult.rows[0].id]
            );
            siblings = siblingsResult.rows;
        }

        // ---------- Education ----------
        const educationResult = await pool.query(
            'SELECT * FROM education WHERE user_id = $1',
            [user_id]
        );

        // ---------- Skills ----------
        const skillsResult = await pool.query(
            'SELECT skill_name, proficiency FROM skills WHERE user_id = $1',
            [user_id]
        );

        // ---------- Experience ----------
        const experienceResult = await pool.query(
            'SELECT company_name, position, start_date, end_date, is_current, description FROM experience WHERE user_id = $1 ORDER BY start_date DESC',
            [user_id]
        );

        // ---------- Blood Donor Info (MongoDB থেকে) ----------
        let bloodInfo = null;
        try {
            bloodInfo = await getBloodDonorInfo(user_id);
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
        console.error('Get Profile Error:', error.message);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { submitForm, updateForm, getProfile, deleteApplication, deleteAccount };