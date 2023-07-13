const express = require('express');
const mongoose = require('mongoose');
const Message = require('../../schemas/messageSchema');
const Chat = require('../../schemas/chatSchema');

const router = express.Router();

router.get('/', (req, res) => {
    Message.find({ chat: req.query.chatid }).populate('sender')
        .then(result => res.status(200).send(result))
        .catch(err => console.log(err.message))
})

router.post('/', (req, res) => {
    Message.create({
        content: req.body.content,
        chat: req.body.chatid,
        sender: req.cookies.user._id,
        readBy: [req.cookies.user._id]
    }).then(async result => {
        Chat.findByIdAndUpdate(req.body.chatid, { latestmsg: result._id }, { new: true })
            .catch(err => console.log(err.message))
        result = await result.populate(['chat', 'sender'])
        res.status(200).send(result)
    })
        .catch(err => console.log(err.message))
})

router.get('/noofunreadmsgs', (req, res) => {
    Message.find({
        chat: req.query.chatid,
        readBy: { $not: { $elemMatch: { $eq: new mongoose.Types.ObjectId(req.cookies.user._id) } } }
    }).then(result => res.status(200).send(result))
        .catch(err => console.log(err.message));
})

router.put("/markasread", async (req, res, next) => {
    Message.updateMany({ chat: req.body.chatid }, { $addToSet: { readBy: req.cookies.user._id } }, { new: true })
        .then(results => res.sendStatus(200))
        .catch(error => {
            console.log(error);
            res.sendStatus(400);
        })
})

router.get('/usersunreadmsgs', (req, res) => {
    Message.find({
        readBy: { $not: { $elemMatch: { $eq: new mongoose.Types.ObjectId(req.cookies.user._id) } } }
    }).populate('chat')
        .then(results => {
            results = results.filter(r => r.chat.users.includes(req.cookies.user._id))
            res.send(results)
        })
})

module.exports = router;