const mongoose = require("mongoose");
const messageSchema = new mongoose.Schema({
    from: String,
    to: String,
    message: String,
    timeStamp: { type: Date, default: Date.now }
});


const Message = mongoose.model('Message', messageSchema);
module.exports=Message;