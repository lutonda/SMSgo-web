var User = require("../models/user");
var Station = require("../models/station");

exports.index = function (req, res, next) {
    res.render("api", { title: "Hey", message: "Hello there!" });
};

exports.stationAutehenticateByEmail = function (req, res, next) {
    var response = {};
    User.getByUsername(req.body.email, function (err, user) {
        if (err) throw err;
        if (!user) {

            res.status(401)
            res.json({
                status: 401,
                message: "Unknow user " + req.body.email
            });
        }
        else
            User.comparePassword(req.body.password, user.password, async function (
                err,
                isMacth
            ) {
                if (err) throw err;
                if (isMacth) {
                    var station = await Station.findOne({ user: user.id, deviceId: req.body.station.deviceId });

                    if (!station)
                        try {
                            station = new Station(req.body.station);

                            station.user = user;
                            station = await Station.create(station);
                            station.user = user;
                        } catch (error) {
                            throw error;
                        }

                    station.user = user;
                    res.status(200)
                    res.json({
                        status: 200,
                        message: "Welcome to RESTHub crafted with love!",
                        station: station,
                        token: Math.floor((Math.random() * 100000) + 1)
                    });
                } else {
                    res.status(403)
                    res.json({
                        status: 403,
                        message: "wrong password"
                    });
                }
            });
    });
};

exports.stationAutehenticateByApiKey = function (req, res, next) {
    var response = {};
    console.log(res.body)
    User.getByApiKey(req.body.apiKey, async function (err, user) {
        
        if (err) throw err;
        if (user) {
            var station = await Station.findOne({ user: user.id, deviceId: req.body.station.deviceId });
            if (!station)
                try {
                    station = new Station(req.body.station);
                    
                    station.user = user;
                    station = await Station.create(station);
                    station.user = user;
                } catch (error) {
                    throw error;
                }
            station.user = user;
            res.status(200)
            res.json({
                status: 200,
                message: "Welcome to RESTHub crafted with love!",
                station: station,
                token: Math.floor((Math.random() * 100000) + 1)
            });
        } else {
            res.json({
                status: 401,
                message: "wrong Api Key"
            });
        }
    });
};

exports.stationSendsms = async function (req, res) {

    const io = res.locals["socketio"];

    let user = await User.findOne({apikey:req.query.apikey}).populate('stations')
    User.getByApiKey(req.query.apikey, function (err, user) {
        if (err) throw err;
        if (!user)
            res.json({
                status: 401,
                message: "Unknow user"
            });
        else
            Station.getByUser(user.id, function (err, stations) {
                if (err) throw err;

                let station=stations.filter(x => x.key === req.query.phoneId)[0]
                
                    if (station) {
                        
                        io.emit('connction-send-sms-'+station.deviceId, req.query);

                       /* client.on('device-is-active!',(device)=>{
                            io.emit('device-'+device.deviceId+'-active!',{});
                        })
                        client.on('server-device-check', (device) => {
                            io.emit('is-'+device.deviceId+'-active?',{});
                        });*/
                        res.json({
                            status: 200,
                            message: "Success, Message sent",
                        });

                    }
                    else
                        res.json({
                            status: 401,
                            message: "Unknow station ID",
                        });
                
            })
    });
};
