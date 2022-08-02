"use strict";

// https://gist.github.com/noraj/007a943dc781dc8dd3198a29205bae04
import gulp from "gulp";
const { src, task, series, parallel, dest } = gulp;
import sourcemaps from "gulp-sourcemaps";
import browserSync from "browser-sync";
import webpack from "webpack-stream";
import { deleteAsync as del } from "del";
import htmlmin from "gulp-htmlmin";
import cachebust from "gulp-cache-bust";

import webpackProd from "./webpack.prod.js";
import webpackDev from "./webpack.dev.js";

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
    .pipe(webpack(webpackProd))
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
    .pipe(webpack(webpackDev))
    .pipe(dest(output));
}

function htmlDevTask() {
  return src([htmlPath]).pipe(gulp.dest(output));
}

function cssDevTask() {
  return src([cssPath + ".scss", cssPath + ".css"])
    .pipe(sourcemaps.init())
    .pipe(webpack(webpackDev))
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
    .pipe(webpack(webpackProd))
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
    .pipe(webpack(webpackProd))
    .pipe(dest(output));
}

// BUILD Web Production
task(
  "default",
  series(
    parallel(cleanTask, jsTask, cssTask, icoTask, imageTask, wasmTask),
    htmlTask
  )
);

// BUILD Web Development
task(
  "watch",
  series(
    parallel(jsDevTask, cssDevTask, htmlDevTask, icoTask, imageTask, wasmTask),
    browserSyncServe,
    watchTask
  )
);
