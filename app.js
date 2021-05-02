var express = require('express'),
    path = require('path'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    expressValidador = require('express-validator'),
    
    flash = require('connect-flash'),
    session = require('express-session'),
    passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    mongo = require('mongodb'),
    mongoose = require('mongoose'),
    config = require('./config/database');
var SocketSrv = require("./app/Socket.service");
var User = require("./models/user");






mongoose.connect(config.development, { useNewUrlParser: true, useUnifiedTopology: true });
//var db=mongoose.connection;

// routes
var routes = require('./routes/index.route'),
    homeRoute = require('./routes/home.route'),
    userRoute = require('./routes/users.route'),
    apiRoute = require('./routes/api.route'),
    authenticationRoute = require('./routes/authentication.route');


var helpers = require('./helpers/app.helpers');




var app = express();
// View engine
app.set('views', path.join(__dirname, 'views/tough/'));
app.set('view engine', 'ejs');

// body parse midlleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());


// set Static forlder
app.use(express.static(path.join(__dirname, 'public')));

// Express session
app.use(session({
    secret: 'secret',
    saveUninitialized: true,
    resave: true
}));

// initialize passport
app.use(passport.initialize());
app.use(passport.session());

// connect Flash
app.use(flash());

// global vars
app.use(function (req, res, next) {
    res.locals.success_msg = req.flash('susses_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    res.locals.user = req.user || null;
    res.locals["socketio"] = io;
    res.locals.url = req.url.split('/')[1] || 'home'
    res.locals.hostname = req.hostname
    next();
})

app.use('/', homeRoute);
app.use('/io', userRoute);
app.use('/api', apiRoute);
app.use('/authentication', authenticationRoute);

app.get('/authentication/github',
    passport.authenticate('github'));

app.get('/authentication/github/callback',
    passport.authenticate('github', { failureRedirect: '/login' }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect('/io');
    });

app.set('port', (process.env.PORT || 9600));
var server = app.listen(app.get('port'), function () {
    console.log("listing to port: " + app.get('port'))
});

const io = require('socket.io')(server);
var sockets=[];
io.on('connection', client => {
    console.log('My new ID is : '+client.id)
    client.on('start', data => { console.log('connect: ' + data) });
    client.emit('start', client.id,(x)=>{
        var t=x;
        console.log('Respond with', x)
    });
    client.on('disconnect', (x) => {


        socket=sockets.filter(s=>s.sessionId===client.id)
        if(socket.length>0){
            socket=socket[0]
            io.emit('device-'+socket.deviceId+'-not-active!',{});
            sockets=sockets.filter(s=>s.deviceId!==client.deviceId)
        }
        
        console.log('disco' + x)
    });


    client.on('server-checkdevice', (x) => {
        console.log('disco' + x)
        x='f539e1d9370f7e0c';
        client.emit('client-device-state-'+x, client.client.id);
    });
    
    client.on('device-is-active!',(device)=>{
        io.emit('device-'+device.deviceId+'-active!',{});
    })
    client.on('server-device-check', (device) => {
        io.emit('is-'+device.deviceId+'-active?',{});
    });
    client.on('update-socket-id', (device) => {
        sockets=sockets.filter(s=>s.deviceId!==device.deviceId)
        io.emit('device-'+device.deviceId+'-active!',{});
        sockets.push(device)
    });
});

io.on('start', client => {

    client.on('start', data => { console.log('connect: ' + data) });
    client.emit('start', 'connected');
    client.on('disconnect', (x) => {
        console.log('disco' + x)
    });
});