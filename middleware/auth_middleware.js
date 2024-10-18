const jwt = require("jsonwebtoken");
const your_jwt_secret ="moureuhhu342-002-"
function generateToken(user) {
    return jwt.sign({
        id: user.id, username: user.username, email:user.email
    },your_jwt_secret)
}
function protect(req, res, next){
    const token = req.header('Authorization')?.split(' ')[1];  // Extract Bearer token
    if(!token){
        return res.status(401).json({
            status: false,
            message:"Access denied. No token provided."
        });
    }
    try{
    const decoded =jwt.verify(token,your_jwt_secret);
    req.user = decoded;
    next();
    }catch(e){
        res.status(401).json({ status: false,message: e});
    }
    }
    module.exports = { protect, generateToken };