const express = require('express')
const User = require('../schemas/userSchema')

const router = express.Router();

router.get('/', (req, res) => {
    res.render('signupPage')
})

router.post('/', async (req, res) => {
    const userexist = await User.findOne({ phone: req.body.phone });
    if (userexist) {
        var payload = req.body;
        payload.errormsg = 'An account with that number already exists.'
        res.render('signupPage', payload)
    } else {
        const user = await User.create(req.body)
        res.cookie('user', user, { httpOnly: true });
        res.redirect('/')
    }
})

module.exports = router;