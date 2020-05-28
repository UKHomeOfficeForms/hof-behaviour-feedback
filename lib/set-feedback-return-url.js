'use strict';

module.exports = superclass => class Behaviour extends superclass {
  locals(req, res) {
    const feedbackUrl = res.locals.feedbackUrl || (req.baseUrl ? `${req.baseUrl}/feedback` : '/feedback');
    if (req.url !== feedbackUrl) {
      req.sessionModel.set('feedbackReturnPath', {
        baseUrl: req.baseUrl,
        path: req.path,
        url: req.url
      });
    }
    return Object.assign(super.locals(req, res), {'feedbackUrl': feedbackUrl});
  }
};
