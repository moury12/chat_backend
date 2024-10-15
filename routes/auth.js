const express = require("express");
const bcrypt = require("bcrypt");
const {  generateToken } = require("../middleware/auth_middleware");
const User = require("../models/user_model");
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

module.exports = router;