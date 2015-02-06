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
var afinn = {
  de: require('../build/AFINN.de'),
  en: require('../build/AFINN.en')
};

/**
 * Tokenizes an input string.
 *
 * @param {String} Input
 *
 * @return {Array}
 */
function tokenize (input) {
    return input
            .replace(/[^a-zA-Z- ]+/g, '')
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
module.exports = function (phrase, inject, callback) {
    // Parse arguments
    if (typeof phrase === 'undefined') phrase = '';
    if (typeof inject === 'undefined') inject = null;
    if (typeof inject === 'function') callback = inject;
    if (typeof callback === 'undefined') callback = null;

    var lang = 'en';

    // Merge
    if (inject !== null) {
        // Get special lang key from inject object and remove
        lang = inject.lang || 'en';
        delete inject.lang;
        afinn = extend(afinn, inject);
    }

    if (!afinn.hasOwnProperty(lang)) {
        throw new Error('Language \'' + lang + '\' not supported.');
    }

    // Storage objects
    var tokens      = tokenize(phrase),
        score       = 0,
        words       = [],
        positive    = [],
        negative    = [];

    // Iterate over tokens
    var len = tokens.length;
    while (len--) { 
        var obj = tokens[len];
        var i18n = afinn[lang];
        var item = i18n[obj];
        if (!i18n.hasOwnProperty(obj)) continue;

        words.push(obj);
        if (item > 0) positive.push(obj);
        if (item < 0) negative.push(obj);

        score += item;
    }

    // Handle optional async interface
    var result = {
        score:          score,
        comparative:    score / tokens.length,
        tokens:         tokens,
        words:          words,
        positive:       positive,
        negative:       negative
    };

    if (callback === null) return result;
    process.nextTick(function () {
        callback(null, result);
    });
};
