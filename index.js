const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const Message = require("./models/message_model");
const { protect } = require("./middleware/auth_middleware");
const mongoose = require("mongoose");
const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.use(express.json());
const users = {};


mongoose.connect('mongodb://localhost:27017/chat_message')
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.error("MongoDB connection error:", err));

// Use capitalized name for the model


io.on("connection", (socket) => {
    console.log("A user connected");


    socket.on("register", (userId) => {
        users[userId] = socket.id;
        if (!userId) {
            console.error("User ID is required for registration");
            return;
        }
        console.log(`User ${userId} is connected with socket ID: ${socket.id}`);
    });

    socket.on("private message", async (data) => {
        const { from, to, message } = data;
if(!data || !data.from || !data.to ||!data.message){
    console.error("Invalid data received for private message:", data);

    return;
}
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
                io.to(targetSocketID).emit("notification", {
                    from: from,
                    message: message
                });
                io.to(targetSocketID).emit("chat message", {
                    from: from,
                    message: message
                });
            }
        } catch (error) {
            console.error("Error saving message:", error);
        }
    });
    socket.on("chat message", (data) => {
        const { from, message } = data;
        console.log(`Message from ${from}: ${message}`);
        // You can display the message in the UI here
    });
    socket.on("notification", (data) => {
        const { from, message } = data;
        console.log(`notication from ${from}: ${message}`);
        // You can display the message in the UI here
    });

    socket.on("disconnect", () => {
        console.log("User disconnected");
        for (let userId in users) {
            if (users[userId] === socket.id) {
                delete users[userId];
                 io.emit("user disconnected", { userId });
                break;
            }
        }
    });  
});
 

app.use("/api/auth", require("./routes/auth"));
const messageRoutes = require("./routes/message")(io, users);  // Pass io and users to the message routes
app.use("/api/messages", messageRoutes);

///Middleware to Protect Routes

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
