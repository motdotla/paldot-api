var dotenv      = require('dotenv');
dotenv.load();

var crypto      = require('crypto');
var redis       = require('redis');
var sanitize    = require('validator').sanitize;
var Validator   = require('validator').Validator;
var passport    = require('passport')
var TwitterStrategy = require('passport-twitter').Strategy;

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
var plugins = {
  yar: {
    cookieOptions: {
      password: COOKIE_SECRET, // cookie secret
      isSecure: false // required for non-https applications
    }
  },
  travelogue: {}
};

var Hapi        = require('hapi');
server          = new Hapi.Server(+port, '0.0.0.0', { cors: true });
server.pack.require(plugins, function (err) { 
  if (err) {
    throw err;
  }
});

server.auth.strategy('passport', 'passport');

var Passport = server.plugins.travelogue.passport;
Passport.use(new TwitterStrategy({
    consumerKey: TWITTER_CONSUMER_KEY,
    consumerSecret: TWITTER_CONSUMER_SECRET,
    callbackURL: ROOT_URL + "/api/v0/twitter/auth/callback"
  },
  function(accessToken, refreshToken, profile, done) {
    console.log("hello");
    console.log(accessToken);
    console.log(refreshToken);
    return done(null, profile);
  }
));
Passport.serializeUser( function(user, done) {
    done( null, user );
});
Passport.deserializeUser( function(obj, done) {
    done( null, obj );
});

//// Routes
var twitter = {
  auth: {
    handler: function (request, reply) {
      Passport.authenticate('twitter')(request, reply);
    }
  },
  auth_callback: {
    handler: function (request, reply) {
      console.log(request.payload);
      
      Passport.authenticate('twitter', {
        failureRedirect: '/api/v0/twitter/auth',
        successRedirect: '/api/v0/twitter/auth/success'
      })(request, reply, function () {
        reply().redirect('/');
      });
    }
  },
  auth_success: {
    handler: function (request, reply) {
      // on a success redirect to the choose page
      var url = STATIC_ROOT_URL + "/choose.html";
      reply().redirect(url);
    }
  }
};

server.route({
  method  : 'GET',
  path    : '/api/v0/twitter/auth',
  config  : twitter.auth
});
server.route({
  method  : 'GET',
  path    : '/api/v0/twitter/auth/callback',
  config  : twitter.auth_callback
});
server.route({
  method  : 'GET',
  path    : '/api/v0/twitter/auth/success',
  config  : twitter.auth_success
});

server.start(function() {
  console.log('paldot-api server started at: ' + server.info.uri);
});
