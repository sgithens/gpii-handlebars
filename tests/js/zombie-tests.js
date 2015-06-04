// Test client-side modules from within a simulated browser.
//
// The client-side template handling requires a server to provide the template content.
"use strict";
var fluid = fluid || require("infusion");
var gpii  = fluid.registerNamespace("gpii");
var path  = require("path");

var jqUnit  = fluid.require("jqUnit");
var Browser = require("zombie");

require("gpii-express");

require("../../");

// Test content (HTML, JS, templates)
var testDir    = path.resolve(__dirname, "..");
var contentDir = path.join(testDir, "html");
var viewDir    = path.join(testDir, "views");

// Dependencies
var bcDir      = path.resolve(__dirname, "../../bower_components");
var modulesDir = path.resolve(__dirname, "../../node_modules");

// Main source to be tested
var srcDir     = path.resolve(__dirname, "../../src");


fluid.registerNamespace("gpii.handlebars.tests.zombieTests");

// All tests should look for rendered content as well as variables, jsonify content, and markdown content
gpii.handlebars.tests.zombieTests.commonTests = function (that, element, $) {
    jqUnit.assertNotNull("The results should not be null.", element.html());

    var mdRegexp = /<p><em>this works<\/em><\/p>/i;
    jqUnit.assertNotNull("The results should contain transformed markdown.", element.html().match(mdRegexp));

    var variableRegexp = new RegExp(that.options.expected.myvar);
    jqUnit.assertNotNull("The results should contain variable data.", element.html().match(variableRegexp));

    var jsonString = element.find(".jsonify").html();
    var outputData = JSON.parse(jsonString);

    jqUnit.assertDeepEq("The output should match the model...", that.options.expected.json, outputData);

    // Tests for the "equals" helper
    var equalCandidates = element.find(".equal");
    for (var a = 0; a < equalCandidates.length; a++) {
        var equalCandidate = equalCandidates[a];
        jqUnit.assertEquals("All 'equal' comparisons should end up displaying 'true'.", "true", $(equalCandidate).text());
    }

    var unequalCandidates = element.find(".unequal");
    for (var b = 0; b < unequalCandidates.length; b++) {
        var unequalCandidate = unequalCandidates[b];
        jqUnit.assertEquals("All 'unequal' comparisons should end up displaying 'false'.", "false", $(unequalCandidate).text());
    }
};

gpii.handlebars.tests.zombieTests.runTests = function (that) {
    var browser = Browser.create();

    jqUnit.module("Integration tests for combined client and server-side template handling...");

    jqUnit.asyncTest("Use zombie.js to test client-side template output...", function () {
        browser.on("error", function (error) {
            jqUnit.start();
            jqUnit.fail("There should be no errors:" + error);
        });
        browser.visit(that.options.config.express.baseUrl + "content/client-tests.html").then(function () {
            // The client side has already manipulated a bunch of stuff by the time we see it, we're just inspecting the results.
            jqUnit.start();

            // Testing the "after" DOM-manipulation function
            var afterElement = browser.window.$(".viewport-after");
            jqUnit.assertTrue("An element with content inserted after it should not have changed.", "original content", afterElement.text());
            var nextElement = afterElement.next();
            jqUnit.assertTrue("Content should be inserted after the original element.", nextElement.html().indexOf("from the partial") !== -1);
            gpii.handlebars.tests.zombieTests.commonTests(that, nextElement, browser.window.$);

            // Testing the "append" DOM-manipulation function
            var appendElement = browser.window.$(".viewport-append");
            var appendRegexp = /^original content/;
            jqUnit.assertNotNull("The original text should be at the beginning of the results", appendElement.html().match(appendRegexp));
            gpii.handlebars.tests.zombieTests.commonTests(that, appendElement, browser.window.$);

            // Testing the "before" DOM-manipulation function
            var beforeElement = browser.window.$(".viewport-before");
            jqUnit.assertEquals("An element with content inserted before it should not have changed.", "original content", beforeElement.text());
            var elementInsertedBefore = beforeElement.prev();
            gpii.handlebars.tests.zombieTests.commonTests(that, elementInsertedBefore, browser.window.$);

            // Testing the "html" DOM-manipulation function
            var htmlElement = browser.window.$(".viewport-html");
            jqUnit.assertTrue("An element updated with the html method should not contain the original text", htmlElement.text().indexOf("original content") === -1);
            gpii.handlebars.tests.zombieTests.commonTests(that, htmlElement, browser.window.$);

            // Testing the "prepend" DOM-manipulation function
            var prependElement = browser.window.$(".viewport-prepend");
            var prependRegexp = /original content$/;
            jqUnit.assertNotNull("The original text should be at the beginning of the results.", prependElement.text().match(prependRegexp));
            gpii.handlebars.tests.zombieTests.commonTests(that, prependElement, browser.window.$);

            // Testing the "replaceWith" DOM-manipulation function
            var replaceWithElement = browser.window.$(".viewport-html");
            jqUnit.assertTrue("An element updated with the replaceWith method should not contain the original text", replaceWithElement.text().indexOf("original content") === -1);
            gpii.handlebars.tests.zombieTests.commonTests(that, replaceWithElement, browser.window.$);
        });
    });
};

/*

 jqUnit.asyncTest("Testing 'prepend' function...", function () {
 "viewport-prepend":     ".viewport-prepend",

 jqUnit.start();
 jqUnit.assertTrue("The updated element should contain the original text", element.html().indexOf("original content") !== -1);

 var prependRegexp = /original content$/;
 jqUnit.assertNotNull("The original text should be at the end of the results", element.html().match(prependRegexp));

 gpii.handlebars.tests.zombieTests.commonTests(that, element);
 });
 */

fluid.defaults("gpii.handlebars.tests.zombieTests", {
    gradeNames: ["gpii.express", "autoInit"],
    // This is "expected" data that must match the model data found in client-tests.js
    expected: {
        myvar:    "modelvariable",
        markdown: "*this works*",
        json:     { foo: "bar", baz: "quux", qux: "quux" }
    },
    config:  {
        "express": {
            "port" :   6994,
            "baseUrl": "http://localhost:6994/",
            "views":   viewDir
        }
    },
    components: {
        inline: {
            type: "gpii.express.hb.inline",
            "options": {
                "path": "/hbs"
            }
        },
        bc: {
            type: "gpii.express.router.static",
            "options": {
                path:    "/bc",
                content: bcDir
            }
        },
        js: {
            type: "gpii.express.router.static",
            "options": {
                path:    "/src",
                content: srcDir
            }
        },
        tests: {
            type: "gpii.express.router.static",
            "options": {
                path:    "/tests",
                content: testDir
            }
        },
        modules: {
            type: "gpii.express.router.static",
            "options": {
                path:    "/modules",
                content: modulesDir
            }
        },
        content: {
            type: "gpii.express.router.static",
            "options": {
                path:    "/content",
                content: contentDir
            }
        },
        handlebars: {
            type: "gpii.express.hb"
        }
    },
    listeners: {
        "{express}.events.onStarted": {
            funcName: "gpii.handlebars.tests.zombieTests.runTests",
            args:     ["{that}"]
        }
    }
});

gpii.handlebars.tests.zombieTests();