var assert = require('assert');
var gutil = require('gulp-util');
var livingcss = require('../');
var path = require('path');

var contents = '/**\n * Test Fixture.\n * @section Fixture\n */';
var pages = '/**\n * Page 1\n * @section Page 1\n *\n\n/**\n * Page 2\n * @section Page 2\n *';
var empty = '';

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
  var stream = livingcss('', {
    template: 'test/fixture.css'
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
  var stream = livingcss('', {
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

it('should expose livingcss utility functions', function () {
  assert(typeof livingcss.utils === 'object');
  assert(typeof livingcss.utils.readFileGlobs === 'function');
});

it('should add multiple pages to the stream', function (cb) {
  var stream = livingcss();
  var pageCount = 0;

  stream.on('data', function (file) {
    try {
      // we wrote 2 pages
      if (++pageCount === 2) {
        cb();
      }
      else if (pageCount > 2) {
        cb(new Error('more than 2 pages were created'));
      }
    }
    catch (e) {
      cb(e);
    }
  });

  stream.write(new gutil.File({
    cwd: __dirname,
    base: __dirname,
    path: path.join(__dirname, 'pages.css'),
    contents: new Buffer(pages)
  }));

  stream.end();
});

it('should complete when no files have JSDoc like comments', function(cb) {
  var stream = livingcss();

  stream.on('data', function (file) {
    try {
      cb();
    }
    catch (e) {
      cb(e);
    }
  });

  stream.on('end', function() {
    cb();
  });

  stream.write(new gutil.File({
    cwd: __dirname,
    base: __dirname,
    path: path.join(__dirname, 'empty.css'),
    contents: new Buffer(empty)
  }));

  stream.end();
});

it('should properly handle async operations in the preprocess function', function(cb) {
  var stream = livingcss('', {
    preprocess: function() {
      return livingcss.utils.readFileGlobs('test/*.css', function() {

      });
    }
  });

  stream.on('data', function (file) {
    try {
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

it('should inline stylesheets for polymer', function(cb) {
  var stream = livingcss();

  stream.on('data', function (file) {
    try {
      assert(/\* Test Fixture\./.test(file.contents.toString()), file.contents.toString());
      assert(/\* @section Fixture/.test(file.contents.toString()), file.contents.toString());
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

it('should read the css file when a destination is passed in', function(cb) {
  var stream = livingcss('dist');

  stream.on('data', function (file) {
    try {
      assert(/\* Test Fixture\./.test(file.contents.toString()), file.contents.toString());
      assert(/\* @section Fixture/.test(file.contents.toString()), file.contents.toString());
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

it('should emit an error event if livingcss threw an error', function(cb) {
  var stream = livingcss('dist');

  stream.on('data', function (file) {

    // this should not be hit
    cb(new Error('gulp-livingcss did not emit error event'))
  });

  stream.on('error', function(err) {
    try {
      assert(err.message.indexOf('section \'Fixture\' is not defined') !== -1);
      cb();
    }
    catch (e) {
      cb(e);
    }
  });

  stream.write(new gutil.File({
    cwd: __dirname,
    base: __dirname,
    path: path.join(__dirname, 'undefined-section.css'),
    contents: new Buffer('/**\n * @sectionof Fixture\n */')
  }));

  stream.end();
});

it('should allow streaming the context object', function(cb) {
  var stream = livingcss('dist', {streamContext: true});

  stream.on('data', function (file) {
    try {
      var context = JSON.parse(file.contents.toString());
      assert(context.sections[0].name === 'Fixture');
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