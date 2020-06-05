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

  describe('configure', () => {
    let res;
    let req;

    beforeEach(() => {
      submitFeedback = new SubmitFeedback({
        template: 'index',
        fields: {
          field1: {},
          field2: {}
        }
      });
      res = sinon.spy();
      req = {
        form: {
          options: {
          }
        },
        originalUrl: '/my-app/feedback2?something=monkeys&f_t=eyJiYXNlVXJsIjoiL2FwcC1uYW1lIiwicGF0aCI6Ii9zb21lLXBhZ2UiLCJ1cmwiOiIvYXBwLW5hbWUvc29tZS1wYWdlIn0%3D'
      };
    });

    it('should set return path info into request', () => {
      const callback = sinon.spy();

      submitFeedback.configure(req, res, callback);

      // the f_t parameter is a base64 encoded string representing this object
      expect(req.form.options.returnPathInfo).to.deep.equal({
        baseUrl: '/app-name',
        path: '/some-page',
        url: '/app-name/some-page'
      });
      callback.should.have.been.calledOnce.and.calledWithExactly();
    });

    it('should not set return path info if none in request', () => {
      req.originalUrl = '/my-app/feedback2?something=monkeys';

      const callback = sinon.spy();

      submitFeedback.configure(req, res, callback);

      expect(req.form.options.returnPathInfo).to.be.an('undefined');
      callback.should.have.been.calledOnce.and.calledWithExactly();
    });
  });

  describe('successHandler', () => {

    before(() => {
      sinon.stub(Controller.prototype, 'successHandler').returns('/badgers2');
    });

    after(() => {
      Controller.prototype.successHandler.restore();
    });

    describe('with no valid config', () => {
      it('should log and call super.successHandler if there is no config', () => {
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

        submitFeedback.successHandler(req, res, next);

        req.log.should.have.been.calledOnce
          .and.calledWithExactly('warn', 'Submit feedback behaviour specified but no feedback config provided.' +
            'Did you forget to specify feedbackConfig as part of your step?'
          );
        Controller.prototype.successHandler.should.have.been.calledOnce
          .and.calledWithExactly(req, res, next);
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

        submitFeedback.successHandler(req, res, next);

        req.log.should.have.not.been.called;
        submitFeedback.notifyClient.sendEmail.should.have.not.been.called;
        Promise.resolve(nextCalled).should.eventually.equal(true);
      });
    });

    describe('with a valid email config', () => {
      const originatingPath = '/path';
      const baseUrl = '/app';
      let req;
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
        req = {
          log: sinon.spy(),
          form: {
            values: {
              input1: 'Some text',
              input2: 'Some name',
              input3: 'Some email'
            },
            options: {
              returnPathInfo: { baseUrl: baseUrl, path: originatingPath, url: baseUrl + originatingPath }
            }
          },
          baseUrl: baseUrl
        };
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

        submitFeedback.successHandler(req, res, next);

        submitFeedback.notifyClient.sendEmail.should.have.been.calledOnce
          .and.calledWithExactly(templateId, feedbackEmail, {
            personalisation: {
              process: baseUrl,
              path: originatingPath,
              feedback: req.form.values.input1,
              name: req.form.values.input2,
              email: req.form.values.input3
            }
          });
        Promise.resolve(nextCalled).should.eventually.equal(true);
        expect(errorPassedToNext).to.be.an('undefined');
     });

      it('should send email with undefined baseUrl and path if they are not present', () => {
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
        delete req.form.options.returnPathInfo.baseUrl;
        delete req.form.options.returnPathInfo.path;

        submitFeedback.notifyClient.sendEmail = sinon.fake.returns(Promise.resolve());

        submitFeedback.successHandler(req, res, next);

        submitFeedback.notifyClient.sendEmail.should.have.been.calledOnce
          .and.calledWithExactly(templateId, feedbackEmail, {
            personalisation: {
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

       submitFeedback.successHandler(req, res, next);

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

       submitFeedback.successHandler(req, res, next);

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
  });

  describe('saveValues', () => {
    it('should not save any form values', () => {
      const req = {
        sessionModel: {
          get: sinon.stub(),
          set: sinon.spy()
        },
        form: {
          values: {
            something: 'some value'
          }
        }
      };
      const res = sinon.spy();
      const callback = sinon.spy();

      req.sessionModel.get.withArgs('errorValues').returns(undefined);

      submitFeedback.saveValues(req, res, callback);

      req.sessionModel.set.should.not.have.been.called;
      res.should.not.have.been.called;
      callback.should.have.been.calledOnce;
    });

    it('should erase any error values that are related to this form', () => {
      const req = {
        sessionModel: {
          get: sinon.stub(),
          set: sinon.spy()
        },
        form: {
          values: {
            something: 'some value',
            badger: 'monkeys'
          }
        }
      };
      const res = sinon.spy();
      const callback = sinon.spy();

      req.sessionModel.get.withArgs('errorValues').returns({
        something: 'a',
        anotherThing: 'genius',
        badger: 'b'
      });

      submitFeedback.saveValues(req, res, callback);

      req.sessionModel.set.should.have.been.calledOnce
        .and.calledWithExactly('errorValues', { anotherThing: 'genius' });
      res.should.not.have.been.called;
      callback.should.have.been.calledOnce;
    });
  });

  describe('getNextStep', () => {

    before(() => {
      sinon.stub(Controller.prototype, 'getNextStep').returns('/badgers2');
    });

    after(() => {
      Controller.prototype.getNextStep.restore();
    });

    it('should return the next step if no returnPathInfo is in the request', () => {
      let req = {
        baseUrl: '/app',
        log: sinon.spy(),
        form: {
          options: {}
        }
      };
      const res = sinon.spy();

      const returned = submitFeedback.getNextStep(req, res);

      returned.should.equal('/badgers2');
    });

    it('should return the next step returnPathInfo is in the request but does not contain a url', () => {
      let req = {
        baseUrl: '/app',
        log: sinon.spy(),
        form: {
          options: {
            returnPathInfo: {}
          }
        }
      };
      const res = sinon.spy();

      const returned = submitFeedback.getNextStep(req, res);

      returned.should.equal('/badgers2');
    });

    it('should return the full path of the next step if a return url is in the request', () => {
      let req = {
        baseUrl: '/app',
        log: sinon.spy(),
        form: {
          options: {
            returnPathInfo: {url: '/app/badgers3'}
          }
        }
      };
      const res = sinon.spy();

      const returned = submitFeedback.getNextStep(req, res);

      returned.should.equal('/app/badgers3');
    });
  });

  describe('getBackLink', () => {

    before(() => {
      sinon.stub(Controller.prototype, 'getBackLink').returns('/badgers4');
    });

    after(() => {
      Controller.prototype.getBackLink.restore();
    });

    it('should return the back link if no return path info is in the request', () => {
      let req = {
        baseUrl: '/app',
        log: sinon.spy(),
        form: {
          options: {}
        }
      };
      const res = sinon.spy();

      const returned = submitFeedback.getBackLink(req, res);

      returned.should.equal('/badgers4');
    });

    it('should return the back link if return path info is in the request but does not contain a url', () => {
      let req = {
        baseUrl: '/app',
        log: sinon.spy(),
        form: {
          options: {
            returnPathInfo: {}
          }
        }
      };
      const res = sinon.spy();

      const returned = submitFeedback.getBackLink(req, res);

      returned.should.equal('/badgers4');
    });

    it('should return the full path of the return url if a return url is in the session', () => {
      let req = {
        baseUrl: '/app',
        log: sinon.spy(),
        form: {
          options: {
            returnPathInfo: {url: '/app/badgers3'}
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
