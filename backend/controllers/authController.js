const { logActivity, ACTIONS } = require('../utils/activityLogger');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

//register
const registerUser = async(req, res) =>{
    const{ username, email, password} = req.body;

    if(!username || !email || !password){
        return res.status(400).json({message: 'Please fill up all field'});
    }

    try{
        //previous email check
        const existingUser = await pool.query(
            'SELECT id FROM users where email = $1',
            [email]
        );

        if(existingUser.rows.length>0){
            return res.status(400).json({message:'There is an account associated with this email'});
        }

        //password hash
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        //insert database
        const newUser = await pool.query(
            `INSERT INTO users (username, email, password)
            VALUES($1, $2, $3)
            RETURNING id, username, email, role, created_at`,
            [username, email, hashedPassword]
        );

        // Activity Log (MySQL) — নতুন Account তৈরি হওয়ার Record রাখা
        await logActivity({
            user_id: newUser.rows[0].id,
            user_name: newUser.rows[0].username,
            user_email: newUser.rows[0].email,
            action_type: ACTIONS.REGISTER,
            description: 'New account created'
        });

        res.status(201).json({
            message:'Registation Successful',
            user: newUser.rows[0]
        });
    } catch(error){
        console.error('Register Error:',error.message);
        res.status(500).json({message:'Server Error'});
    }
};

//login
const loginUser = async(req, res)=>{
    const {email,password} = req.body;

    if(!email || !password){
        return res.status(400).json({message:'Please give your Email and Password'});
    }

    try{
        //find user
        const result = await pool.query(
            'SELECT * FROM users WHERE email = $1',
            [email]
        );

        if(result.rows.length===0){
            return res.status(401).json({message:'Invalid Email or Password'});
        }

        const user = result.rows[0];
        
        //password match check
        const isMatch = await bcrypt.compare(password,user.password);
        if(!isMatch){
            return res.status(401).json({message:'Invalid Email or Password'});
        }

        //jwt token making 
        const token = jwt.sign(
            {user_id: user.id, email: user.email, role: user.role},
            process.env.JWT_SECRET,
            {expiresIn: '1h'}
        );

        // Activity Log (MySQL) — Login Record রাখা
        await logActivity({
            user_id: user.id,
            user_name: user.username,
            user_email: user.email,
            action_type: ACTIONS.LOGIN,
            description: 'User logged in'
        });

        res.status(200).json({
            message: 'Login Successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch(error){
        console.error('Login Error:', error.message);
        res.status(500).json({message:'Server Error'});
    }
};

module.exports = {registerUser, loginUser};