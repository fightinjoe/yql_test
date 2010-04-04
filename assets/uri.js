/*
 *  Library for parsing URIs.
 *  Usage:
 *      var uri = new URI(); // URI class instantiated with the document's location
 *
 *      var uri = new URI('http://yahoo.com'); // creates a new URI from the string
 *      uri.query = { f:'foo', b:'bar' };
 *      uri.to_s(); // return http://yahoo.com?f=foo&b=bar
*/
var URI = function( url ) {
  var self = this;
  this.url = url || (document && document.location.href);
  this.scheme = null;
  this.domain = null;
  this.path   = null;
  this.query  = null;
  this.anchor = null;

  function init() {
    regexp = /^(.*):\/\/([^\/]+)([^?#]*)(?:\?(.*?))?(?:#(.*))?$/;
    match = self.url.match( regexp );
    self.scheme = match[1];
    self.domain = match[2];
    self.path   = match[3];
    self.query  = match[4] || '';
    self.anchor = match[5] || '';
  }

  // Returns the query parameters as a hash of unescaped values
  this.queryParams= function () {
    var ps = self.query.split('&'), out = {};
    for( var p in ps ) {
      var p = ps[p].split('=');
      var key = p.shift(), value = unescape(p.join('=')).replace('+', ' ');
      out[key] = value;
    }
    return out;
  }

  var queryParamsToS = function() {
    if((typeof self.query).match(/string/i)) return self.query;
    var out = [];
    for(var key in self.query) {
      out.push( key + "=" + escape(self.query[key]) );
    };
    return out.join('&');
  }

  // Returns the string URL
  this.to_s = function() {
    return [
      self.scheme, '://',
      self.domain,
      self.path,
      (self.query  ? '?' : ''), queryParamsToS(),
      (self.anchor ? '#' : ''), self.anchor
    ].join('');
  }

  init();
}