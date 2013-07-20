module.exports = function (app, TwiML) {

var twilio = require('twilio'),
    validate = require('../validate/TwiML.js');

// Try to create or update TwiML (returning its key).
function update(req, res, found) {
  var twiml = found || new TwiML;
  twiml.title = req.body.title;
  twiml.content = req.body.content;
  twiml.save(function(err) {
    return err ? res.send(500)
               : res.redirect(302, '/TwiML/' + twiml.key);
  });
}

app.post('/TwiML/:key?', function(req, res) {
  // Send 400 if client attempts to POST invalid TwiML.
  if (!validate(req.body.content)) {
    res.send(400);
    return res.end();
  }
  // Try to create or update TwiML (returning its key).
  if (key = req.params.key || req.body.key)
    TwiML.findOne({ where: { key: key } }, function(err, twiml) {
      if (!err)
        return update(req, res, twiml);
      res.send(500);
      res.end();
    });
  // Try to create TwiML (returning its key).
  else
    update(req, res);
});

app.get('/TwiML/:key?', function(req, res) {
  if (key = req.params.key)
    return TwiML.findOne({ where: { key: key } }, function(err, twiml) {
      // Server error.
      if (err)
        res.send(500);
      // TwiML not found.
      else if (!twiml)
        res.send(404);
      // Serve TwiML for Twilio.
      else if
          (twilio.validateExpressRequest(req, process.env.TWILIO_AUTH_TOKEN)) {
        res.set('Content-Type', 'application/xml');
        res.send(200, twiml.content);
      // Serve TwiML for user.
      } else {
        res.set('Content-Type', 'text/html');
        return res.render('TwiML', { twiml: twiml });
      }
      res.end();
    });
  // Serve TwiML index for user.
  res.render('TwiML', { twiml: {} });
});

};
