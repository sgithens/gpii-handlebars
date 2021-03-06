(function () {
    "use strict";

    // A test fixture to use in exercising the serverMessageAware grade.
    fluid.defaults("gpii.tests.templateAware.serverMessageAware", {
        gradeNames: ["gpii.handlebars.templateAware.serverMessageAware"],
        template:   "serverMessageAware",
        selectors: {
            initial: "" // Update the whole container
        },
        model: {
            condition: "working",
            deep: {
                condition: "better"
            }
        },
        invokers: {
            renderInitialMarkup: {
                func: "{that}.renderMarkup",
                args: [ "initial", "{that}.options.template", "{that}.model", "html"]
            }
        }
    });
})();
