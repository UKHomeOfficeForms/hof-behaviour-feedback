/* eslint-disable no-underscore-dangle */

'use strict';

const _ = require('lodash');

module.exports = superclass => class extends superclass {

  constructor(options) {
    super(options);
    this.feedbackConfig = options.feedbackConfig;
    if (options.feedbackConfig && options.feedbackConfig.notify) {
      const NotifyClient = require('notifications-node-client').NotifyClient;
      this.notifyClient = new NotifyClient(options.feedbackConfig.notify.apiKey);
    }
  }

  process(req, res, next) {
    if (this.feedbackConfig) {
        this._sendEmailViaNotify(this.feedbackConfig.notify, req)
        .then(() => {
            super.process(req, res, next);
        })
        .catch((err) => {
          next(err);
        });
    } else {
        req.log('warn', 'Submit feedback behaviour specified but no feedback config provided.' +
                'Did you forget to specify feedbackConfig as part of your step?'
        );
        next();
    }
  }

  saveValues(req, res, callback) {
    // do nothing, we don't want to save them
    return callback();
  }

  getNextStep(req, res) {
    const feedbackReturnPath = req.sessionModel.get('feedbackReturnPath');
    if (feedbackReturnPath) {
      return req.baseUrl + feedbackReturnPath;
    }
    return super.getNextStep(req, res);
  }

  getNext(req) {
    return req.form.options.next;
  }

  getBackLink(req, res) {
    const feedbackReturnPath = req.sessionModel.get('feedbackReturnPath');
    if (feedbackReturnPath) {
      return req.baseUrl + feedbackReturnPath;
    }
    return super.getBackLink(req, res);
  }

  _sendEmailViaNotify(notifyConfig, req) {
    if (notifyConfig && notifyConfig.email) {
      const emailConfig = notifyConfig.email;
      const feedbackEmail = emailConfig.emailAddress;
      const templateId = emailConfig.templateId;
      let values = {};
      values = this._addOptional(values, emailConfig.includeBaseUrlAs, req.baseUrl);
      values = this._addOptional(values, emailConfig.includeSourcePathAs, req.sessionModel.get('feedbackReturnPath'));
      values = _.reduce(
        _.map(
          emailConfig.fieldMappings,
          (property, formField) => this._singleItemJson(property, req.form.values[formField])
        ),
        _.assign,
        values
      );
      return this.notifyClient.sendEmail(templateId, feedbackEmail, {
          personalisation: values
      });
    }
    return Promise.resolve();
  }

  _addOptional(target, property, value) {
    if (property && value) {
      return Object.assign(target, this._singleItemJson(property, value));
    }
    return target;
  }

  _singleItemJson(property, value) {
    let json = {};
    json[property.trim()] = value;
    return json;
  }

};
