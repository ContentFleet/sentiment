/**
 * AFINN-based sentiment analysis for Node.js
 *
 * @package sentiment
 * @author Andrew Sliwinski <andrewsliwinski@acm.org>
 */

/**
 * Dependencies
 */
var extend = require('extend-object');
var assert = require('assert');
var negations = require('../build/negation');

/**
 * Tokenizes an input string.
 *
 * @param {String} Input
 *
 * @return {Array}
 */
function tokenize (input) {
  return input
    .replace(/[^äöüÄÖÜßa-zA-Z- ]+/g, '')
    .replace(/-/g, ' ')
    .replace('/ {2,}/',' ')
    .toLowerCase()
    .split(' ');
}

/**
 * Performs sentiment analysis on the provided input "phrase".
 *
 * @param {String} Input phrase
 * @param {Object} Optional sentiment additions to AFINN (hash k/v pairs)
 *
 * @return {Object}
 */
module.exports = function (phrase, options, callback) {
  // Parse arguments
  if (typeof phrase === 'undefined') phrase = '';
  if (typeof options === 'undefined') options = null;
  if (typeof options === 'function') callback = options;
  if (typeof callback === 'undefined') callback = null;

  options = options || {};
  var lang = options.lang || 'en';

  var negationList = negations[lang] || [];
  var afinn = {};

  if (!options.strict) {
    try {
      var filename = ['AFINN', lang, 'json'].join('.');
      afinn = require('../build/' + filename);
    } catch (e) {
      throw new Error('Language \'' + lang + '\' not supported.');
    }
  }

  if (options.category) {
    assert.equal(typeof options.category, 'string',
      "property 'options.category' must be a string");
    try {
      filename = ['AFINN', options.category, lang, 'json'].join('.');
      var categoryData = require('../build/' + filename);
      afinn = extend(afinn, categoryData);
    } catch (e) {
      throw new Error("Category '" + options.category + "' for language '" +
        lang + "' not supported.");
    }
  }

  // Merge
  if (options.inject) {
    assert.equal(typeof options.inject, 'object',
      "property 'options.inject' must be an object.");
    afinn = extend(afinn, options.inject);
  }

  // Storage objects
  var tokens      = tokenize(phrase),
      score       = 0,
      words       = [],
      positive    = [],
      negative    = [],
      negation    = [];

  // Find negations
  var len = tokens.length;
  while (len--) {
    var obj = tokens[len];
    if (negationList.indexOf(obj) !== -1) {
      negation.push(obj);
    }
  }

  // Iterate over tokens
  // TODO: Treat negations...for the moment we skip analysis if we've found any negation words
  if (!negation.length) {
    len = tokens.length;
    while (len--) {
      var obj = tokens[len];
      if (negationList.indexOf(obj) !== -1) {
        negation.push(obj);
      }
      var item = afinn[obj];
      if (!afinn.hasOwnProperty(obj)) continue;

      words.push(obj);
      if (item > 0) positive.push(obj);
      if (item < 0) negative.push(obj);

      score += item;
    }
  }

  // Handle optional async interface
  var result = {
    score: score,
    comparative: score / tokens.length,
    tokens: tokens,
    words: words,
    positive: positive,
    negative: negative,
    negation: negation
  };

  if (callback === null) return result;
  process.nextTick(function () {
    callback(null, result);
  });
};
