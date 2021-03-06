/*

    A handlebars helper that interpolates variable content into i18n/l10n message strings and produces string output.

    See the docs for details: https://github.com/GPII/gpii-handlebars/blob/master/docs/i18n.md

 */
/* eslint-env node */
"use strict";
var fluid  = fluid || require("infusion");
var gpii   = fluid.registerNamespace("gpii");

fluid.registerNamespace("gpii.handlebars.helper.messageHelper");

gpii.handlebars.helper.messageHelper.getHelper = function () {
    return function (messageKey, dataOrRootContext, rootContext) {
        if (arguments.length < 2) {
            fluid.fail("You must call the 'messageHelper' helper with at least a message key.");
        }
        else {
            // Pick up the message bundles from the root context, which is always the last argument.
            var messages = fluid.get(rootContext || dataOrRootContext, "data.root.messages");

            // If we have a third argument, then the second argument is our "data".  Otherwise, we use the root context (equivalent to passing "." as the variable).
            var data = rootContext ? dataOrRootContext : fluid.get(dataOrRootContext, "data.root");
            var resolver = fluid.messageResolver({ messageBase: messages });
            return resolver.resolve(messageKey, data);
        }
    };
};

fluid.defaults("gpii.handlebars.helper.messageHelper", {
    gradeNames: ["gpii.handlebars.helper"],
    helperName: "messageHelper",
    invokers: {
        "getHelper": {
            "funcName": "gpii.handlebars.helper.messageHelper.getHelper",
            "args":     ["{that}"]
        }
    }
});
