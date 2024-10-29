module.exports= function(io,users)
{const express = require("express");
const Message = require("../models/message_model");
const { protect } = require("../middleware/auth_middleware");
const User = require("../models/user_model");

const router = express.Router();
router.post("/sendMessage",protect, async(req, res)=>{
    const{to, message}=req.body;
    const from =req.user.id;
    
      try{
        const recipient = await User.findById(to)
        if(!recipient){
          return res.status(404).json({ status: false, message: "Recipient not found" });

        }
        const newMessage = new Message({
          from,
          to,
          message
        });
        await newMessage.save();
        const targetSocketID =users[to];
        if(targetSocketID){
          io.to(targetSocketID).emit("chat message",{from, message});
        }else {
            // The user is offline, consider sending a notification here
            console.log(`User ${to} is offline. Consider sending a notification.`);
            // Example: sendNotification(to, "You have a new message!");
        }
        res.json({status: true,message:"Message sent"})
      }catch (error) {
        console.log(error);
        res.status(500).json({status: false, message: "Error sending message " });
      }
    });
router.get('/getMessages',protect, async (req, res) => { 
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
return router;
}