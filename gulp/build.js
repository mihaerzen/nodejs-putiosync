'use strict';

const gulp = require('gulp');
const sourcemaps = require('gulp-sourcemaps');
const babel = require('gulp-babel');
const plumber = require('gulp-plumber');

module.exports = function() {
    return gulp.src('src/**/*.js')
        .pipe(plumber())
        .pipe(sourcemaps.init())
        .pipe(babel({
            presets: ['es2015', 'stage-3'],
            plugins: ['transform-runtime']
        }))
        .pipe(sourcemaps.write('.', {
            mapSources: function(sourcePath) {
                // source paths are prefixed with '../src/'
                return '../src/' + sourcePath;
            }
        }))
        .pipe(gulp.dest('dist'));
};
