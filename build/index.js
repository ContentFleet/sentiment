/**
 * Converts raw AFINN data to JSON hash table.
 *
 * @package sentiment
 * @author Andrew Sliwinski <andrew@diy.org>
 */

/**
 * Dependencies
 */
var async   = require('async'),
    fs      = require('fs'),
    path    = require('path');


var files = fs.readdirSync(__dirname);

files.forEach(function(file) {
  if(path.extname(file) !== ".txt") {
    return;
  }
  /**
   * Read AFINN data from original format
   */
  fs.readFile(__dirname + '/' + file, function (err, data) {
    // Storage object
    var hash = new Object(null);

    // Split lines
    var lines = data.toString().split(/\n/);
    async.forEach(lines, function (obj, callback) {
      var item = obj.split(/\t/);
      hash[item[0]] = Number(item[1]);
      callback();
    }, function (err) {
      if (err) throw new Error(err);

      // Write out JSON
      fs.writeFile(
          __dirname + '/' + file.replace('txt', 'json'),
        JSON.stringify(hash, null, 2),
        function (err) {
          if (err) throw new Error(err);
          console.log('Complete.');
        });
    });
  });
});