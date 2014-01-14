const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Lang = imports.lang;

var _jasmineRequire = imports.lib['jasmine-core'].jasmine;
var jasmineRequire = _jasmineRequire.getJasmineRequireObj();
var jasmine = jasmineRequire.core(jasmineRequire);

const Timer = imports.EndlessTimer;

var env = jasmine.getEnv();

function getBaseNameAndLineNumber() {
    // The familiar hack to get the current line, though we want the
    // second line since we're actually inside of _getBaseNameAndLineNumber ->
    // jasmineInterface
    const error = new Error();
    const lines = error.stack.split('\n');
    const lineString = lines[2];
    const lineStringBasenameIndex = lineString.lastIndexOf('/') + 1;
    const lineStringLinenumberIndex = lineString.lastIndexOf(':');
    const baseName = lineString.slice(lineStringBasenameIndex, lineStringLinenumberIndex);

    const fileBaseName = lineString.slice(lineString.lastIndexOf('/') + 1, lineStringLinenumberIndex);
    const lineNumber = lineString.slice(lineStringLinenumberIndex + 1, lineString.length);

    return {
        baseName: fileBaseName,
        lineNumber: lineNumber
    };
};

var jasmineInterface = {
    describe: function (description, specDefinitions) {
        let suite = env.describe(description, specDefinitions);
        Lang.copyProperties(getBaseNameAndLineNumber(), suite.result);
        return suite;
    },

    xdescribe: function (description, specDefinitions) {
        let suite = env.xdescribe(description, specDefinitions);
        Lang.copyProperties(getBaseNameAndLineNumber(), suite.result);
        return suite;
    },

    it: function (desc, func) {
        let spec = env.it(desc, func);
        Lang.copyProperties(getBaseNameAndLineNumber(), spec.result);
        return spec;
    },

    xit: function (desc, func) {
        let spec = env.xit(desc, func);
        Lang.copyProperties(getBaseNameAndLineNumber(), spec.result);
      return spec;
    },

    beforeEach: function (beforeEachFunction) {
        return env.beforeEach(beforeEachFunction);
    },

    afterEach: function (afterEachFunction) {
        return env.afterEach(afterEachFunction);
    },

    expect: function (actual) {
        return env.expect(actual);
    },

    spyOn: function (obj, methodName) {
        return env.spyOn(obj, methodName);
    },

    jsApiReporter: new jasmine.JsApiReporter({
        timer: new jasmine.Timer()
    })
};

Lang.copyProperties(jasmineInterface, window); // window is the GJS equivalent of global.
window.jasmine = jasmine;

jasmine.addCustomEqualityTester = function (tester) {
    env.addCustomEqualityTester(tester);
};

jasmine.addMatchers = function (matchers) {
    return env.addMatchers(matchers);
};

jasmine.clock = function () {
    return env.clock;
};
