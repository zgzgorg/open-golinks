// routes/auth.js

const express = require('express');
const authRouter = express.Router();
const Auth0Strategy = require('passport-auth0'),
  passport = require('passport');
const ensureLoggedIn = require('connect-ensure-login').ensureLoggedIn();

// Perform the login, after login Auth0 will redirect to callback
authRouter.get('/login',

  passport.authenticate('auth0', {scope: 'openid email profile'}), function (req, res) {
    let params = {
      ec: `Login`,
      ea: `Initiated`,
      p: req.originalUrl,
      ev: 1,
    };
    req.visitor.event(params).send();
    res.redirect("/");
  });

// Perform the final stage of authentication and redirect to '/user'
authRouter.get('/callback',
  passport.authenticate('auth0', {
    failureRedirect: '/login'
  }),
  function (req, res) {
    if (!req.user) {
      let params = {
        ec: `Login`,
        ea: `Failure`,
        p: req.originalUrl,
        ev: 1,
      };
      req.visitor.event(params).send();
      throw new Error('user null');
    } else {
      res.redirect("/user");
      let params = {
        ec: `Login`,
        ea: `Success`,
        p: req.originalUrl,
        ev: 10,
      };
      req.visitor.event(params).send();
    }
  }
);

// Perform session logout and redirect to homepage
authRouter.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
  let params = {
    ec: `Logout`,
    ea: `Success`,
    p: req.originalUrl,
    ev: 10,
  };
  req.visitor.event(params).send();
});

export default authRouter;
