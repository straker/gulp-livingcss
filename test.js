var assert = require('assert');
var gutil = require('gulp-util');
var livingcss = require('./');
var path = require('path');

var contents = '/**\n * Test Fixture.\n * @section Fixture\n */';

it('should output with LivingCSS', function (cb) {
  var stream = livingcss();

  stream.on('data', function (file) {
    try {
      assert(/Fixture/.test(file.contents.toString()), file.contents.toString());
      assert(/Test Fixture/.test(file.contents.toString()), file.contents.toString());
      assert.equal(file.relative, 'index.html');
      cb();
    }
    catch (e) {
      cb(e);
    }
  });

  stream.write(new gutil.File({
    cwd: __dirname,
    base: __dirname,
    path: path.join(__dirname, 'fixture.css'),
    contents: new Buffer(contents)
  }));

  stream.end();
});

it('should pass options to LivingCSS', function (cb) {
  var stream = livingcss({
    template: 'fixture.css'
  });

  stream.on('data', function (file) {
    try {
      assert(file.contents.toString() === contents, file.contents.toString());
      cb();
    }
    catch (e) {
      cb(e);
    }
  });

  stream.write(new gutil.File({
    cwd: __dirname,
    base: __dirname,
    path: path.join(__dirname, 'fixture.css'),
    contents: new Buffer(contents)
  }));

  stream.end();
});

it('should still run the preprocess function', function (cb) {
  var stream = livingcss({
    preprocess: function(context, template, Handlebars) {
      context.title = 'preprocess';
    }
  });

  stream.on('data', function (file) {
    try {
      assert(/preprocess/.test(file.contents.toString()), file.contents.toString());
      cb();
    }
    catch (e) {
      cb(e);
    }
  });

  stream.write(new gutil.File({
    cwd: __dirname,
    base: __dirname,
    path: path.join(__dirname, 'fixture.css'),
    contents: new Buffer(contents)
  }));

  stream.end();
});