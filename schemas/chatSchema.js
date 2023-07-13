const mongoose = require('mongoose')

const chatSchema = new mongoose.Schema({
    name: {
        type: String
    },
    profilepic: {
        type: String,
        default: 'images/profilepic.jpeg'
    },
    users: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    isgroupchat: {
        type: Boolean,
        default: false
    },
    latestmsg: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    }
}, { timestamps: true })

const Chat = mongoose.model('Chat', chatSchema);
module.exports = Chat;
