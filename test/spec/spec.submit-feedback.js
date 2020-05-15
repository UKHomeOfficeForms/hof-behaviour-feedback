'use strict';

const SubmitFeedbackBehaviour = require('../../').SubmitFeedback;
const Controller = require('hof-form-controller').Controller;
const SubmitFeedback = SubmitFeedbackBehaviour(Controller);

describe('SubmitFeedback behaviour', () => {

  let submitFeedback;
  const apiKey = 'SomeApiKey';

  beforeEach(() => {
    submitFeedback = new SubmitFeedback({
       template: 'index',
       fields: {
         field1: {},
         field2: {}
       },
       feedbackConfig: {
         something: 'someValue',
         notify: {
            apiKey: apiKey
         }
       }
    });
  });

  describe('constructor', () => {
    it('should handle no feedback config', () => {
      submitFeedback = new SubmitFeedback({
        template: 'index',
        fields: {
          field1: {},
          field2: {}
        }
      });
      expect(submitFeedback.feedbackConfig).to.be.an('undefined');
      expect(submitFeedback.notifyClient).to.be.an('undefined');
    });

    it('should store the provided feedback config', () => {
      expect(submitFeedback.feedbackConfig).to.have.property('something', 'someValue');
    });

    it('should create a notify client if there is a notify config', () => {
      expect(submitFeedback.notifyClient).to.exist;
    });
  });

  describe('process with no valid config', () => {
    it('should log and call next if there is no config', () => {
      submitFeedback = new SubmitFeedback({
        template: 'index',
        fields: {
          field1: {},
          field2: {}
        }
      });
      let next = sinon.spy();
      let req = {
          log: sinon.spy()
      };
      let res = sinon.stub();

      submitFeedback.process(req, res, next);

      req.log.should.have.been.calledOnce
        .and.calledWithExactly('warn', 'Submit feedback behaviour specified but no feedback config provided.' +
          'Did you forget to specify feedbackConfig as part of your step?'
        );
      next.should.have.been.calledOnce;
    });

    it('should do nothing if there is no email config', () => {
      let req = {
          log: sinon.spy()
      };
      let res = sinon.stub();
      let nextCalled = false;
      let next = function() {
          nextCalled = true;
      };
      submitFeedback.notifyClient.sendEmail = sinon.spy();

      submitFeedback.process(req, res, next);

      req.log.should.have.not.been.called;
      submitFeedback.notifyClient.sendEmail.should.have.not.been.called;
      Promise.resolve(nextCalled).should.eventually.equal(true);
    });
  });

  describe('process with a valid email config', () => {
    const originatingPath = '/path';
    const values = {
      feedbackReturnPath: originatingPath
    };
    let req = {
        log: sinon.spy(),
        form: {
            values: {
                input1: 'Some text',
                input2: 'Some name',
                input3: 'Some email'
            }
        },
        baseUrl: '/app',
        sessionModel: {

            get: function(key) {
                return values[key];
            }
        }
    };
    const res = sinon.stub();
    const templateId = 'badger';
    const feedbackEmail = 'b@example.com';

    let nextCalled;
    let errorPassedToNext;

    let next = function(err) {
        nextCalled = true;
        errorPassedToNext = err;
    };

    beforeEach(() => {
        nextCalled = false;
        errorPassedToNext = undefined;
    });

    it('should send email according to configured inputs map if there is an email config', () => {
      submitFeedback = new SubmitFeedback({
                template: 'index',
                fields: {
                  field1: {},
                  field2: {}
                },
                feedbackConfig: {
                  something: 'someValue',
                  notify: {
                     apiKey: apiKey,
                     email: {
                       templateId: templateId,
                       emailAddress: feedbackEmail,
                       fieldMappings: {
                         input1: 'feedback',
                         input2: 'name',
                         input3: 'email'
                       },
                       includeBaseUrlAs: 'process',
                       includeSourcePathAs: 'path'
                     }
                  }
                }
              });

      submitFeedback.notifyClient.sendEmail = sinon.fake.returns(Promise.resolve());

      submitFeedback.process(req, res, next);

      submitFeedback.notifyClient.sendEmail.should.have.been.calledOnce
        .and.calledWithExactly(templateId, feedbackEmail, {
          personalisation: {
            process: '/app',
            path: originatingPath,
            feedback: req.form.values.input1,
            name: req.form.values.input2,
            email: req.form.values.input3
          }
        });
      Promise.resolve(nextCalled).should.eventually.equal(true);
      expect(errorPassedToNext).to.be.an('undefined');
   });

   it('should ignore fields not explicitly mapped in the email config', () => {
     submitFeedback = new SubmitFeedback({
       template: 'index',
       fields: {
         field1: {},
         field2: {}
       },
       feedbackConfig: {
         something: 'someValue',
         notify: {
            apiKey: apiKey,
            email: {
              templateId: templateId,
              emailAddress: feedbackEmail,
              fieldMappings: {
                input2: 'name'
              }
            }
         }
       }
     });

     submitFeedback.notifyClient.sendEmail = sinon.fake.returns(Promise.resolve());

     submitFeedback.process(req, res, next);

     submitFeedback.notifyClient.sendEmail.should.have.been.calledOnce
       .and.calledWithExactly(templateId, feedbackEmail, {
         personalisation: {
           name: req.form.values.input2
         }
       });
     Promise.resolve(nextCalled).should.eventually.equal(true);
     expect(errorPassedToNext).to.be.an('undefined');
   });

   it('should call next logging the thrown error and returning a sensible user facing error if email sending fails',
   () => {
     submitFeedback = new SubmitFeedback({
       template: 'index',
       fields: {
         field1: {},
         field2: {}
       },
       feedbackConfig: {
         something: 'someValue',
         notify: {
            apiKey: apiKey,
            email: {
              templateId: templateId,
              emailAddress: feedbackEmail,
              fieldMappings: {
                input2: 'name'
              }
            }
         }
       }
     });

     const error = 'some message';
     submitFeedback.notifyClient.sendEmail = sinon.fake.returns(Promise.reject(error));

     submitFeedback.process(req, res, next);

     submitFeedback.notifyClient.sendEmail.should.have.been.calledOnce
       .and.calledWithExactly(templateId, feedbackEmail, {
         personalisation: {
           name: req.form.values.input2
         }
       });
     Promise.resolve(nextCalled).should.eventually.equal(true);
     Promise.resolve(errorPassedToNext).should.eventually.satisfy(function(value) {
            req.log.should.have.been.calledOnce.and.calledWithExactly('error', error);
            return value === 'There was an error sending your feedback';
        });

   });

  });

  describe('saveValues', () => {
    it('should not save anything', () => {
      const req = sinon.spy();
      const res = sinon.spy();
      const callback = sinon.spy();

      submitFeedback.saveValues(req, res, callback);

      req.should.not.have.been.called;
      res.should.not.have.been.called;
      callback.should.have.been.calledOnce;
    });
  });

  describe('getNextStep', () => {
    it('should return the next step if no return url is in the session', () => {
      let req = {
        baseUrl: '/app',
        log: sinon.spy(),
        sessionModel: {
          get: function() {
            return null;
          }
        }
      };
      const res = sinon.spy();

      sinon.stub(Controller.prototype, 'getNextStep').returns('/badgers2');

      const returned = submitFeedback.getNextStep(req, res);

      returned.should.equal('/badgers2');
    });

    it('should return the full path of the next step if a return url is in the session', () => {
      let req = {
        baseUrl: '/app',
        log: sinon.spy(),
        sessionModel: {
          get: function() {
            return '/badgers3';
          }
        }
      };
      const res = sinon.spy();

      const returned = submitFeedback.getNextStep(req, res);

      returned.should.equal('/app/badgers3');
    });
  });

  describe('getBackLink', () => {
    it('should return the back link if no return url is in the session', () => {
      let req = {
        baseUrl: '/app',
        log: sinon.spy(),
        sessionModel: {
          get: function() {
            return null;
          }
        }
      };
      const res = sinon.spy();

      sinon.stub(Controller.prototype, 'getBackLink').returns('/badgers2');

      const returned = submitFeedback.getBackLink(req, res);

      returned.should.equal('/badgers2');
    });

    it('should return the full path of the return url if a return url is in the session', () => {
      let req = {
        baseUrl: '/app',
        log: sinon.spy(),
        sessionModel: {
          get: function() {
            return '/badgers3';
          }
        }
      };
      const res = sinon.spy();

      const returned = submitFeedback.getBackLink(req, res);

      returned.should.equal('/app/badgers3');
    });
  });

  describe('getNext', () => {
   it('should return the next as configured in the form options', () => {
      const req = {
        form: {
          options: {
            next: '/badgers3'
          }
        }
      };

      const returned = submitFeedback.getNext(req);

      returned.should.equal('/badgers3');
   });
  });
});
