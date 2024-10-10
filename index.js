const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");

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

const Message = mongoose.model('Message', messageSchema);

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

app.get('/messages', async (req, res) => {
    const { user1, user2 } = req.query;
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

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
