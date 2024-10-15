const express = require("express");
const Message = require("../models/message_model");
const { protect } = require("../middleware/auth_middleware");

const router = express.Router();
router.post("/sendMessage",protect, async(req, res)=>{
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
    router.get('/messages', async (req, res) => { 
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
    module.exports=router;