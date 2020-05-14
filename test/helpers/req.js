'use strict';

module.exports = req => {
  req.form = req.form || {};
  req.form.values = req.form.values || {};
  req.form.options = req.form.options || {};
  req.form.options.route = req.form.options.route || '/something';
  return require('reqres').req(req);
};
