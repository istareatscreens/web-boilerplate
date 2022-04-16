"use strict";

const gulp = require("gulp");
const sourcemaps = require("gulp-sourcemaps");
const browserSync = require("browser-sync");
const { src, series, parallel, dest } = require("gulp");
const webpack = require("webpack-stream");
const del = require("del");
const htmlmin = require("gulp-htmlmin");
var cachebust = require("gulp-cache-bust");

// Paths
const output = "./public/";
const jsPath = "src/js/**/*.*";
const cssPath = "src/css/**/*";
const htmlPath = "src/html/**/*";
const imagePath = "src/images/**/*";
const icoPath = "src/images/*.ico";
const wasmPath = "src/wasm/*.wasm";

// Common Tasks
function imageTask() {
  return src([imagePath, `!${icoPath}`])
    .pipe(webpack(require("./webpack.prod.js")))
    .pipe(dest(output));
}

function icoTask() {
  return src([icoPath]).pipe(dest(output));
}

function wasmTask() {
  return src(wasmPath).pipe(dest(output));
}

// Development Tasks
function jsDevTask() {
  return src([jsPath, "!node_modules"])
    .pipe(webpack(require("./webpack.dev.js")))
    .pipe(dest(output));
}

function htmlDevTask() {
  return src([htmlPath]).pipe(gulp.dest(output));
}

function cssDevTask() {
  return src([cssPath + ".scss", cssPath + ".css"])
    .pipe(sourcemaps.init())
    .pipe(webpack(require("./webpack.dev.js")))
    .pipe(dest(output));
}

function browserSyncServe(cb) {
  browserSync.init({
    server: {
      baseDir: output,
    },
    ghostMode: false, // mirrors browser actions across devices
    open: true, // prevents browser from opening automatically if set to false
  });
  cb();
}

function browserSyncReload(cb) {
  browserSync.reload();
  cb();
}

function watchTask() {
  gulp.watch(
    htmlPath,
    { interval: 1000 },
    series(htmlDevTask, browserSyncReload)
  );

  gulp.watch(jsPath, { interval: 1000 }, series(jsDevTask, browserSyncReload));

  gulp.watch(
    cssPath,
    { interval: 1000 },
    series(cssDevTask, browserSyncReload)
  );

  gulp.watch(icoPath, { interval: 1000 }, series(icoTask, browserSyncReload));

  gulp.watch(
    imagePath,
    { interval: 1000 },
    series(imageTask, browserSyncReload)
  );

  gulp.watch(wasmPath, { interval: 1000 }, series(wasmTask, browserSyncReload));
}

// Production Tasks
function jsTask() {
  return src([jsPath, "!node_modules"])
    .pipe(webpack(require("./webpack.prod.js")))
    .pipe(dest(output));
}

function cleanTask() {
  return del([`${output}**/*`]);
}

function htmlTask() {
  return src([htmlPath])
    .pipe(htmlmin({ collapseWhitespace: true, removeComments: true }))
    .pipe(
      cachebust({
        type: "timestamp",
      })
    )
    .pipe(gulp.dest(output));
}

function cssTask() {
  return src([cssPath + ".scss", cssPath + ".css"])
    .pipe(sourcemaps.init())
    .pipe(webpack(require("./webpack.prod.js")))
    .pipe(dest(output));
}

// BUILD Web Production
exports.default = series(
  parallel(cleanTask, jsTask, cssTask, icoTask, imageTask, wasmTask),
  htmlTask
);

// BUILD Web Development
exports.watch = series(
  parallel(jsDevTask, cssDevTask, htmlDevTask, icoTask, imageTask, wasmTask),
  browserSyncServe,
  watchTask
);
