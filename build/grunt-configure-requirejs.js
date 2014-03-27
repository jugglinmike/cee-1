/**
 * @file Because the r.js configuration depends on factors that are fetched
 * asynchronously (i.e. the state of the file system), the Grunt task must be
 * configured asynchronously. Grunt does not support this directly, so a
 * wrapper task is necessary to suspend execution while the configuration is
 * generated.
 */
'use strict';

var getActivities = require('../src/server/get-activities');

module.exports = function(grunt) {
  grunt.initConfig({});

  grunt.loadNpmTasks('grunt-contrib-requirejs');

  grunt.registerTask(
    'configure-requirejs',
    'Asynchronously configure and run the `grunt-contrib-requirejs` plugin',
    function() {
      var done = this.async();
      var args = this.args;
      var argString = this.args.length ? '' : (':' + args.join(':'));
      getActivities().then(function(activities) {
        grunt.config.set('requirejs', generateConfig(activities));

        grunt.task.run('requirejs' + argString);
        done();
      }, console.error.bind(console));
    }
  );
};

function generateConfig(activities) {
  // Library code that is shared between some activities (but not the
  // top-level application) is optimized into distinct modules. Although this
  // forces some activities to require multiple JavaScript files in
  // production, it also:
  // 1. minimizes the size of each individual activity
  // 2. avoids the need to re-define library code between activities
  var sharedLibraries = {
    'cloak': '../node_modules/cloak/cloak-client',
    'socket.io': 'socket.io-client/dist/socket.io'
  };

  return {
    prod: {
      options: {
        baseUrl: '../bower_components',
        appDir: 'src',
        paths: {
          activities: '../src/activities',
          components: '../src/client/components',
          scripts: '../src/client/scripts'
        },
        shim: {
          d3: {
            exports: 'd3'
          },
          'd3.chart': {
            deps: ['d3']
          },
          rangeslider: {
            deps: [
              'jquery',
              'css!rangeslider.js/dist/rangeslider'
            ]
          }
        },
        mainConfigFile: 'src/client/scripts/amd-config.js',
        dir: 'out',
        optimize: 'none',
        pragmasOnSave: {
          excludeJade: true
        },
        modules: generateRjsModules(activities, sharedLibraries)
      }
    },
    bower_components: {
      options: {
        baseUrl: 'bower_components',
        dir: 'out/bower_components',
        skipDirOptimize: true,
        modules: getModuleDescriptors(sharedLibraries)
      }
    }
  };
}

/**
 * In order to seamlessly optimize any and all valid activities, the `modules`
 * configuration for the r.js optimizer must be programatically generated.
 *
 * @param {Array} activities A collection of objects describing valid
 *                activities. Each should define a `slug` property reflecting
 *                the directory it is contained within.
 * @param {Object} sharedLibraries A collection of shared library paths
 *                 (relative to the `bower_components` directory), keyed on the
 *                 library's module ID. These will be excluded from all
 *                 activity modules for efficiency (see above for more detail).
 *
 * @returns {Array} Configuration data for each module that should be
 *                  optimized. See the r.js documentation for details on the
 *                  format of this data:
 *                  http://requirejs.org/docs/optimization.html
 */
function generateRjsModules(activities, sharedLibraries) {
  var mainModule = {
    name: 'scripts/main',
    include: [
      // Include RequireJS to support lazy loading of activities
      'requirejs/require',
      // Include the configuration to ensure that:
      // 1. the application initializes immediately (via the `deps`
      //    option)
      // 2. pathing information is consitent with development mode for
      //    runtime dependency resolution (specifically in service of
      //    lazily-loaded activities)
      'scripts/amd-config'
    ]
  };
  var roomModules = ['createroom', 'manageroom'].map(function(component) {
    return {
      name: 'components/' + component + '/' + component,
      exclude: ['scripts/main'].concat(Object.keys(sharedLibraries))
    };
  });
  var activityModules = activities.map(function(activity) {
    return {
      name: 'activities/' + activity.slug + '/client/scripts/main',
      // Activities will only be run in the context of the site application, so
      // optimized builds should omit any modules required by the "main"
      // module.
      exclude: ['scripts/main'].concat(Object.keys(sharedLibraries))
    };
  });

  return [mainModule].concat(roomModules).concat(activityModules);
}

function getModuleDescriptors(modulePaths) {
  return Object.keys(modulePaths).map(function(id) {
    return { name: modulePaths[id] };
  });
}