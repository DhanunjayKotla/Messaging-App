const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    about: {
        type: String,
        default: "Hey there, I'm using whatsapp!"
    },
    profilepic: {
        type: String,
        default: '/images/profilePic.jpeg'
    },
    phone: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    }
})

const User = mongoose.model('User', userSchema);
module.exports = User;