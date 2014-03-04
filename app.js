var dotenv      = require('dotenv');
dotenv.load();

var crypto      = require('crypto');
var redis       = require('redis');
var sanitize    = require('validator').sanitize;
var Validator   = require('validator').Validator;

var e           = module.exports;
e.ENV           = process.env.NODE_ENV || 'development';

// Constants
var DATABASE_URL            = process.env.DATABASE_URL; 
var FROM                    = process.env.FROM || "login@emailauth.io";
var SMTP_USERNAME           = process.env.SMTP_USERNAME || process.env.SENDGRID_USERNAME;
var SMTP_PASSWORD           = process.env.SMTP_PASSWORD || process.env.SENDGRID_PASSWORD;
var REDIS_URL               = process.env.REDIS_URL || process.env.REDISTOGO_URL || "redis://localhost:6379";
var TWITTER_CONSUMER_KEY    = process.env.TWITTER_CONSUMER_KEY;
var TWITTER_CONSUMER_SECRET = process.env.TWITTER_CONSUMER_SECRET;
var COOKIE_SECRET           = process.env.COOKIE_SECRET || "something";
var ROOT_URL                = process.env.ROOT_URL || "http://0.0.0.0:3000";
var STATIC_ROOT_URL         = process.env.STATIC_ROOT_URL || "http://paldot.github.com";

// Libraries
var redis_url   = require("url").parse(REDIS_URL);
var db          = redis.createClient(redis_url.port, redis_url.hostname);
if (redis_url.auth) {
  db.auth(redis_url.auth.split(":")[1]); 
}

var sendgrid    = require('sendgrid')(SMTP_USERNAME, SMTP_PASSWORD);

var port        = parseInt(process.env.PORT) || 3000;
var Hapi        = require('hapi');
server          = new Hapi.Server(+port, '0.0.0.0', { cors: true });

// Setup validation
Validator.prototype.error = function (msg) {
  this._errors.push(new Error(msg));
  return this;
}
Validator.prototype.errors = function () {
  return this._errors;
}

// Models
//// User
var User = module.exports.User = function(self){
  var self            = self || 0;
  this._validator     = new Validator();
  this.email          = sanitize(self.email).trim().toLowerCase() || "";
  this.twitterfriend  = sanitize(self.twitterfriend).trim().toLowerCase() || "";

  return this;
};

User.prototype.toJson = function(fn) {
  var _this   = this;

  return {
    email: _this.email,
    twitterfriend: _this.twitterfriend
  }
};

User.prototype.create = function(fn){
  var _this   = this;
  var key     = "apps/"+_this.email;

  this._validator.check(_this.email, "Invalid email.").isEmail();

  console.log(_this);

  var errors = this._validator.errors();
  delete(this._validator);

  if (errors.length) {
    fn(errors, null);
  } else {
    db.EXISTS(key, function(err, res) {
      if (err) { return fn(err, null); }

      if (res == 1) {
        var err = new Error("That email already exists.");
        fn(err, null);
      } else {
        db.SADD("users", _this.email); 
        db.HMSET(key, _this, function(err, res) {
          fn(err, _this);
        }); 
      }
    });
  }

  return this;
};

var users = {
  create: {
    handler: function (request, reply) {
      var payload       = request.payload;
      var email         = payload.email;
      var twitterfriend = payload.twitterfriend;
      var app = new User({
        email: email,
        twitterfriend: twitterfriend
      }); 

      app.create(function(err, res) {
        if (err) {
          var message = err.length ? err[0].message : err.message;
          reply({success: false, error: {message: message}});
        } else {
          reply({success: true, user: res.toJson()});
        }
      });
    }
  }
}

server.route({
  method  : 'POST',
  path    : '/api/v0/users/create.json',
  config  : users.create
});

server.start(function() {
  console.log('paldot-api server started at: ' + server.info.uri);
});
