(function() {

var iframes = [];

function embed(key) {

  // Server Messaging
  // ----------------

  // See `embed/server.js`.

  // Client Messaging
  // ----------------

  // FIXME: `iframe` parameter likely unnecessary.
  function setupClientMessaging(iframe) {

    var a = document.createElement('a');

    if (!(iframe instanceof document.createElement('iframe').constructor))
      return console.log('Expected #<HTMLIFrameElement>.');

    a.href = iframe.src;

    // Client's Dispatch Table
    // -----------------------

    function handleResponse(e) {
      var strs, action, params;
      if (e.origin === a.protocol + '//' + a.host) {
        strs   = e.data.split(':'),
        action = strs[0],
        params = strs[1];
        switch (action) {
          case 'size':
            return handleSizeResponse.apply(null, params.split(','));
          default:
            console.log('Could not handle response, "' + action + '".');
        }
      } else
        console.log('Ignoring response from ' + e.origin);
    }

    // Response Handlers
    // -----------------

    function handleSizeResponse(id, width, height) {
      iframes[parseInt(id)-1].setAttribute('width', '100%'); // width + 'px');
      iframes[parseInt(id)-1].setAttribute('height', height + 'px');
    }

    window.addEventListener('message', handleResponse, false);

  }

  // Configuration
  // -------------

  // TODO: Make this more configurable.
  function getTwiMLURL(key) {
    return 'http://127.0.0.1:3000/TwiML/' + key + '?embed=true';
  }

  // TODO: Make this more configurable.
  function srcDoesNotMatchKey(src, key) {
    var match =
      src.match(/http:\/\/127\.0\.0\.1:3000\/embed\/load\.js\?key=(.*)/)
    return !match || match[1] !== key;
  }

  // IFrame Loader
  // -------------

  // Attempt to transform a <script> tag into an <iframe>. Returns `true` on
  // success, otherwise `false`.
  function processScriptTagOnClient(key, script) {
    var iframe;
    // Guard against <script> tags that do not match our key.
    if (srcDoesNotMatchKey(script.src, key))
      return false;
    // Create <iframe>.
    iframe = document.createElement('iframe');
    iframes.push(iframe);
    iframe.setAttribute('src', getTwiMLURL(key));
    iframe.setAttribute('width', '100%');
    iframe.setAttribute('scrolling', 'no');
    iframe.style.border = '1px solid #ccc';
    iframe.setAttribute('onload',
      "this.contentWindow.postMessage('assign:" + iframes.length + "', this.src)");
    // TODO: Delay setting up messaging?
    setupClientMessaging(iframe);
    // Replace <script> with <iframe>.
    script.parentNode.replaceChild(iframe, script);
    // Terminate for-loop below.
    return true;
  }

  // Transform at most one <script> tag into an <iframe>.
  function setupServerOnClient(key) {
    var i, scripts =
      Array.prototype.slice.apply(document.getElementsByTagName('script'));
    for (i=0; i<scripts.length; i++)
      if (processScriptTagOnClient(key, scripts[i]))
        return;
  }

  setupServerOnClient(key);

}

window.QuickTwiML = { embed: embed };

})();
