const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) =>{
    //taking token from header
    const authHeader = req.headers['authorization'];

    if(!authHeader){
        return res.status(401).json({message:'Token not found, please log in.'});
    }

    //"bearer eyJhbGcioi..." theke token alada kora
    const token = authHeader.split(' ')[1];

    if(!token){
        return res.status(401).json({message:'Token not found'});
    }

    try{
        const decoded = jwt.verify(token,process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }catch(error){
        return res.status(401).json({message:'Token invalid or Expired'});
    }
};

module.exports = verifyToken;