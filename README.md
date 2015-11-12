node-filemunge
===================
Node toolkit for recursively working with entire file trees.
###Installation &nbsp;  [![npm version](https://badge.fury.io/js/filemunge.svg)](http://badge.fury.io/js/filemunge)
```sh
npm install filemunge
```
Filemunge lets you recursively (and synchronously) crawl a folder, iterate over the files, change them (without writing them back to the file system), add new ones, and then use this list of files for other purposes.
This is handy if you need to put a bunch of files into S3 or into a ZIP file, but need to modify some of them first, and you don't want to write anything back to the file system.
The constructor takes one argument (the folder path).
```javascript
var munge = require('filemunge');

var myfiles = new munge('./dist');
myfiles.addFile('somefile.txt', new Buffer('some text'));

myfiles.iterateSync(function (filename, contents) {
  if (filename.indexOf('.js') > -1) {
    contents = contents.toString();
    contents = contents.replace(/hello world/gi, 'some other text');
    return new Buffer(contents);
  }
  // Note: you can also remove a file here by returning false
});
myfiles.iterateSync(function (filename, contents) {
  // upload to s3
});
```