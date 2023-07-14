const express = require('express');
const mongoose = require('mongoose')
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const Chat = require('../../schemas/chatSchema');

firebase.initializeApp(config);
const storage = firebasestorage.getStorage();
const whitelist = [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp'
]
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        if (!whitelist.includes(file.mimetype)) {
            console.log('hii')
            return cb(new Error('file is not allowed'))
        }
        cb(null, true)
    }
}).single('croppedImage');

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

router.post('/profilePicture', (req, res) => {
    upload(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
            alert(`${err.message}. Refresh page!`);
        } else {
            try {
                const dateTime = giveCurrentDateTime();
                const storageRef = firebasestorage.ref(storage, `files/${req.file.originalname + " " + dateTime}`);
                const metadata = {
                    contentType: req.file.mimetype,
                };
                const snapshot = await firebasestorage.uploadBytesResumable(storageRef, req.file.buffer, metadata);
                const downloadURL = await firebasestorage.getDownloadURL(snapshot.ref);
                res.send(downloadURL);
            } catch (err) {
                console.log(err)
            }
        }
    })
})
const giveCurrentDateTime = () => {
    const today = new Date();
    const date = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();
    const time = today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
    const dateTime = date + ' ' + time;
    return dateTime;
}

module.exports = router
