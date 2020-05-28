'use strict';

const SetFeedbackReturnUrlBehaviour = require('../../').SetFeedbackReturnUrl;
const BaseController = require('hof-form-controller').BaseController;
const response = require('reqres').res;
const SetFeedbackReturnUrl = SetFeedbackReturnUrlBehaviour(BaseController);

describe('SetReturnUrl behaviour', () => {

  let setReturnUrl;

  beforeEach(() => {
    setReturnUrl = new SetFeedbackReturnUrl({
          template: 'index',
          fields: {
            field1: {},
            field2: {}
          }
        });
  });

  describe('locals', () => {
    let superLocals = {foo: 'bar'};
    sinon.stub(BaseController.prototype, 'locals').returns(superLocals);

    describe('should set return path and feedback url if not the feedback url', () => {
      let req;
      let res;

      beforeEach(() => {
        req = request({});
        res = response();
        req.baseUrl = '/app-name';
        req.path = '/some-page';
        req.url = req.baseUrl + req.path;
        req.sessionModel = {
          set: sinon.spy()
        };
        res.locals = {};
      });

      it('should set the feedback return url', () => {
        setReturnUrl.locals(req, res);
        req.sessionModel.set.should.have.been.calledOnce
                  .and.calledWithExactly('feedbackReturnPath', { baseUrl: req.baseUrl, path: req.path, url: req.url });
      });

      it('should set the feedback url to default when none provided', () => {
        const returned = setReturnUrl.locals(req, res);
        expect(returned).to.include({foo: 'bar', feedbackUrl: '/app-name/feedback'});
      });

      it('should set the feedback url to default when no base url present', () => {
        req.baseUrl = undefined;
        const returned = setReturnUrl.locals(req, res);
        expect(returned).to.include({foo: 'bar', feedbackUrl: '/feedback'});
      });

      it('should set the feedback url to the specified value when provided', () => {
        res.locals = res.locals || {};
        res.locals.feedbackUrl = '/feedback2';
        const returned = setReturnUrl.locals(req, res);
        expect(returned).to.include({foo: 'bar', feedbackUrl: '/feedback2'});
      });
    });

    describe('should not set return path if this is the feedback url', () => {
          let req = request({});

          let res = response();
          res.locals = {};

          beforeEach(() => {
            req.sessionModel = {
              set: sinon.spy()
            };

            req.baseUrl = '/app-name';
            req.path = '/feedback';
            req.url = req.baseUrl + req.path;
          });

          it('should not set the feedback return url when using the default', () => {
            const returned = setReturnUrl.locals(req, res);
            req.sessionModel.set.should.not.have.been.called;
            expect(returned).to.include({foo: 'bar', feedbackUrl: '/app-name/feedback'});
          });

          it('should not set the feedback return url when using the specified value', () => {
            res.locals = res.locals || {};
            res.locals.feedbackUrl = '/feedback2';
            req.path = '/feedback2';
            req.baseUrl = undefined;
            req.url = req.path;
            const returned = setReturnUrl.locals(req, res);
            req.sessionModel.set.should.not.have.been.called;
            expect(returned).to.include({foo: 'bar', feedbackUrl: '/feedback2'});
          });

          it('should set the feedback return url when a custom feedback page is specified and we are accessing the default url', () => {
            res.locals = res.locals || {};
            res.locals.feedbackUrl = '/feedback2';
            const returned = setReturnUrl.locals(req, res);
            req.sessionModel.set.should.have.been.calledOnce
              .and.calledWithExactly('feedbackReturnPath', { baseUrl: req.baseUrl, path: req.path, url: req.url });
            expect(returned).to.include({foo: 'bar', feedbackUrl: '/feedback2'});
          });

        });
  });
});
