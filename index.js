//
// This is main file containing code implementing the Express server and functionality for the Express echo bot.
//
'use strict';
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const path = require('path');
var messengerButton = "<html><head><title>Facebook Messenger Bot</title></head><body><h1>Facebook Messenger Bot</h1>This is a bot based on Messenger Platform QuickStart. For more details, see their <a href=\"https://developers.facebook.com/docs/messenger-platform/guides/quick-start\">docs</a>.<footer id=\"gWidget\"></footer><script src=\"https://widget.gomix.me/widget.min.js\"></script></body></html>";
var link1 = "translate.yandex.net/api/v1.5/tr/translate?key=trnsl.1.1.20170312T182402Z.bdb6b677d43fcdc5.a76f1ca4719f8f58aa8227869f4623a6e115a326&text=";
var link2 = "&lang=en-fr&[format=plain]";
// The rest of the code implements the routes for our Express server.
let app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

// Webhook validation
app.get('/webhook', function(req, res) {
  if (req.query['hub.mode'] === 'subscribe' &&
      req.query['hub.verify_token'] === 'customToken') {
    console.log("Validating webhook");
    res.status(200).send(req.query['hub.challenge']);
  } else {
    console.error("Failed validation. Make sure the validation tokens match.");
    res.sendStatus(403);          
  }
});

// Display the web page
app.get('/', function(req, res) {
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.write(messengerButton);
  res.end();
});

// Message processing
app.post('/webhook', function (req, res) {
  console.log(req.body);
  var data = req.body;

  // Make sure this is a page subscription
  if (data.object === 'page') {
    
    // Iterate over each entry - there may be multiple if batched
    data.entry.forEach(function(entry) {
      var pageID = entry.id;
      var timeOfEvent = entry.time;

      // Iterate over each messaging event
      entry.messaging.forEach(function(event) {
        if (event.message) {
          receivedMessage(event);
        } else if (event.postback) {
          receivedPostback(event);   
        } else {
          console.log("Webhook received unknown event: ", event);
        }
      });
    });

    // Assume all went well.
    //
    // You must send back a 200, within 20 seconds, to let us know
    // you've successfully received the callback. Otherwise, the request
    // will time out and we will keep trying to resend.
    res.sendStatus(200);
  }
})
;
//hard code in case we screw up :)
var LOCALE = {
  "Hello": "Bonjour",
  "hello": "bonjour",
  "My name is Leo" : "Je m'appelle Leo",
  "Goodbye" : "Au revoir",
  "I like coding" : "J'aime coder",
  "Hackathons are fun" : "Hackathons sont amusants",
  
  
};

function createCORSRequest( url) {
	var xhr = new XMLHttpRequest();
	if ("withCredentials" in xhr) {
	// XHR for Chrome/Firefox/Opera/Safari.
		xhr.open('GET', url, true);
	} else if (typeof XDomainRequest != "undefined") {
	// XDomainRequest for IE.
		xhr = new XDomainRequest();
		xhr.open(method, url);
	} else {
	// CORS not supported.
		xhr = null;
	}
	return xhr;
}

// Make the actual CORS request.
function makeCorsRequest(linker) {
	// This is a sample server that supports CORS.
	var url = '';
	var xhr = createCORSRequest('GET', url);
	if (!xhr) {
		return 'CORS not supported';
	}
	// Response handlers.
	xhr.onload = function() {
		return xhr.responseText;
	};
	xhr.onerror = function() {
		return 'Request Error'
	};
	xhr.send();
}
function translate(string) {
  var comLink = "https://" + link1 + string + link2;
  
	
  return linker(comLink);
}
// Incoming events handling
function receivedMessage(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfMessage = event.timestamp;
  var message = event.message;

  console.log("Received message for user %d and page %d at %d with message:", 
    senderID, recipientID, timeOfMessage);
  console.log(JSON.stringify(message));

  var messageId = message.mid;

  var messageText = message.text;
  var messageAttachments = message.attachments;

  if (messageText) {
    // If we receive a text message, check to see if it matches a keyword
    // and send back the template example. Otherwise, just echo the text we received.
    switch (messageText) {
	case 'hello':
		sendTextMessage(senderID, "bonjour");
		break;
	case 'goodbye':
		sendTextMessage(senderID, "au revoir");
		break;
      default:
        sendTextMessage(senderID, translate(messageText));
		break;
    }
  } else if (messageAttachments) {
    sendTextMessage(senderID, "Message with attachment received");
  }
}

function receivedPostback(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;
  var timeOfPostback = event.timestamp;

  // The 'payload' param is a developer-defined field which is set in a postback 
  // button for Structured Messages. 
  var payload = event.postback.payload;

  console.log("Received postback for user %d and page %d with payload '%s' " + 
    "at %d", senderID, recipientID, payload, timeOfPostback);

  // When a postback is called, we'll send a message back to the sender to 
  // let them know it was successful
  sendTextMessage(senderID, "Postback called");
}

//////////////////////////
// Sending helpers
//////////////////////////
function sendTextMessage(recipientId, messageText) {
  var messageData = {
    recipient: {
      id: recipientId
    },
    message: {
      text: messageText
    }
  };

  callSendAPI(messageData);
}

function callSendAPI(messageData) {
  request({
    uri: 'https://graph.facebook.com/v2.6/me/messages',
    qs: { access_token: 'EAALBSAcx7ekBACvM1UTmOtn98Gu5VVhY6IKkdYQEIvrThwyjJOI8VBDMVv9P1RaU9snp48KCgNzC61CdwUyM1jtOgTZBlZAWCDCnERVEyydJfrHUrXgt46X88XbDkRslG7MhiBcdm4QXClYwpX9iJy7ZCzbZByqd2MWCb2dxWwZDZD' },
    method: 'POST',
    json: messageData

  }, function (error, response, body) {
    if (!error && response.statusCode == 200) {
      var recipientId = body.recipient_id;
      var messageId = body.message_id;

      console.log("Successfully sent generic message with id %s to recipient %s", 
        messageId, recipientId);
    } else {
      console.error("Unable to send message.");
      console.error(response);
      console.error(error);
    }
  });  
}

// Set Express to listen out for HTTP requests
var server = app.listen(process.env.PORT || 3000, function () {
  console.log("Listening on port %s", server.address().port);
});