var express = require('express');
var bodyParser = require('body-parser');
var models = require('./models');
var app =  express();
var router = express.Router();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({"extended" : false}));

router.get('/', function(req, res){
    console.log(req.query);
    res.send('<h1>Real Chat</h1>');
});

router.route('/register/:username').get(function(req, res) {
    var username = req.params.username; 
    var response = {};
    console.log('username:' + username);

    models.User.findOne({username:username}, function(err, user) {
        if(user) {
            response = {"success": false, "message": "Username exist"};
            res.json(response);
        }
        else {
            var user = new models.User();
            user.username = username;
            user.createdAt = new Date();
            user.updatedAt = new Date();

            user.save(function(err) {
                response = {"success": true};
                res.json(response);
            });
        }
    });
});

router.route('/topic').get(function(req, res) {
    var response = {};
    
    models.Topic.find({}, function(err, topics) {
        if(err) {
            response = {'success': false};
        }
        else {
            response = {'success': true, 'data': topics};
        }

        res.json(response);
    });    
});

router.route('/message/:topicId/:offset').get(function(req, res) {
    var topicId = req.params.topicId;
    var offset = req.params.offset;
    var response = {};

    models.Message
    .find({topicId: topicId})
    .sort({'createdAt': 1})
    .skip(offset)
    .limit(20)
    .exec(function(err, messages) {
        if(err) {
            response = {'success': false};
        } 
        else {
            var data = Array();

            for(var i=0; i<messages.length; i++) {
                var message = {
                    id: messages[i]._id,
                    topicId: messages[i].topicId,
                    username: messages[i].username,
                    message: messages[i].message,
                    createdAt: messages[i].createdAt.getTime()
                };

                data.push(message);
            }

            response = {'success': true, 'data': data};
        }

        res.json(response);
    });
});

io.on('connect', function(socket){
    console.log('a user connected:' + socket);

    socket.on('addUser', function(username) {
        console.log('new user:' + username);
        models.User.findOne({'username': username}, function(err, user) {
            if(user) {
                console.log('userId:' + user.id);
                socket.username = username;

                // joining users to all topics
                models.Topic.find({}, function(err, topics) {
                    for(var i=0; i<topics.length; i++) {
                        var topic = topics[i];
                        socket.join(topic.id);
                        console.log('Joining topic:' + topic.id);
                    }
                });

                socket.broadcast.emit('userJoined', {
                    id: user.id,
                    username: username
                });
            }
        });
    });

    socket.on('newMessage', function(topicId, msg) {
        console.log('newMessage, username:' + socket.username + ', topicId: ' + topicId + ', msg: ' + msg);
        var date = new Date();
        var message = new models.Message();
        message.username = socket.username;
        message.topicId = topicId;
        message.message = msg;
        message.createdAt = date;
        message.updatedAt = date;

        message.save(function(err) {
            console.log('broadcasting to topic:' + topicId);
            socket.broadcast.to(topicId).emit('newMessage', {
                id: message._id,
                topicId: topicId,
                username: message.username,
                message: msg,
                createdAt: date.getTime()
            });
        });
    });

    socket.on('newTopic', function(title) {
        var topic = new models.Topic();
        topic.title = title;
        topic.createdAt = new Date();
        topic.updatedAt = new Date();

        topic.save(function(err) {
            socket.emit('newTopic', {
                id: topic._id,
                title: title
            });
        });
    });

    socket.on('disconnect', function(){
        console.log('user disconnected');
    });
});

app.use('/', router);
http.listen(3000, function() {
    console.log('Listening on port 3000');
});
