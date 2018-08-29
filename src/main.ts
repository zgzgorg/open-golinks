import * as express from "express";
import * as ua from "universal-analytics";
import * as bodyParser from "body-parser";
const indexRouter = require('./routes/index');
const authRouter = require("./routes/auth");
const cookieParser = require('cookie-parser');

let app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'pug');
app.use(require('express-status-monitor')());
console.assert(process.env.OPEN_GOLINKS_GA_ID, `$OPEN_GOLINKS_GA_ID is not set`);
console.assert(process.env.CLEARDB_DATABASE_URL, `$CLEARDB_DATABASE_URL is not set`);
console.assert(process.env.AUTH0_DOMAIN, `$AUTH0_DOMAIN is not set`);
console.assert(process.env.AUTH0_CLIENT_ID, `$AUTH0_CLIENT_ID is not set`);
console.assert(process.env.AUTH0_CLIENT_SECRET, `AUTH0_CLIENT_SECRET is not set`);

console.log(`Setting Google Analytics with Tracking Id = `, process.env.OPEN_GOLINKS_GA_ID);
app.use(ua.middleware(process.env.OPEN_GOLINKS_GA_ID, {cookieName: '_ga'}));

var Auth0Strategy = require('passport-auth0'),
    passport = require('passport');

//passport-auth0
var strategy = new Auth0Strategy({
      domain: process.env.AUTH0_DOMAIN,
      clientID: process.env.AUTH0_CLIENT_ID,
      clientSecret: process.env.AUTH0_CLIENT_SECRET, // Replace this with the client secret for your app
      callbackURL: 'http://localhost:3000/callback'
    },
    function(accessToken, refreshToken, extraParams, profile, done) {
      // accessToken is the token to call Auth0 API (not needed in the most cases)
      // extraParams.id_token has the JSON Web Token
      // profile has all the information from the user
      return done(null, profile);
    }
);

passport.use(strategy);

// app.js

import * as session from 'express-session';

//session-related stuff
var sess = {
  secret: 'some cool secret', // TODO use another one
  cookie: {},
  resave: true,
  saveUninitialized: true
};

// if (app.get('env') === 'production') {
//   sess.cookie['secure'] = true; // serve secure cookies, requires https
// }

// app.js


app.use(cookieParser());

app.use(session(sess));
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

// Look up session to know if user is logged in
app.use(function(req, res, next) {
  console.log(`Query if it's logged in`, req.session);
  res.locals.loggedIn = false;
  if (req.session.passport && typeof req.session.passport.user != 'undefined') {
    res.locals.loggedIn = true;
  }
  console.log(`Result:`, res.locals.loggedIn);
  next();
});
app.use('/', authRouter);
app.use('/', indexRouter);

let PORT = process.env.PORT || 3000;
console.log('Start listening on ', PORT);
app.listen(PORT);
