'use strict';

const Alexa = require('alexa-sdk');
const unmarshalJson = require('dynamodb-marshaler').unmarshalJson;
const nlp = require('nlp_compromise');

const AWS = require('aws-sdk');
AWS.config.update({
  accessKeyId: process.env.AWS_LAMBDA_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_LAMBDA_SECRET_ACCESS_KEY,
  region: 'us-west-2'
});
const db  = new AWS.DynamoDB();

const canMyDogEatIntent = function() {
  const food = nlp.text(this.event.request.intent.slots.Food.value).root();

  let params = {TableName: 'foods_for_dogs', Key: { food: {S: food}}};
  db.getItem(params, (err, data) => {
    if (err) this.emit(':tell', 'There was a problem. I am only a dog.');
    if (data.Item) {
      let item = JSON.parse(unmarshalJson(data.Item));
      let answer = 'No!';
      if (item.answer) {
        answer = 'Yes!';
      }
      let messages = `${answer} ${item.body}`;
      this.emit(':tell', messages);
    } else {
      this.emit(':tell', 'I do not know yet.');
    }
  });
};

const launchRequest = function () {
  this.emit(':tell',
    'Hello, ask Dr. Mozzy if it is ok for your dog to eat an item by ' +
    'saying: Dr Mozzy, can my dog bananas?');
};

const handlers = {
  'CanMyDogEatIntent': canMyDogEatIntent,
  'LaunchRequest': launchRequest,
  'SessionEndedRequest': function() {}
};

exports.handler = function(event, context, callback) {
  const alexa = Alexa.handler(event, context);
  alexa.registerHandlers(handlers);
  alexa.execute();
};

