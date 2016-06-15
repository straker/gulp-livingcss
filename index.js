var gutil = require('gulp-util');
var through = require('through2');
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
      this.emit('error', new PluginError('generator',  'Streaming not supported'));
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
    var pageCount = 0;

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

      preprocess.then(
        function success() {
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

          // only finish writing to the stream if all pages have been added
          if (++pageCount === context.pages.length) {
            cb();
          }
        })
      .catch(function(err) {
        if (err) {
          console.error(err.stack);
        }

        cb();
      });

      return false;
    }

    livingcss(files, dest, options);
  }

  return through.obj(bufferContents, endStream);
};

// add livingcss utility functions to gulp plugin
module.exports.utils = livingcss.utils;