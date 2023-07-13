const express = require('express');
const multer = require('multer');
const alert = require('alert');
const fs = require('fs');
const path = require('path');
const User = require('../../schemas/userSchema');

const firebase = require("firebase/app")
const firebasestorage = require("firebase/storage");
const config = require("../../firebaseconfig")

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

router.get('/', (req, res) => {
    User.find({
        $or: [
            { name: { $regex: req.query.search, $options: "i" } },
            { phone: { $regex: req.query.search } }
        ]
    }).then(results => res.status(200).send(results))
        .catch(err => console.log(err.message))
})

router.post('/profilePicture', (req, res) => {

    upload(req, res, async function (err) {
        if (err instanceof multer.MulterError) {
            alert(`${err.message}. Refresh page!`);
        } else {
            var profpic = req.cookies.user.profilepic;
            try {
                const dateTime = giveCurrentDateTime();
                const storageRef = firebasestorage.ref(storage, `files/${req.file.originalname + " " + dateTime}`);
                const metadata = {
                    contentType: req.file.mimetype,
                };
                const snapshot = await firebasestorage.uploadBytesResumable(storageRef, req.file.buffer, metadata);
                const downloadURL = await firebasestorage.getDownloadURL(snapshot.ref);
                var user = await User.findByIdAndUpdate(req.cookies.user._id, { profilepic: downloadURL }, { new: true });
                if (profpic != '/images/profilePic.jpeg') {
                    const desertRef = firebasestorage.ref(storage, profpic);
                    await firebasestorage.deleteObject(desertRef)
                }
                res.cookie('user', user, { httpOnly: true });
                res.send(user);
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

router.post('/updateAbout', async (req, res) => {
    var user = await User.findByIdAndUpdate(req.cookies.user._id, req.body, { new: true })
    res.cookie('user', user, { httpOnly: true });
    res.redirect('/');
})

module.exports = router;