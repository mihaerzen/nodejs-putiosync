'use strict';

const gulp = require('gulp');

const build = require('./gulp/build');
const watch = require('./gulp/watch');
const clean = require('./gulp/clean');

gulp.task('clean', clean);
gulp.task('build', build);
gulp.task('watch', ['build'], watch);
