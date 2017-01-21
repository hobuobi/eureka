var express = require('express')
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var bodyParser = require('body-parser');
var path = require('path')


var tempID;
var tempEntry;
var userDict = []
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/public/welcome.html');
});

app.post('/psroom', function(req, res) {
  name = req.body.realname;
  username = req.body.username;
  tempEntry = {
    'name': name,
    'id': username,
    'upvotes': 0
  }
  tempID = username
  res.sendFile(__dirname + '/public/psroom.html');
});

//socket stuff

io.on('connection', function(socket){
  socket.userID = tempID;
  userDict.push(tempEntry);
  console.log(socket.userID);
  io.emit('newUser', socket.userID);
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
});


http.listen(3000, function(){
  console.log('listening on *:3000');
});
