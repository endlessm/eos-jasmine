#!/usr/bin/env gjs

const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Mainloop = imports.mainloop;

imports.searchPath.unshift('.');
const JasmineGJS = imports.jasminegjsbootstrap;
const Reporter = imports.EndlessConsoleReporter;
const Timer = imports.EndlessTimer;

function forEachFileInDirectory(directory, action) {
    let enumerator = directory.enumerate_children('standard::*',
                                                  Gio.FileQueryInfoFlags.NONE,
                                                  null);

    let file = enumerator.next_file(null);
    while (file) {
        let type = file.get_file_type();
        let fileName = file.get_name();

        if (type == Gio.FileType.DIRECTORY) {
            action.recurse(directory, fileName, forEachFileInDirectory);
        } else {
            let isTestOrSpec = fileName.indexOf('test') !== -1 ||
                               fileName.indexOf('Spec') !== -1;
            if (fileName.endsWith('.js') && isTestOrSpec) {
                action.perform(fileName);
            }
        }

        file = enumerator.next_file (null);
    }
}

function RecursiveImportAction() {
}

RecursiveImportAction.prototype = Object.create(Object.prototype, {
    prependPath: {
        value: '',
        writable: true
    },
    recurse: {
        value: function (parent, filename, recurseInto) {
            let pathAddition = '/' + filename;
            this.prependPath += pathAddition;
            recurseInto (parent.get_child(filename),
                         this);
            this.prependPath = this.prependPath.substring(0, this.prependPath.length - pathAddition.length);
        }
    }
});

function executeSpecs(suites, baseDir) {
    window.jasmine = jasmine;
    window.j$ = jasmine;
    // TODO: This is bad, the Jasmine tests should be testing two separate copies
    // of the library!

    function ImportSuiteAction(suite) {
        this.prependPath = suite;
    }

    ImportSuiteAction.prototype = Object.create(RecursiveImportAction.prototype, {
        perform: {
            value: function (filename) {
                imports.searchPath.unshift(this.prependPath);
                let importName = filename.substring(0, filename.length - 3);
                let Module = imports[importName];
                imports.searchPath.shift();
            }
        },
    });

    suites.forEach(function (suite) {
        let suiteImportPath = suite;
        let suiteDirectory = suite;
        if (baseDir.length > 0) {
            suiteDirectory = GLib.build_filenamev([baseDir, suiteDirectory]);
            suiteImportPath = GLib.build_filenamev([baseDir, suite]);
        }

        let action = new ImportSuiteAction(suiteImportPath);
        forEachFileInDirectory(Gio.file_new_for_path(suiteDirectory),
                               action);
    });

    let env = jasmine.getEnv();
    env.catchExceptions(false);
    env.addReporter(Reporter.defaultConsoleReporter);

    GLib.idle_add(GLib.PRIORITY_DEFAULT, function () {
        Timer.quitMainLoopOnException(env.execute);
        return false;
    }, null);

    Mainloop.run("jasmine");
}

function _bootstrap(jasmineDir) {
    var exported = {},
        j$req;

    function getJasmineRequireObj() {
        return exported;
    }
    window.getJasmineRequireObj = getJasmineRequireObj;

    j$req = imports.src.core.requireCore;
    extend(j$req, imports.src.console.requireConsole);
    let outputObjects = [];
    let currentDirectory = Gio.file_new_for_path(jasmineDir).get_child('src');

    function ImportSourcesAction() {
        this.prependPath = currentDirectory.get_path();
    }

    ImportSourcesAction.prototype = Object.create(RecursiveImportAction.prototype, {
        outputObjects: {
            value: [],
            writable: true
        },
        perform: {
            value: function (filename) {
                imports.searchPath.unshift(this.prependPath);
                this.outputObjects.push(imports[filename.substring(0, filename.length - 3)]);
                imports.searchPath.shift();
            }
        }
    });

    let importSourcesAction = new ImportSourcesAction();
    forEachFileInDirectory(currentDirectory, importSourcesAction);
    outputObjects = importSourcesAction.outputObjects;

    // TODO: Figure out what outputObjects is doing and why it needs to be eval'd
    // Also, where is exported coming from in the line below this one?
    Lang.copyProperties(exported, j$req);
    delete window.getJasmineRequireObj;

    return j$req;
}

var j$require = {};
function bootstrap(jasmineDir) {
    j$require = _bootstrap(jasmineDir);
}

let suites = [];
let path = '.';

ARGV.forEach(function (arg) {
  switch (arg) {
    case '--performance':
      suites.push('performance');
      path = 'spec';
      break;
    case '--selftest':
      suites.push('core');
      path = 'spec';
      break;
    default:
      suites.push(arg);
      break;
  }
});

executeSpecs(suites, path); // Requires no parameters due to hardcoded values.
