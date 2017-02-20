const Alexa = require('alexa-sdk');

const handlers = {
  'CanMyDogEatIntent': function() {
    this.emit(':tell', 'Hello world!');
  }
};

exports.handler = function(event, context, callback) {
  const alexa = Alexa.handler(event, context);
  alexa.registerHandlers(handlers);
  alexa.execute();
};

