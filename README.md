[![Build Status](https://travis-ci.org/straker/gulp-livingcss.svg?branch=master)](https://travis-ci.org/straker/gulp-livingcss)

# gulp-livingcss

Gulp wrapper for the LivingCSS Style Guide Generator.

*Issues with the output should be reported on the LivingCSS [github repo](https://github.com/straker/livingcss/issues).*

## Install

```
$ npm install --save-dev gulp-livingcss
```

## Usage

```js
var gulp = require('gulp');
var livingcss = require('gulp-livingcss');

gulp.task('default', function () {
  gulp.src('src/styles.css')
    .pipe(livingcss('dist'))
    .pipe(gulp.dest('dist'))
});
```

## API

### livingcss(dest, [options])

#### dest

The `dest` parameter is used to create the correct relative URLs from the Style Guide to the linked stylesheets. See the LivingCSS [dest](https://github.com/straker/livingcss#usage).

#### options

See the LivingCSS [options](https://github.com/straker/livingcss#options).

* `streamContext` - If the task should return the context object rather than the generated HTML file.