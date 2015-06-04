"use strict";
// Base gradeName for handlebars "helper" modules, which can be used on both the client and server side handlebars stacks.
var fluid = fluid || require("infusion");
var gpii  = fluid.registerNamespace("gpii");
fluid.registerNamespace("gpii.templates.hb.helper");

// Each "helper" module is expected to replace the `getHelper` invoker with an invoker that returns a helper function, something like the following:
//
//your.namespace.moduleName.exampleFunction = function(that){
//    return function(arg1, arg2) {
//        // The two argument variations have the "options" object as the second argument.  one-argument variations have it as the first.
//        var options = arg2 ? arg2 : arg1;
//        return options.fn(this);
//    };
//};
//
// See http://handlebarsjs.com/block_helpers.html for an overview of the various types of helper functions that are possible.
//
// Once you have a module and function, you would then replace getHelper using an invoker definition like:
//
//     invokers: {
//      "getHelper": {
//          "funcName": "your.namespace.moduleName.exampleFunction",
//          "args":     ["{that}"]
//      }
//    }

gpii.templates.hb.helper.checkForName = function (that, message) {
    if (!that.options || !that.options.helperName) {
        fluid.fail(message);
    }
};

fluid.defaults("gpii.templates.hb.helper", {
    gradeNames: ["fluid.eventedComponent", "fluid.modelRelayComponent", "autoInit"],
    invokers: {
        getHelper: {
            funcName: "fluid.fail",
            args:     ["You must implement getHelper in your grade before it will function properly as a helper."]
        }
    },
    listeners: {
        "onCreate.checkForName": {
            funcName: "gpii.templates.hb.helper.checkForName",
            args:       ["{that}", "Your component must have a helperName option to be used as a helper."]
        }
    }
});