## 2020-05-28, Version 2.0.0 (Stable), @andymoody
* Custom feedback url's are now treated as relative from the root
  rather than being prepended with the app.baseUrl automatically.
* Source (and return) url info is now passed as a Base64 encoded request parameter 'f_t' rather than being stored in
  the session. 
* This means that we can utilize a single feedback page for multiple HOF forms.

