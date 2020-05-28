# hof-behaviour-feedback

HOF behaviour allowing a custom feedback page to be deployed as part of the hof form, which will then be linked to as part of the banner.

When configured correctly the user will be taken to the custom feedback form, and redirected back to the page they came from when the form has been submitted. 

## Installation

```javascript
npm install [--save] hof-behaviour-feedback;
```

## Usage

### hof app initialisation (top level index.js)
```javascript
const app = hof({
  ...
  behaviours: [
    require('hof-behaviour-feedback').SetFeedbackReturnUrl
  ],
  ...
});
```

#### Customising the feedback form step path (Optional, defaults to ${app.baseUrl}/feedback):

Note that if setting a custom url for the feedback form the app.baseUrl will not be applied automatically.

```javascript
app.use((req, res, next) => {
  // Set custom feedback path
  res.locals.feedbackUrl='/my-feedback-url';
  next();
});
```

### app/myapp/index.js

```javascript
const UploadFeedback = require('hof-behaviour-feedback').SubmitFeedback

module.exports = {
  ...
  steps: {
    ...
    '/feedback': {
      fields: [...],
      behaviours: [UploadFeedback],
      feedbackConfig: {
        ...
      }
    } 
  }
}
```
Configure the fields for the feedback step as normal.

#### Submission types

While currently only GovUK email is supported this library is designed to be easily extensible to support
other types of feedback submission.

##### Email via GovUK Notify

Requires `notifications-node-client` if notify is configured.

```javascript
feedbackConfig: {
  notify: {
    apiKey: config.govukNotify.notifyApiKey,
    email: {
      templateId: config.govukNotify.templateFormFeedback, 
      emailAddress: config.govukNotify.feedbackEmail,
      fieldMappings: { 
          'feedbackText': 'feedback',
          'feedbackName' : 'name',
          'feedbackEmail' : ' email'
      },
      includeBaseUrlAs : "process",
      includeSourcePathAs : "path"
    }
  }
}
```

* **apiKey** - the notify api key.
* **templateId** - id of the GovUk notify email template.
* **emailAddress** - address the feedback email should be sent to.
* **fieldMappings** - associative array of input names to the corresponding variable name in the notify email template. Any inputs which are not explicitly mapped here will not be sent to notify.
* **includeBaseUrlAs** (Optional) - if included the application base url will be sent to notify with the given variable name.
* **includeSourcePathAs** (Optional) - if included the originating page path (i.e. the page the user was on before they clicked the feedback link) will be sent to notify with the given variable name.  




