Helm: Minimal router for browsers.
==================================

Inspired by [page.js](https://github.com/visionmedia/page.js), _Helm_ is a client-side router that leverages the hash portion of URLs to do the routing.

Installation
------------

```bash
npm install helm
```

Usage
-----

```js
var helm = require('helm');
var router = helm();

helm.on('/user/:username', function (context) {
  console.log(context.params.username);
});

helm.go('/user/jack');
```
