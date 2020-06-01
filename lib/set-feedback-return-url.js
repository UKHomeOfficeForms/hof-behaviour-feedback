'use strict';

const RelativeUrl = require('./relative-url');
const ReturnPathInfo = require('./return-path-info');

module.exports = superclass => class Behaviour extends superclass {
  locals(req, res) {
    let feedbackUrl = res.locals.feedbackUrl || (req.baseUrl ? `${req.baseUrl}/feedback` : '/feedback');
    if (req.url !== feedbackUrl) {
      const returnInfo = new ReturnPathInfo(req.baseUrl, req.path, req.originalUrl);
      feedbackUrl = new RelativeUrl(feedbackUrl).setFeedbackReturnInfo(returnInfo.toString()).toString();
    }
    return Object.assign(super.locals(req, res), {'feedbackUrl': feedbackUrl});
  }
};
