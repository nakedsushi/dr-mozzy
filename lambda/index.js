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

const reprompt = 'I don’t know that. Ask me: Doctor Mozzy, can my dog eat apples?';

const canMyDogEatIntent = function() {
  if (!this.event.request.intent.slots.Food.value) {
    this.emit('helpIntent');
  }
  const ogFood = this.event.request.intent.slots.Food.value;
  const food = nlp.text(ogFood).root();

  let params = {TableName: 'foods_for_dogs', Key: { food: {S: food}}};
  db.getItem(params, (err, data) => {
    if (err) this.emit(':ask', 'Sorry, I am only a dog.', reprompt);
    if (data && data.Item) {
      let item = JSON.parse(unmarshalJson(data.Item));
      let answer = 'No!';
      if (item.answer) {
        answer = 'Yes!';
      }
      let messages = `${answer} ${item.body}`;
      this.emit(':tell', messages);
    } else {
      this.emit(':ask', `I do not know about ${ogFood} yet. Can you ask about another food?`, reprompt);
    }
  });
};

const introIntent = function() {
  this.emit(':ask',
  'Hi, I’m Doctor Mozzy. You can ask me if it is ok for your dog to eat an item by ' +
    'saying: Doctor Mozzy, can my dog eat bananas?',
  reprompt);
};

const helpIntent = function() {
  this.emit(
    ':ask',
    'I am a fake doctor who can tell you if it’s okay for your dog to eat something. Ask me: can my dog eat bananas?',
    reprompt
  );
};

const stopIntent = function() {
  this.emit(
    ':tell',
    'Goodbye!'
  );
};

const cancelIntent = function() {
  this.emit(
    ':ask',
    'Did you want to ask something else? If not, you can tell me stop.',
    reprompt
  );
};

const launchRequest = function () {
  this.emit('IntroIntent');
};

const handlers = {
  'CanMyDogEatIntent': canMyDogEatIntent,
  'LaunchRequest': function() {
    this.emit('IntroIntent');
  },
  'IntroIntent': introIntent,
  'AMAZON.HelpIntent': helpIntent,
  'AMAZON.StopIntent': stopIntent,
  'AMAZON.CancelIntent': cancelIntent
};

exports.handler = function(event, context, callback) {
  const alexa = Alexa.handler(event, context);
  alexa.registerHandlers(handlers);
  alexa.execute();
};

