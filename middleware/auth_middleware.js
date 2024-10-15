const jwt = require("jsonwebtoken");
function generateToken(user) {
    return jwt.sign({
        id: user.id, username: user.username
    })
}
function protect(req, res, next){
    const token = req.headers.auhorization?.split(" ")[1];
    if(!token){
        return res.status(401).json({
            status: false,
            message:"Access denied. No token provided."
        });
    }
    try{
    const decoded =jwt.verify(token,'your_jwt_secret');
    req.user = decoded;
    next();
    }catch(e){
        res.status(401).json({ status: false,message: e});
    }
    }
    module.exports = { protect, generateToken };