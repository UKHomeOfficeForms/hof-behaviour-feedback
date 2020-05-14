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

    describe('should set return path if not the default feedback url', () => {
      let req = request({});
      req.sessionModel = {
        set: sinon.spy()
      };
      req.baseUrl = '/app-name';
      req.path = '/some-page';
      let superLocals = {foo: 'bar'};
      sinon.stub(BaseController.prototype, 'locals').returns(superLocals);

      let res = response();
      res.locals = {};

      it('should set the feedback return url', () => {
        setReturnUrl.locals(req, res);
        req.sessionModel.set.should.have.been.calledOnce
                  .and.calledWithExactly('feedbackReturnPath', req.path);
      });

      it('should set the feedback url to default when none provided', () => {
        const returned = setReturnUrl.locals(req, res);
        expect(returned).to.include({foo: 'bar', feedbackUrl: '/app-name/feedback'});
      });

      it('should set the feedback url to the specified value when provided', () => {
        res.locals = res.locals || {};
        res.locals.feedbackUrl = '/feedback2';
        const returned = setReturnUrl.locals(req, res);
        expect(returned).to.include({foo: 'bar', feedbackUrl: '/app-name/feedback2'});
      });

    });
  });
});
