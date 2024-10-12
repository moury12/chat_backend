const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { type } = require("os");
const { use } = require("bcrypt/promises");
const app = express();
const server = http.createServer(app);
const io = new Server(server);
const users = {};

mongoose.connect('mongodb://localhost:27017/chat_message')
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.error("MongoDB connection error:", err));

// Use capitalized name for the model
const messageSchema = new mongoose.Schema({
    from: String,
    to: String,
    message: String,
    timeStamp: { type: Date, default: Date.now }
});
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
const Message = mongoose.model('Message', messageSchema);

function generateToken(user) {
    return jwt.sign({
        id: user.id, username: user.username
    })
}
io.on("connection", (socket) => {
    console.log("A user connected");

    socket.on("disconnect", () => {
        console.log("User disconnected");
    });

    socket.on("register", (userId) => {
        users[userId] = socket.id;
        console.log(`User ${userId} is connected with socket ID: ${socket.id}`);
    });

    socket.on("private message", async (data) => {
        const { from, to, message } = data;

        // Create a new instance of the Message model
        const newMessage = new Message({
            from: from,
            to: to,
            message: message
        });

        try {
            await newMessage.save();
            console.log(`Message from ${from} to ${to}: ${message}`);

            const targetSocketID = users[to];
            if (targetSocketID) {
                io.to(targetSocketID).emit("chat message", {
                    from: from,
                    message: message
                });
            }
        } catch (error) {
            console.error("Error saving message:", error);
        }
    });

    socket.on("disconnect", () => {
        console.log("User disconnected");
        for (let userId in users) {
            if (users[userId] === socket.id) {
                delete users[userId];
                break;
            }
        }
    });
});
app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({
        username
    });
    if (!use && (await user.correctPassword(password, user.password))) {
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
app.post("/sendMessage",protect, async(req, res)=>{
const{to, message}=req.body;
const from =req.user.id;
const newMessage = new Message({
    from,
    to,
    message
  });
  try{
    await newMessage.save();
    res.json({status: true,message:"Message sent"})
  }catch (error) {
    res.status(500).json({status: false, message: "Error sending message" });
  }
});
app.get('/messages', async (req, res) => { 
    const { user1, user2 } = req.query;
    const currentUserId=req.user.id;
    if (currentUserId !== user1 && currentUserId !== user2) {
        return res.status(403).json({ message: "You are not authorized to view these messages" });
      }
    try {
        const messages = await Message.find({
            $or: [
                { from: user1, to: user2 },
                { from: user2, to: user1 }
            ]
        }).sort({ timeStamp: 1 });
        res.json(messages);
    } catch (e) {
        res.status(500).send('Error retrieving messages');
    }
});
///Middleware to Protect Routes

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
