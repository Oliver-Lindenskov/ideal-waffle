var clock = require('express')();
var http = require('http').Server(clock);
var io = require('socket.io')(http),
    users = {};


clock.get('/', function(req, res){
    res.sendfile('index.html');
});

io.on('connection', function(socket){
    socket.on('new user' , function(user , callback) {
        if ( user in users) {
            callback(false);
        } else {
            callback(true);
            socket.username = user;
            users[socket.username] = socket;
            io.emit('users' , Object.keys(users));
        }
    });

    socket.on('texting' , function(){
        if (socket.username) {
            socket.broadcast.emit('texting' , socket.username + ' is typing');
        }
    });

    socket.on('chat message' , function(msg , callback){
        var msg = msg.trim();
        if (msg.substring(0,3) !== '/w ') {
            io.emit('chat message' , {
                user : socket.username,
                message : msg
            });
        } else {
            msg = msg.substring(3);
            var ind = msg.indexOf(' ');
            if (ind !== -1) {
                var name = msg.substring(0,ind);
                msg = msg.substring(ind+1);
                if (name in users) {
                    users[name].emit('whisper' , {
                        user : socket.username,
                        message : msg
                    });
                } else {
                    callback('Error! Please Input an online user');
                }
            } else {
                callback('Error! Please input an online user');
            }
        }
    });


    socket.on('disconnect' , function(){
        if (!socket.username) return;
        delete users[socket.username];
        io.emit('users' , Object.keys(users));
    });
});
//http.listen(3000, function(){
//    console.log('listening on *:3000');
//});

http.listen(process.env.PORT || 3000, function(){
  console.log("Express server listening on port %d in %s mode", this.address().port, http.settings.env);
});
