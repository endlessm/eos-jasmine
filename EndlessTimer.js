const GLib = imports.gi.GLib;
const Mainloop = imports.mainloop;
const System = imports.system;

function quitMainLoopOnException(fn) {
    try {
        fn();
    } catch (e) {
        Mainloop.quit();
        System.exit(1);
    }
}

function _setTimeoutInternal(fn, time, continueTimeout) {
    let id = GLib.timeout_add(GLib.PRIORITY_DEFAULT, time, function () {
        quitMainLoopOnException(fn);
        return continueTimeout;
    });

    return {
        timeoutId: id
    };
}

window.setTimeout = function (fn, time) {
    return _setTimeoutInternal(fn, time, false);
};

window.setInterval = function (fn, time) {
    return _setTimeoutInternal(fn, time, true);
};

window.clearTimeout = window.clearInterval = function (id) {
    if (typeof (id) !== 'object' ||
        !Object.hasOwnProperty(id, 'timeoutId'))
        return;

    if (id.timeoutId > 0) {
        GLib.source_remove(id.timeoutId);
        id.timeoutId = 0;
    }
};

window.timer = null;
