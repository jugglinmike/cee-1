require({
  baseUrl: '/components',
  paths: {
    jquery: '/bower_components/jquery/dist/jquery',
    _: '/bower_components/lodash/dist/lodash',
    backbone: '/bower_components/backbone/backbone',
    underscore: '/bower_components/lodash/dist/lodash',
    jade: '/bower_components/require-jade/jade'
  },
  //packages: ['activity/money-creation'],
  deps: ['../scripts/main']
});