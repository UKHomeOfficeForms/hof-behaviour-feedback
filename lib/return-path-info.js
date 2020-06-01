'use strict';

const atob = require('atob');
const btoa = require('btoa');
const RelativeUrl = require('./relative-url');

module.exports = class ReturnPathInfo {
  constructor(baseUrl, path, url) {
    // parse all of these badboys as a Url to ensure they're sensible values
    this.baseUrl = baseUrl ? new RelativeUrl(baseUrl).toString() : baseUrl;
    this.path = path ? new RelativeUrl(path).toString() : path;
    this.url = url ? new RelativeUrl(url).toString() : url;
  }

  toString() {
     return btoa(JSON.stringify(this));
  }
};

module.exports.decode = function decode(encoded) {
  if (encoded) {
    const decoded = JSON.parse(atob(encoded));
    return new this(decoded.baseUrl, decoded.path, decoded.url);
  }
  return undefined;
};
