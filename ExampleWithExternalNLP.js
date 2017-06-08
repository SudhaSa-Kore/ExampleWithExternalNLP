var botId = "st-******************"; //botID
var botName = "**********";  //botname
var sdk         = require("./lib/sdk");
var config      = require("./config");
var request = require('request-promise');
var Promise        = sdk.Promise;


 //api.ai funtion call for intent recognisation
function getIntentFromApiai(message){
   return new Promise(function(resolve, reject) {
        request({
            url: 'https://api.api.ai/api/query?v=20150910&query='+message+'&lang=en&sessionId=72119261-b1c2-4996-84dd-d874d7754adc',
            method: 'GET',
            headers: {
        'Authorization': 'Bearer ****************'
            }
        }, function(error, res) {
            if (error || !res.body) {
                reject({error:error});
            }else{
       resolve(JSON.parse(res.body));
     }
        });
    });
}


//luis.ai function for entity recognisation
function getEntitiesFromluis(message){
   return new Promise(function(resolve, reject) {
        request({
            url: 'https://westus.api.cognitive.microsoft.com/luis/v2.0/apps/12730170-ef21-4047-9900-03de0bfdf14a?subscription-key=c063935b88e84bad98e40d6fee3f03bd&verbose=true&timezoneOffset=0&q='+message,
            method: 'GET',
            headers: {
        'Authorization': 'Bearer *******************'
            }
        }, function(error, res) {
            if (error || !res.body) {
                reject({error:error});
            }else{
       resolve(JSON.parse(res.body));
     }
        });
    });
}

//sending welcome message for the first time to the user
function sendWelcomeMessage(data){
   data.message = "Welcome to verizon Bot";
}

 
 module.exports = {
    botId   : botId,
    botName : botName,

    on_user_message : function(requestId, data, callback) {
      var message = (data.message).trim();
      var re = new RegExp(".*cab.*"); //handle specific messages for example cab related info
        if(data.context.session.BotUserSession && !data.context.session.BotUserSession.isFirstMessage){ //Welcome message for the user for the first time
          data.context.session.BotUserSession.isFirstMessage = true;
          sendWelcomeMessage(data);
          sdk.sendUserMessage(data,callback);
      }
    getIntentFromApiai(message).then(function(intentResponse){   
      if(intentResponse.result.score > 0){      //if intent recognized from api.ai
      var intent = intentResponse.result.action;
      data.message = 'Intent identified from api.ai is '+ intent;
      sdk.sendUserMessage(data,callback);
          getEntitiesFromluis(message).then(function(entitiesResponse){
            if(entitiesResponse.entities.length > 0){      //if entities recognised from luis or not
              var entities = entitiesResponse.entities;
              data.message = 'Entities identified from luis.ai is '+ entities[0].entity;
               sdk.sendUserMessage(data,callback);
               data.message = 'Search hotels';
              data.context.session.BotUserSession.entitiesRecognized = true;
              return sdk.sendBotMessage(data,callback);
            }else{          //only intent recognised from api.ai and entity not recognised from luis.ai
              data.message = 'Search hotels';
              data.context.session.BotUserSession.entitiesRecognized = false;
              return sdk.sendBotMessage(data,callback);
            }
          });
      }else if(re.test(message)){
          data.message = 'You can book a cab once you reach the hotel';
          return sdk.sendUserMessage(data,callback);
      }
      else{
        return sdk.sendBotMessage(data, callback);
      }
    });
},
    on_bot_message  : function(requestId, data, callback) {  
        return sdk.sendUserMessage(data, callback);
    },
   on_webhook      : function(requestId, data, componentName, callback) {
        if (componentName === 'sendResponse') {
          var hotels = {
            "hotels":[
                  "Taj Banjara",
                  "Novotel"
            ]
          };
          data.context.hotelResults = hotels;
          callback(null,data);
        }
      }
        
};