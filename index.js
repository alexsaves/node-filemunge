var path = require('path'),
  fs = require('fs'),
  pjson = require('./package.json'),
  JSZip = require('jszip');

/**
 * File munger
 * @param src
 */
var munger = function (src) {
  var ctx = this;
  this.src = src;
  this._files = [];
  this._walk(src, function (filename, contents) {
    ctx._files.push({
      filename: filename,
      contents: contents
    });
  });
};

/**
 * Walk a directory
 * @param cb
 * @param fldr
 * @private
 */
munger.prototype._walk = function (dir, cb) {
  var ctx = this;
  var list = fs.readdirSync(dir);
  for (var i = 0; i < list.length; i++) {
    var file = list[i];
    if (!file) {
      return;
    }
    if (file.indexOf('.DS_Store') > -1) {
      continue;
    } else {
      file = dir + '/' + file;
      var stat = fs.statSync(file);
      if (stat && stat.isDirectory()) {
        ctx._walk(file, cb);
      } else {
        var adjustedfilename = file + '';
        if (adjustedfilename.substr(0, ctx.src.length) == ctx.src) {
          adjustedfilename = adjustedfilename.substr(ctx.src.length);
          if (adjustedfilename.substr(0, 1) == '/' || adjustedfilename.substr(0, 1) == '\\') {
            adjustedfilename = adjustedfilename.substr(1);
          }
        }
        cb(adjustedfilename, fs.readFileSync(file));
      }
    }
  }
};

/**
 * Iterate all the files.
 * @param cb
 */
munger.prototype.iterateSync = function (cb) {
  for (var i = 0; i < this._files.length; i++) {
    var fl = this._files[i];
    var res = cb(fl.filename, fl.contents);
    if (res === false) {
      this._files.splice(i--, 1);
    } else if (res) {
      if (!(res instanceof Buffer)) {
        throw new Error("Contents must be a Buffer type.");
      }
      fl.contents = res;
    }
  }
};

/**
 * Iterate all the files (asynchronous)
 * @param cb
 */
munger.prototype.iterate = function (cb) {
  process.nextTick(function () {
    this.iterateSync(cb);
  }.bind(this));
};

/**
 * Add a file to the list
 * @param filename
 * @param contents
 */
munger.prototype.addFile = function (filename, contents) {
  if (!(contents instanceof Buffer)) {
    throw new Error("Contents must be a Buffer type.");
  }
  this._files.push({
    filename: filename,
    contents: contents
  });
};

/**
 * Convert the files to a zip
 */
munger.prototype.toZipBuffer = function (cb) {
  if (!cb) {
    throw new Error("File Munge - toZipBuffer needs a callback.");
  } else {
    var zip = new JSZip();

    this.iterateSync(function (filename, contents) {
      zip.file(filename, contents);
    });

    zip.generateAsync({type: "nodebuffer", compression: "DEFLATE", level: 9}).then(function (buffer) {
      cb(buffer);
    });
  }
};

// Expose the interface
module.exports = munger;