/*

    Functions to assist in internationalising and localising content.

*/
/* eslint-env node */
"use strict";
var fluid = require("infusion");
var gpii  = fluid.registerNamespace("gpii");

var fs = require("fs");
var path = require("path");
var JSON5 = require("json5");

require("./resolver");

fluid.registerNamespace("gpii.handlebars.i18n");

/**
 *
 * Derive a single message bundle from all available languages and locales, based on the `Accept-Language` headers
 * passed as part of `request`.  Returns a combination of all messages found matching the following:
 *
 * 1. The user's locale.
 * 2. The user's language.
 * 3. The default locale.
 *
 * @param {Object} request - An express request object: http://expressjs.com/en/4x/api.html#req
 * @param {Object} messageBundles - The full set of all message bundles available, keyed by locale or language.
 * @param {String} defaultLocale - The default locale.
 * @return {Object} - A map of messages for a single locale.
 *
 */
gpii.handlebars.i18n.deriveMessageBundleFromRequest = function (request, messageBundles, defaultLocale) {
    var header = fluid.get(request, "headers.accept-language");
    return gpii.handlebars.i18n.deriveMessageBundleFromHeader(header, messageBundles, defaultLocale);
};

/**
 *
 * Load our all message bundles from one or more directories and organise them into a single object.
 *
 * @param {Array} messageDirs - An array of full or package-relative paths to directories containing message bundles.
 * @param {String} defaultLocale - The default locale to use for files that do not provide language or locale data.
 * @return {Object} - A combined bundle of message bundles, keyed by locales and languages.
 *
 */
gpii.handlebars.i18n.loadMessageBundles = function (messageDirs, defaultLocale) {
    defaultLocale = defaultLocale || "en_us";
    var messageBundles = {};
    var resolvedMessageDirs = gpii.express.hb.resolveAllPaths(messageDirs);

    var filesByLocale   = {};
    var filesByLanguage = {};

    fluid.each(resolvedMessageDirs, function (messageDir) {
        var resolvedPath = fluid.module.resolvePath(messageDir);
        try {
            var files = fs.readdirSync(resolvedPath);
            fluid.each(files, function (filename) {
                var fullPath = path.resolve(resolvedPath, filename);
                var matchesLocale = filename.toLowerCase().match(/.+[-_]([a-z]{2}[-_][a-z]{2})\.json5?/);
                var matchesLanguage = filename.toLowerCase().match(/.+[-_]([a-z]{2})\.json5?/);

                if (matchesLocale) {
                    var preferredLocale = matchesLocale[1];
                    fluid.pushArray(filesByLocale, preferredLocale, fullPath);
                }
                else if (matchesLanguage) {
                    var preferredLanguage = matchesLanguage[1];
                    fluid.pushArray(filesByLanguage, preferredLanguage, fullPath);
                }
                else {
                    fluid.pushArray(filesByLocale, defaultLocale, fullPath);
                }
            });
        }
        catch (error) {
            fluid.log("Error loading directory '", resolvedPath, "':", error);
        }
    });

    // Load all locales, propagating data back to the language as well.
    fluid.each(filesByLocale, function (files, locale) {
        fluid.each(files, function (fullPath) {
            var data = JSON5.parse(fs.readFileSync(fullPath, "utf8"));
            messageBundles[locale] = fluid.extend(true, messageBundles[locale], data);

            // Add any unique material from the locale to the language, taking care to prefer existing language data.
            var languageFromLocale = gpii.handlebars.i18n.languageFromLocale(locale);
            messageBundles[languageFromLocale] = fluid.extend(true, messageBundles[languageFromLocale], data);
        });
    });

    // Load all languages, overwriting any data inherited from locales.
    fluid.each(filesByLanguage, function (files, language) {
        fluid.each(files, function (fullPath) {
            var data = JSON5.parse(fs.readFileSync(fullPath, "utf8"));
            messageBundles[language] = fluid.extend(true, messageBundles[language], data);
        });
    });

    return messageBundles;
};

fluid.registerNamespace("gpii.handlebars.i18n.messageLoader");

gpii.handlebars.i18n.messageLoader.loadMessageBundles =  function (that) {
    var messageBundles = gpii.handlebars.i18n.loadMessageBundles(that.options.messageDirs, that.options.defaultLocale);

    gpii.handlebars.utils.deleteAndAddModelData(that, "messageBundles", messageBundles);

    that.events.onMessagesLoaded.fire(that);
};

gpii.handlebars.i18n.messageLoader.deriveMessagesFromBundlesAndLocale = function (that) {
    var messages = gpii.handlebars.i18n.deriveMessageBundle(that.model.locale, that.model.messageBundles, that.options.defaultLocale);
    that.applier.change("messages", messages);
};

fluid.defaults("gpii.handlebars.i18n.messageLoader", {
    gradeNames: ["fluid.modelComponent"],
    defaultLocale: "en_us",
    mergePolicy: {
        messageDirs: "nomerge"
    },
    messageDirs: [],
    model: {
        locale: "{that}.options.defaultLocale",
        messages: {},
        messageBundles: {}
    },
    events: {
        onMessagesLoaded: null
    },
    listeners: {
        "onCreate.loadMessages": {
            funcName: "gpii.handlebars.i18n.messageLoader.loadMessageBundles",
            args:     ["{that}"]
        }
    },
    modelListeners: {
        "locale": {
            excludeSource: "init",
            funcName:      "gpii.handlebars.i18n.messageLoader.deriveMessagesFromBundlesAndLocale",
            args:          ["{that}"]
        },
        "messageBundles": {
            excludeSource: "init",
            funcName:      "gpii.handlebars.i18n.messageLoader.deriveMessagesFromBundlesAndLocale",
            args:          ["{that}"]
        }
    }
});
