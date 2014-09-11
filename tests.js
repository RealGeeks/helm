'use strict';

var test = require('tape');
var helm = require('./');

test('Helm catch-all first', function (assert) {
  var router = helm({
    window: window
  });

  assert.plan(3);

  assert.ok(router instanceof helm, 'should autoinstantiate');

  router.on('*', function (context) {
    assert.pass('catch-all callback should be called');
    assert.equal(context.path, '/path', 'path should be right');
  });

  router.on('/path', function () {
    assert.fail('should not be called');
  });

  router.dispatch('/path');
  router.stop();
});

test('Helm catch-all last', function (assert) {
  var router = helm({
    window: window
  });

  assert.plan(2);

  router.on('/something', function (context, next) {
    assert.equal(context.path, '/something', 'path should be right');
    next();
  });

  router.on('*', function () {
    assert.pass('catch-all shoould be called after other callbacks');
  });

  router.dispatch('/something');
  router.stop();
});

test('Helm path params', function (assert) {
  var router = helm({
    window: window
  });

  assert.plan(4);

  router.on('/user/:name', function (context) {
    assert.equal(context.params.name, 'jack', 'name should be jack');
  });

  router.on('/:id/type', function (context) {
    assert.equal(context.params.id, '12', 'id should be 12');
  });

  router.on('/:first/:second', function (context) {
    assert.equal(context.params.first, 'A', 'first should be A');
    assert.equal(context.params.second, 'B', 'second should be B');
  });

  router.dispatch('/user/jack');
  router.dispatch('/12/type');
  router.dispatch('/A/B');
  router.stop();
});

test('Helm custom prefix', function (assert) {
  // start clean
  window.location.hash = '';

  var router = helm({
    window: window,
    prefix: '!/'
  });

  assert.plan(1);

  router.on('*', function (context) {
    assert.equal(context.path, 'blah', 'path should be correct');

    router.stop();
  });

  window.location.hash = '!/blah';
});
