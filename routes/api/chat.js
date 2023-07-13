const express = require('express');
const mongoose = require('mongoose')
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const upload = multer({ dest: 'uploads/' })
const Chat = require('../../schemas/chatSchema');

const router = express.Router();

router.get('/normalchat', (req, res) => {
    Chat.find({
        users: { $elemMatch: { $eq: new mongoose.Types.ObjectId(req.query.userid) } },
        latestmsg: { '$exists': true },
        isgroupchat: false
    }).sort('-updatedAt').populate('users').populate('latestmsg')
        .then(results => res.send(results))
        .catch(err => console.log(err.message))
})

router.get('/groupchat', (req, res) => {
    Chat.find({
        users: { $elemMatch: { $eq: new mongoose.Types.ObjectId(req.query.userid) } },
        isgroupchat: true
    }).sort('-updatedAt').populate('latestmsg')
        .then(async results => {
            results = await Chat.populate(results, { path: "latestmsg.sender" });
            res.send(results)
        })
        .catch(err => console.log(err.message))
})

router.post('/', async (req, res) => {
    // console.log(req.body);
    // console.log(req.body.groupchat)
    // console.log(JSON.parse(req.body.users));

    if (req.body.groupchat == 'true') {
        const users = JSON.parse(req.body.users);
        const userids = users.map(user => user._id)
        userids.push(req.cookies.user._id)

        Chat.create({
            name: req.body.name,
            users: userids,
            isgroupchat: true,
            profilepic: req.body.profilepic
        }).then(result => res.status(200).send(result))
            .catch(err => console.log(err))

    } else {
        const user = JSON.parse(req.body.user)
        const chat = await Chat.find({
            users: {
                $size: 2,
                $all: [
                    { $elemMatch: { $eq: new mongoose.Types.ObjectId(user._id) } },
                    { $elemMatch: { $eq: new mongoose.Types.ObjectId(req.cookies.user._id) } }
                ]
            }
        }).populate('users')

        if (chat.length !== 0) {
            res.status(200).send(chat[0])
        } else {
            Chat.create({
                users: [user._id, req.cookies.user._id]
            }).then(async result => {
                result = await result.populate('users')
                res.status(200).send(result)
            })
        }
    }

})

router.post('/profilePicture', upload.single('croppedImage'), (req, res) => {
    console.log(req.file);
    var filepath = `/public/uploads/${req.file.filename}.png`;
    var temppath = req.file.path;
    var targetpath = path.join(__dirname, `../../${filepath}`)
    fs.rename(temppath, targetpath, async err => {
        if (err) {
            console.log(err.message);
            return res.sendStatus(400)
        }
        res.send(`uploads/${req.file.filename}.png`);
    })
})

module.exports = router