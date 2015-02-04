'use strict';

var gulp  = require('gulp');
var watch2 = require('gulp-watch');

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

});

gulp.task('watch',function(){
    gulp.watch('src/**', ['build'])
});


gulp.task('dev', ['build','watch'])
