/*-----------------------------------------------------------------------------
This template demonstrates how to use Waterfalls to collect input from a user using a sequence of steps.
For a complete walkthrough of creating this type of bot see the article at
https://docs.botframework.com/en-us/node/builder/chat/dialogs/#waterfall
-----------------------------------------------------------------------------*/
"use strict";
var builder = require("botbuilder");
var botbuilder_azure = require("botbuilder-azure");
var path = require('path');
var popup = require('window-popup').windowPopup;
var useEmulator = (process.env.NODE_ENV == 'development');

var connector = useEmulator ? new builder.ChatConnector() : new botbuilder_azure.BotServiceConnector({
    appId: process.env['MicrosoftAppId'],
    appPassword: process.env['MicrosoftAppPassword'],
    stateEndpoint: process.env['BotStateEndpoint'],
    openIdMetadata: process.env['BotOpenIdMetadata']
});

// Make sure you add code to validate these fields
var luisAppId = process.env['LuisAppId'];
var luisAPIKey = process.env['LuisAPIKey'];
var luisAPIHostName = 'westus.api.cognitive.microsoft.com';

const LuisModelUrl = 'https://' + luisAPIHostName + '/luis/v2.0/apps/' + luisAppId + '?subscription-key=' + luisAPIKey;

var bot = new builder.UniversalBot(connector);

//Dialog with Luis
var recognizer = new builder.LuisRecognizer(LuisModelUrl);
var intents = new builder.IntentDialog({ recognizers: [recognizer] })
// Sample LUIS intent
.matches('greeting', function (session, args, next) {
        if (!session.userData.name) {
            session.beginDialog('/askName');
        } else {
            session.send("Welcome back " + session.userData.name + "!");
			session.reset();
        }
    }
)
.matches('request help', function (session) {
	
	if (!session.userData.phonenumber) {
		session.send("OK. I understand you need help. An agent will call you at your phone number: " + session.userData.phonenumber); 
	} else {
		session.Prompts.text('OK. I understand you need help. We\'d like to call you to help; however, we do not have your phone number on file. Please call us at 1-800-rlb-insrc'); 
	}
	
	session.endDialog();
	
})
.matches('get coverage', function (session) {
	session.send('Here is your coverage info. TODO');
	session.reset();
})
.matches('report accident', [
	function (session) {
		session.Prompts.text(session, "OK, I understand you have been in an accident.");
		session.beginDialog('/file a claim');
	}
])
.matches('file a claim', function (session) {
	session.beginDialog('/file a claim');
})
.matches('Utilities.StartOver', function (session) {
	session.reset();
})
.onDefault(function (session) {
	session.send("Sorry, I am not sure what meant. We need to start over.");
	session.reset();
});

bot.dialog('/', intents);  

bot.dialog('/file a claim', [
    function (session, args) {
        
        var message = new builder.Message(session);
        
        message.attachmentLayout(builder.AttachmentLayout.carousel);
        
        message.attachments([
            new builder.HeroCard(session)
                .title("Reliable & Accountable Insurance")
                .text("Start a new claim process")
                .images([builder.CardImage.create(session, 'https://dl.dropboxusercontent.com/s/lji8s8g67x8jjpq/PricewaterhouseCoopers_Logo.png?dl=0')])
                .buttons([
                     builder.CardAction.openUrl(session, 'https://nmottagh.wixsite.com/reliableinsurance/claims', 'File a new claim')
                ])
            ]); 
		
        session.send(message);
		session.endDialog();
    }
]);

bot.dialog('/askName', [
    function (session) {
        builder.Prompts.text(session, "Hello! What is your name?");
    },
    function (session, results, next) {
        session.userData.name = results.response;
		next();
	},
	function (session){
		session.Prompts.text(session, "What is your phone number, " + session.userData.name + "?");
    }, 
	function (session, results) {
		session.userData.phonenumber = results.response;
		session.endDialog();
	}
]);

bot.dialog('/file a claim'), [
	function (session) {
		session.send("File a claim placeholder");
		session.endDialog();
	}
];

if (useEmulator) {
    var restify = require('restify');
    var server = restify.createServer();
    server.listen(3978, function() {
        console.log('test bot endpont at http://localhost:3978/api/messages');
    });
    server.post('/api/messages', connector.listen());    
} else {
	
	/*var listener = connector.listen();
    var withLogging = function(context, req) {
        console.log = context.log;
        listener(context, req);
    }*/
    module.exports = { default: connector.listen() }
}
