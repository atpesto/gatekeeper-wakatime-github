var url     = require('url'),
    http    = require('http'),
    https   = require('https'),
    fs      = require('fs'),
    qs      = require('querystring'),
    express = require('express'),
    app     = express();

var TRUNCATE_THRESHOLD = 10,
    REVEALED_CHARS = 3,
    REPLACEMENT = '***';

var { config, wakatimeConfig, githubConfig } = require('./config');

function authenticateWakatime(code, cb) {
  var data = qs.stringify({
    client_id: wakatimeConfig.oauth_client_id,
    client_secret: wakatimeConfig.oauth_client_secret,
    grant_type: 'authorization_code',
    redirect_uri: 'http://localhost:3000/',
    code: code,
  });

  var reqOptions = {
    host: wakatimeConfig.oauth_host,
    port: config.oauth_port,
    path: wakatimeConfig.oauth_path,
    method: config.oauth_method,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'content-length': data.length
    }
  };

  var body = "";
  var req = https.request(reqOptions, function(res) {
    res.setEncoding('utf8');
    res.on('data', function (chunk) { body += chunk; });
    res.on('end', function() {
      console.log('body: ', body);
      cb(null, qs.parse(body));
    });
  });

  req.write(data);
  req.end();
  req.on('error', function(e) { cb(e.message); });
}

function authenticateGithub(code, cb) {
  var data = qs.stringify({
    client_id: githubConfig.oauth_client_id,
    client_secret: githubConfig.oauth_client_secret,
    redirect_uri: 'http://localhost:3000/',
    code: code,
  });

  var reqOptions = {
    host: githubConfig.oauth_host,
    port: config.oauth_port,
    path: githubConfig.oauth_path,
    method: config.oauth_method,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'content-length': data.length
    }
  };

  var body = "";
  var req = https.request(reqOptions, function(res) {
    res.setEncoding('utf8');
    res.on('data', function (chunk) { body += chunk; });
    res.on('end', function() {
      console.log('body: ', body);
      cb(null, qs.parse(body));
    });
  });

  req.write(data);
  req.end();
  req.on('error', function(e) { cb(e.message); });
}

/**
 * Handles logging to the console.
 * Logged values can be sanitized before they are logged
 *
 * @param {string} label - label for the log message
 * @param {Object||string} value - the actual log message, can be a string or a plain object
 * @param {boolean} sanitized - should the value be sanitized before logging?
 */
function log(label, value, sanitized) {
  value = value || '';
  if (sanitized){
    if (typeof(value) === 'string' && value.length > TRUNCATE_THRESHOLD){
      console.log(label, value.substring(REVEALED_CHARS, 0) + REPLACEMENT);
    } else {
      console.log(label, REPLACEMENT);
    }
  } else {
    console.log(label, value);
  }
}


// Convenience for allowing CORS on routes - GET only
app.all('*', function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});


app.get('/wakatime/authenticate/:code', function(req, res) {
  log('authenticating code:', req.params.code, true);
  authenticateWakatime(req.params.code, function(err, token) {
    var result
    if ( err ) {
      result = {"error": err};
      log(result.error);
    } else {
      result = {"token": token};
      log("token", result.token, true);
    }
    res.json(result);
  });
});

app.get('/github/authenticate/:code', function(req, res) {
  log('authenticating code:', req.params.code, true);
  authenticateGithub(req.params.code, function(err, token) {
    var result
    if ( err ) {
      result = {"error": err};
      log(result.error);
    } else {
      result = {"token": token};
      log("token", result.token, true);
    }
    res.json(result);
  });
});

module.exports.config = config;
module.exports.app = app;
