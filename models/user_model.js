const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
    },
    contacts: [{
        type: mongoose.Schema.Types.ObjectId, ref: 'User'
    }]
}) 
userSchema.method.correctPassword = async function (inputPassword, userPassword) {
    return await bcrypt.compare(inputPassword, userPassword);


}
const User = mongoose.model('User', userSchema);
module.exports = User;