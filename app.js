const express = require('express')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser');
const path = require('path')

const app = express();

app.set("view engine", "pug");
app.set("views", "views");

app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const loginRoute = require('./routes/loginRoute');
const signupRoute = require('./routes/signupRoute');

const usersapiRoute = require('./routes/api/user');
const chatsapiRoute = require('./routes/api/chat');
const messagesapiRoute = require('./routes/api/message');

app.use('/login', loginRoute);
app.use('/signup', signupRoute);

app.use('/api/users', usersapiRoute);
app.use('/api/chats', chatsapiRoute);
app.use('/api/messages', messagesapiRoute)

const authenticate = (req, res, next) => {
    if (req.cookies.user) {
        next()
    } else {
        res.redirect('/login');
    }
}

app.get('/', authenticate, (req, res) => {
    res.render('homePage', { userloggedin: req.cookies.user, userloggedinJs: JSON.stringify(req.cookies.user) });
})

module.exports = app;
