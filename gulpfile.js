'use strict';

var gulp = require('gulp');

// lazy load all gulp plugins
var $ = require('gulp-load-plugins')();

var outputFolder = 'dist';
var outputFileName = 'mappify-map.js';

gulp.task('build', function () {
    return gulp.src('src/**')
        .pipe($.ngAnnotate())
        .pipe($.angularFilesort())
        .pipe($.concat(outputFileName))
        .pipe(gulp.dest(outputFolder))
        .pipe($.rename({suffix: '.min'}))
        .pipe($.uglify())
        .pipe(gulp.dest(outputFolder))
        ;
});
