var gutil = require('gulp-util');
var through = require('through2');
var path = require('path');
var File = gutil.File;
var PluginError = gutil.PluginError;

var livingcss = require('livingcss');
var minify = require('html-minifier').minify;

/**
 * Buffer all files before passing the file list to livingcss.
 * @param {string} dest - Destination path to pass to livingcss.
 * @param {object} [options] - Options to pass to livingcss.
 */
module.exports = function (dest, options) {
  options = options || {};

  // list of all files from gulp.src
  var files = [];

  /**
   * Buffer all files before parsing them to livingcss.
   */
  function bufferContents(file, enc, cb) {
    // ignore empty files
    if (file.isNull()) {
      return cb();
    }

    // no streams
    if (file.isStream()) {
      this.emit('error', new PluginError('gulp-livingcss', 'Streaming not supported'));
      return cb();
    }

    files.push(file.path);

    cb();
  }

  /**
   * Pass all files to livingcss once buffered.
   */
  function endStream(cb) {
    var _this = this;

    options._squelchLogging = true;

    // because we want to create a file for the stream and not one through fs.write
    // we need to override the preprocess function to return false so it doesn't go
    // through that step of the generate script
    var preprocessFunc = options.preprocess;
    options.preprocess = function(context, template, Handlebars) {

      // if no preprocess function then resolve a promise
      var preprocess = (preprocessFunc ?
        preprocessFunc(context, template, Handlebars) :
        Promise.resolve());

      // if the user returned anything but false we'll resolve a promise
      if (!(preprocess instanceof Promise)) {
        preprocess = (preprocess !== false ? Promise.resolve() : Promise.reject());
      }

      return preprocess
        .then(function() {

          // skip processing the stylesheets and handlebars template and just
          // return the context object
          return options.streamContext ? Promise.reject() : Promise.resolve();
        })
        .then(function() {

          // read the stylesheets from an absolute path so we're not trying to
          // read them from the livingcss directory
          var stylesheets = context.stylesheets.map(function(file) {
            return path.join( process.cwd(), dest || '.', file);
          });

          // inline all stylesheets for polymer shared styles to work
          // @see https://www.polymer-project.org/1.0/docs/devguide/styling#style-modules
          return livingcss.utils.readFiles(stylesheets, function(data, file) {
            context.parsedStylesheets = context.parsedStylesheets || [];
            context.parsedStylesheets.push(data);
          });
        })
        .then(function success() {
          var html = Handlebars.compile(template)(context);

          if (options.minify) {
            html = minify(html, {
              collapseWhitespace: true
            });
          }

          // add output file to stream
          _this.push(new File({
            name: context.id + '.html',
            path: context.id + '.html',
            contents: new Buffer(html)
          }));

          // reject this promise so livingcss doesn't create files
          return Promise.reject();
        })
        .catch(function(err) {
          if (err) {
            _this.emit('error', new PluginError({
              plugin: 'gulp-livingcss',
              message: e.message
            }));
          }

          if (options.streamContext) {
            // add context file to stream
            _this.push(new File({
              name: context.id + '.json',
              path: context.id + '.json',
              contents: new Buffer(JSON.stringify(context))
            }));
          }

          // reject this promise so livingcss doesn't create files
          return Promise.reject(err);
        });
    }

    livingcss(files, dest, options).then(function() { cb(); })
      .catch(function(e) {
        _this.emit('error', new PluginError({
          plugin: 'gulp-livingcss',
          message: e.message
        }));
      });
  }

  return through.obj(bufferContents, endStream);
};

// add livingcss utility functions to gulp plugin
module.exports.utils = livingcss.utils;