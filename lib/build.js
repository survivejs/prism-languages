"use strict";
var fs = require("fs");
var path = require("path");
var glob = require("glob");
var async = require("async");

var COMPONENTS_PATH = "node_modules/prismjs/components/";

main();

function main() {
  glob(COMPONENTS_PATH + "*.js", {}, function(err, files) {
    if (err) {
      return console.error(err);
    }
    files = files.filter(function(file) {
      // skip jsx given we use a custom file for that
      if (file.indexOf("jsx") >= 0) {
        return false;
      }

      // skip minified and core
      return file.indexOf(".min.js") === -1 && file.indexOf("-core.") === -1;
    });

    // prism doesn't maintain any dependency information so we need to define
    // some by hand... without this the build will fail to work
    files = reorder(files, [
      "clike",
      "csharp",
      "aspnet",
      "c",
      "cpp",
      "d",
      "dart",
      "fsharp",
      "glsl",
      "groovy",
      "haxe",
      "nginx",
      "kotlin",
      "bison",
      "django",
      "javascript",
      "markup",
      "parser",
      "markdown",
      "pug",
      "handlebars",
      "actionscript",
      "coffeescript",
      "ruby",
      "haml",
      "crystal",
      "css",
      "css-extras",
      "less",
      "wiki",
      "http",
      "php",
      "php-extras",
      "processing",
      "pure",
      "sass",
      "scss",
      "smarty",
    ]);

    // XXX: JSON support. once the pr gets merged, this can be removed
    files.push(path.join(__dirname, "./json.js"));

    // use custom JSX - this needs to be after dart...
    files.splice(
      files.indexOf(COMPONENTS_PATH + "prism-dart.js"),
      0,
      path.join(__dirname, "./jsx.js")
    );

    async.map(
      files,
      function(file, cb) {
        fs.readFile(
          file,
          {
            encoding: "utf-8",
          },
          cb
        );
      },
      function(err, data) {
        if (err) {
          return console.error(err);
        }

        var code = ["var Prism = require('prismjs');\n"]
          .concat(data)
          .concat("Prism.languages.json5 = Prism.languages.json;")
          .concat("delete Prism.languages.extend;\n")
          .concat("delete Prism.languages.insertBefore;\n")
          .concat("module.exports = Prism.languages;\n")
          .join("");

        fs.writeFile("./index.js", code, function(err) {
          if (err) {
            return console.error(err);
          }
        });
      }
    );
  });
}

function reorder(files, priority) {
  var priorityFiles = priority.map(function(p) {
    return COMPONENTS_PATH + "prism-" + p + ".js";
  });

  return priorityFiles.concat(
    files.filter(function(file) {
      return priorityFiles.indexOf(file) === -1;
    })
  );
}
