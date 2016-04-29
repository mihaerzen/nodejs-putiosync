'use strict';

const gulp = require('gulp');
const watch = require('gulp-watch');

module.exports = function() {
    gulp.watch('src/**/*.js', ['build']);
};
