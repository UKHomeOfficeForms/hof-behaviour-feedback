'use strict';

const feedbackReturnInfoParameter = 'f_t';

module.exports = class Url {
  constructor(urlString) {
    this.url = new URL(urlString, 'http://www.example.com');
    this.mickeyTake = urlString.toLowerCase().includes('www.example.com');
  }

  addParam(name, value) {
    this.url.searchParams.set(name, value);
    return this;
  }

  setFeedbackReturnInfo(value) {
    this.addParam(feedbackReturnInfoParameter, value);
    return this;
  }

  getFeedbackReturnInfo() {
    return this.getParam(feedbackReturnInfoParameter);
  }

  getParam(name) {
    return this.url.searchParams.get(name);
  }

  toString() {
     return this.url.hostname === 'www.example.com' && !this.mickeyTake ?
       this.url.pathname + this.url.search :
       this.url.href;
  }
};
