var express = require('express')
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var bodyParser = require('body-parser');
var path = require('path')
var multer  = require('multer')
var querystring = require('querystring')
var request = require('request')

var storage = multer.diskStorage({
  destination: function (request, file, callback) {
    callback(null, 'public/tmp/');
  },
  filename: function (request, file, callback) {
    callback(null, file.originalname)
  }
});
var upload = multer({storage: storage});
/*var fs = require('fs-extra'),
    formidable = require('formidable'),
    util = require('util'),
    qt   = require('quickthumb');
*/

var tempID;
var tempEntry;
var userDict = []
var questions = [];
var voteIDnum = 0;
var newPath, file_name, name, username

var questionBank = [
  'How many marbles would it take to fill the ocean? Estimate to a power of ten.',
  'What were the key turning points in the American Civil War?',
  'Which African countries below the Saharan Desert were the most resistant to colonialism?',
  'Describe the process of photosynthesis.',
  'Describe the phenomenon by which paper airplanes are able to fly.'
]

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/public/welcome.html');
});

app.post('/psroom', upload.single('photo'), function(req, res, next) {
  name = req.body.realname;
  username = req.body.username;
  photo = req.file;
  newPath = photo.path;
  console.log(req.file, 'file');
  tempEntry = {
    'name': name,
    'id': username,
    'picture': newPath.substring(6),
    'upvotes': 0
  }
  tempID = username
  res.sendFile(__dirname + '/public/psroom.html');
});

//socket stuff

io.on('connection', function(socket){
  socket.userID = tempID;
  socket.pName = tempEntry.name;
  socket.picture = newPath.substring(6);
  userDict.push(tempEntry);
  console.log(socket.userID);
  console.log(userDict);
  io.emit('newUser', userDict, tempID, socket.picture);
  socket.on('chat', function(msg){
    io.emit('chat-received',msg,socket.userID);
  });
  socket.on('solve', function(msg){
    questions.push({
      'question': msg,
      'questionID': socket.userID+voteIDnum,
      'votes': 0
    })
    io.emit('solution-received',msg,socket.userID+voteIDnum,socket.pName);
    voteIDnum++;
  });
  socket.on('new-question', function(){
    question = questionBank[Math.floor(Math.random()*questionBank.length)];
    var asyncCall = new Promise(function(resolve, reject, str){
  request({
    url: 'https://westus.api.cognitive.microsoft.com/text/analytics/v2.0/keyPhrases', //URL to hit
    body: JSON.stringify({
     "documents": [
         {
             "language": "en",
             "id": "1",
             "text": question
         }]
}), //Query string data
    method: 'POST', //Specify the method
    headers: {
                "Content-Type":"application/json",
                "Ocp-Apim-Subscription-Key":"459870a2c95c46c88895ed2537388cb6",
                "Accept":"application/json"
          }
}, function(error, response, body){
    if(error) {
        console.log(error);
        return null
    } else {
        BODY = JSON.parse(body)
        resolve(BODY.documents[0].keyPhrases)
    }
});
})
    asyncCall.then(function(data){
      phrases = data
      console.log('phrases',phrases);
      io.emit('new-question',question,phrases)
    });
    
   
    

  })
  socket.on('question-submit', function(question){
    questionBank.push(question);
  })
  socket.on('vote-cast', function(ident){
    solution = findByIdent(questions,ident);
    console.log(solution)
    solution.votes++;
    console.log(solution.votes)
    io.emit('vote-count-change',solution.questionID, solution.votes)
  })
  socket.on('disconnect', function(){
    console.log('user disconnected');
  });
});


http.listen(3000, function(){
  console.log('listening on *:3000');
});

function findByIdent(arr,str){
  for(x in arr){
    if(arr[x].questionID == str)
      return arr[x]
  }
  return null
}

function textAnalyze(str) {
//Lets configure and request


}

var asyncCall = new Promise(function(resolve, reject, str){
  request({
    url: 'https://westus.api.cognitive.microsoft.com/text/analytics/v2.0/keyPhrases', //URL to hit
    body: JSON.stringify({
     "documents": [
         {
             "language": "en",
             "id": "1",
             "text": str
         }]
}), //Query string data
    method: 'POST', //Specify the method
    headers: {
                "Content-Type":"application/json",
                "Ocp-Apim-Subscription-Key":"459870a2c95c46c88895ed2537388cb6",
                "Accept":"application/json"
          }
}, function(error, response, body){
    if(error) {
        console.log(error);
        return null
    } else {
        console.log('pure outupt', response.statusCode, body);
        BODY = JSON.parse(body)
        console.log('typeofBODY',typeof(BODY))
        console.log(BODY.documents)
        console.log(BODY)
        resolve(BODY.documents)
    }
});
})
