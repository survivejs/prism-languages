'use strict';
var fs = require('fs');
var path = require('path');
var glob = require('glob');
var async = require('async');

main();

function main() {
  var componentsPath = 'node_modules/prismjs/components/';

  glob(componentsPath + '*.js', {}, function(err, files) {
    if(err) {
      return console.error(err);
    }
    files = files.filter(function(file) {
      // RangeError: Maximum call stack size exceeded
      if(file.indexOf('prism-aspnet') >= 0) {
        return false;
      }

      // skip minified and core
      return file.indexOf('.min.js') === -1 && file.indexOf('-core.') === -1;
    });

    // XXX: not in npm... -> consume github version instead?
    files.push(path.join(__dirname, './makefile.js'));

    // XXX: JSON support. once the pr gets merged, this can be removed
    files.push(path.join(__dirname, './json.js'));

    async.map(files, function(file, cb) {
      fs.readFile(file, {
        encoding: 'utf-8'
      }, cb);
    }, function(err, data) {
      if(err) {
        return console.error(err);
      }

      var code = ['var Prism = require(\'prismjs\');\n'].
        concat(data).
        concat('delete Prism.languages.extend;\n').
        concat('delete Prism.languages.insertBefore;\n').
        concat('module.exports = Prism.languages;\n').
        join('');

      fs.writeFile('./index.js', code, function(err) {
        if(err) {
          return console.error(err);
        }
      });
    });
  });
}
