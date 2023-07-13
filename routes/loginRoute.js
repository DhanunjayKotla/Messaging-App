const express = require('express');
const User = require('../schemas/userSchema');
const router = express.Router();

router.get('/', (req, res) => {
    res.render('loginPage')
})

router.post('/', async (req, res) => {
    const user = await User.findOne({ phone: req.body.phone.replace(/ /g, '') })
    if (user && user.password === req.body.password) {
        res.cookie('user', user, { httpOnly: true });
        res.redirect('/')
    } else {
        var payload = req.body;
        payload.errormsg = 'Incorrect credentials'
        res.render('loginPage', payload)
    }
})

module.exports = router;
