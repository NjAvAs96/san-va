const { src, dest, watch, series, parallel } = require("gulp");
const autoprefixer = require("autoprefixer");
const consolidate = require('gulp-consolidate');
const cssnano = require("cssnano");
const concat = require("gulp-concat");
const postcss = require("gulp-postcss");
const sass = require('gulp-sass')(require('sass'));
const sourcemaps = require("gulp-sourcemaps");
const gulpTerser = require("gulp-terser");
const terser = require("terser");
const browserSync = require("browser-sync").create();
const reload = browserSync.reload;
const iconfont = require("gulp-iconfont");
const gulpStylelint = require("gulp-stylelint");

// File path
const files = {
	htmlPath: "src/*.html",
	assPath: "src/assets/**/*",
	scssPath: "src/scss/**/*.scss",
	jsPath: "src/js/**/*.js",
	iconsPath: "src/assets/svg/icons/**/*.svg",
	iconsTemplate: "src/iconfont-template/iconfont.scss",
	iconFont: "src/scss/pugins/_icon-font.scss",
	robotsPath: "./robots.txt",
};

// Copy HTML TASK
function copyHTML() {
	return src(files.htmlPath).pipe(dest("dist"));
}

// Copy Assets TASK
function copyAss() {
	return src(files.assPath).pipe(dest("dist/assets"));
}

exports.copyAss = copyAss;

// Sass TASK
function scssTask() {
	return src(files.scssPath)
		.pipe(sourcemaps.init())
		.pipe(sass())
		.pipe(postcss([autoprefixer(), cssnano()]))
		.pipe(sourcemaps.write("."))
		.pipe(dest("dist/style/"));
}

// JS TASK
function jsTask() {
	return src(files.jsPath)
		.pipe(concat("global.min.js"))
		.pipe(gulpTerser({}, terser.minify))
		.pipe(dest("dist/js/"));
}

// Icon TASK
function iconTask() {
	return src(files.iconsPath)
		.pipe(
			iconfont({
				fontName: 'iconsfont',
				formats: ['ttf', 'eot', 'woff', 'woff2'],
				appendCodepoints: true,
				appendUnicode: false,
				normalize: true,
				fontHeight: 1000,
				centerHorizontally: true
			})
		)
		.on("glyphs", function (glyphs, options) {
			src('src/iconfont-template/iconfont.scss').pipe(
				consolidate('lodash', {
					glyphs: glyphs,
					fontName: options.fontName,
					fontDate: new Date().getTime()
				})).pipe(dest('src/scss/layout'));
			}).pipe(dest('dist/assets/fonts/icons'));
}

exports.iconTask = iconTask;


// Lint TASK
function lintScss() {
	return src("src/scss**/*.scss").pipe(
		gulpStylelint({
			reporters: [{ formatter: "string", console: true }],
		})
	);
}

// Robots.txt TASK

function robotsTask() {
	return src(files.robotsPath).pipe(dest("dist"));
}

exports.robotsTask = robotsTask;

// Watch TASK
function watchTask() {
	watch(
		[files.htmlPath, files.scssPath, files.jsPath],
		parallel(copyHTML, scssTask, jsTask, lintScss),
		browserSync.init({
			server: {
				baseDir: "./dist/",
			},
		})
	).on("change", reload);
}

// Default TASK
exports.default = series(
	parallel(copyHTML, copyAss, scssTask, jsTask, iconTask),
	watchTask
);
