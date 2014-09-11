'use strict';

var pathtoRegexp = require('path-to-regexp');

var hashchange = 'hashchange';
var addListener = 'addEventListener';
var removeListener = 'removeEventListener';

if (typeof window != 'undefined' && window.attachEvent) {
  hashchange = 'on' + hashchange;
  addListener = 'attachEvent';
  removeListener = 'detachEvent';
}

/**
 * Initialize a new Helm instance to handle hash changes.
 *
 * Options:
 *
 *   - `prefix`  string to prefix hash with.
 *   - `window`  target object to attach to; defaults to global window.
 *
 * @param {Object} options
 */
function Helm(options) {
  var helm = this;

  if (!(helm instanceof Helm)) {
    return new Helm(options);
  }

  options = options || {};

  helm.prefix = options.prefix || '';
  helm.window = options.window || window;

  helm.callbacks = [];

  /**
   * Handler for the `hashchange` event.
   */
  helm.listener = function () {
    helm.dispatch(helm.getPath());
  };

  helm.start();
}

var HelmPrototype = Helm.prototype;

/**
 * Register one or more callbacks for a given path.
 *
 * @param  {String} path
 * @return {Helm}
 */
HelmPrototype.on = function (path) {
  var route = new Route(path);
  for (var i = 1; i < arguments.length; i++) {
    this.callbacks.push(route.middleware(arguments[i]));
  }
};

/**
 * Start listening for `hashchange` events.
 */
HelmPrototype.start = function () {
  this.window[addListener](hashchange, this.listener, false);
};

/**
 * Stop listening for `hashchange` events.
 */
HelmPrototype.stop = function () {
  this.window[removeListener](hashchange, this.listener, false);
};

/**
 * Retrieve the current path, prefix excluded.
 *
 * @return {String}
 */
HelmPrototype.getPath = function () {
  var helm = this;
  var path = helm.window.location.hash.slice(1);

  if (helm.prefix && path.indexOf(helm.prefix) == 0) {
    path = path.slice(helm.prefix.length);
  }

  return path;
};

/**
 * Dispatch `path`, passing optional initial `context` object.
 *
 * @param {String} path
 * @param {Object} context
 */
HelmPrototype.dispatch = function (path, context) {
  var helm = this;
  var i = 0;

  context = context || {};
  context.path = path || helm.getPath();
  context.params = [];

  function next() {
    var callback = helm.callbacks[i++];
    if (callback) {
      callback(context, next);
    }
  }

  next();
};

/**
 * Change hash to `path`.
 */
HelmPrototype.go = function (path) {
  this.window.location.hash = this.prefix + (path || '');
};

/**
 * Initialize `Route` with the given `path`.
 *
 * Options:
 *
 *   - `sensitive`    enable case-sensitive routes
 *   - `strict`       enable strict matching for trailing slashes
 *
 * @param {String} path
 * @param {Object} options
 */
function Route(path, options) {
  var route = this;

  options = options || {};

  route.path = (path == '*') ? '(.*)' : path;
  route.keys = [];
  route.regexp = pathtoRegexp(
    route.path,
    route.keys,
    options.sensitive,
    options.strict
  );
}

var RoutePrototype = Route.prototype;

/**
 * Return route middleware with the given callback.
 *
 * @param  {Function} callback
 * @return {Function}
 */

RoutePrototype.middleware = function (callback) {
  var route = this;
  return function (context, next) {
    if (route.match(context.path, context.params)) {
      return callback(context, next);
    }
    next();
  };
};

/**
 * Check if this route matches `path` and if so, populate `params`.
 *
 * @param  {String}  path
 * @param  {Array}   params
 * @return {Boolean}
 */

RoutePrototype.match = function (path, params) {
  var route = this;
  var keys = route.keys;
  var indexOfQuerystring = path.indexOf('?');
  var matches;
  var i;
  var key;
  var value;

  path = ~indexOfQuerystring ?
    path.slice(0, indexOfQuerystring) : path;

  matches = route.regexp.exec(decodeURIComponent(path));

  if (!matches) {
    return false;
  }

  for (i = 1; i < matches.length; i++) {
    key = keys[i - 1];
    value = matches[i];

    if (key) {
      if (params[key.name] === undefined) {
        params[key.name] = value;
      }
    } else {
      params.push(value);
    }
  }

  return true;
};

// Expose API
Helm.Route = Route;
module.exports = Helm;
