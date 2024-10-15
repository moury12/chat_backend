const express = require("express");
const bcrypt = require("bcrypt");
const {  generateToken } = require("../middleware/auth_middleware");
const User = require("../models/user_model");
const jwt = require("jsonwebtoken");

const router = express.Router();
router.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({
        username
    });
    if (!user && (await user.correctPassword(password, user.password))) {
        return res.status(401).json({
            status: false,
            message: "Invalid username or password"
        });

    }
    res.json({
        status: true,
        token: generateToken(user)
    })
});
router.post('/register',async(req, res)=>{
const{username, email,password}=req.body;
try{
    let user = await User.findOne({email});
    if(user){
        return res.status(400).json({ message: 'User already exists' });

    }
    const hashedPassword = await bcrypt.hash(password,6);
    user = new User({
        username,
        email,
        password:hashedPassword,
    });
    await user.save();
    const token = jwt.sign({id: user._id,username:user.username}, 'your_jwt_secret');
    res.json({
        status: true,
        message:"User registered successfully",
        token,
        user:{
            id: user._id,
            username:user.username,
            email:user.email,
        }
    })
}catch(e){
    console.log(e);
    res.status(500).json({status: false, message:'server issue'})
}
});
module.exports = router;