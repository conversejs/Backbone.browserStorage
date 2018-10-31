// Karma configuration
// Generated on Sun Feb 19 2017 21:14:14 GMT+0000 (GMT)

/* globals module */

const path = require('path');
const coverageReporters = [{
  type: 'text-summary'
}];

const reporters = [
  'progress',
  'coverage'
];

module.exports = function(config) {
  config.set({
    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',
    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha'],
    // list of files / patterns to load in the browser
    files: [
      'test/*.test.js'
    ],
    // list of files to exclude
    exclude: [],
    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
      'test/*.test.js': ['webpack']
    },
    webpack: {
      devtool: 'inline-source-map',
      module: {
         rules: [{
           test: /\.js$/,
           exclude: /(node_modules|test)/,
           use: {
             loader: 'babel-loader',
             options: {
               presets: [
                 ["@babel/preset-env", {
                     "targets": {
                         "browsers": [">1%", "not ie 11", "not op_mini all"]
                     }
                 }]
               ]
             }
           }
         }]
      },
      output: {
        path: path.resolve('test'),
        filename: 'test.out.js'
      },
      resolve: {
        alias: {
          'backbone.browserStorage': path.resolve('src/backbone.browserStorage.js'),
          '../utils': path.resolve('node_modules/localforage/src/utils')
        }
      }
    },
    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters,
    coverageReporter: {
      reporters: coverageReporters
    },
    coverageIstanbulReporter: {
      reports: ['text-summary'],
      fixWebpackSourcePaths: true
    },
    // web server port
    port: 9876,
    // enable / disable colors in the output (reporters and logs)
    colors: true,
    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,
    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,
    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],
    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,
    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity
  });
};
