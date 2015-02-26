const Gio = imports.gi.Gio;
const Mainloop = imports.mainloop;
const System = imports.system;

/* We define our own console reporter here, because the default one is not very useful */
const EndlessConsoleReporter = function () {

    var noopTimer = {
        start: function () {},
        elapsed: function () { return 0; }
    };

    function EndlessConsoleReporter(options) {
        var print = options.print,
            showColors = options.showColors || false,
            onComplete = options.onComplete || function () {},
            timer = options.timer || noopTimer,
            specCount,
            failureCount,
            failedSpecs = [],
            pendingCount,
            suiteLevel = 0,
            ansi_escape = '\x1B',
            ansi_csi = ansi_escape + '[',
            ansi = {
                green: '32m',
                red: '31m',
                yellow: '33m',
                gray: '37m',
                none: '0m'
            },
            ansi_modifiers = {
                bold: '1;',
                underline: '4;',
                none: ''
            };

        this.jasmineStarted = function () {
            specCount = 0;
            failureCount = 0;
            pendingCount = 0;
            print('Started');
            printNewline();
            timer.start();
        };

        this.jasmineDone = function () {
            printNewline();
            for (var i = 0; i < failedSpecs.length; i++) {
                specFailureDetails(failedSpecs[i]);
            }

            printNewline();
            var specCounts = specCount + ' ' + plural('spec', specCount) + ', ' +
                failureCount + ' ' + plural('failure', failureCount);

            if (pendingCount) {
                specCounts += ', ' + pendingCount + ' pending ' + plural('spec', pendingCount);
            }

            print(specCounts);

            printNewline();
            var seconds = timer.elapsed() / 1000;
            print('Finished in ' + seconds + ' ' + plural('second', seconds));

            printNewline();

            onComplete(failureCount === 0);
        };

        this.suiteStarted = function (result) {
          suiteLevel++;

          if (suiteLevel > 1) {
              printNewline();
          }

          const description = result.description;
          const fileDescription = ' (in ' + result.baseName + ')';

          if (result.disabled == 'disabled') {
              print(indent(colored('yellow', 'none', '[DISABLED] ' + description), suiteLevel));
          } else {
              print(indent(colored('gray', 'bold', description), suiteLevel));
          }
          print(fileDescription);
          printNewline();
        };

        this.suiteDone = function (result) {
            suiteLevel--;
            printNewline();
        };

        this.specDone = function (result) {
            specCount++;

            let description = result.description;
            let fileDescription = ' (in ' + result.baseName + ':' + result.lineNumber + ')';

            if (result.status == 'pending') {
                pendingCount++;
                print(indent(colored('yellow', 'none', ' - [PENDING] ' + description), suiteLevel));
            }

            if (result.status == 'passed') {
                print(indent(colored('green', 'bold', ' - [PASSED ] ' + description), suiteLevel));
            }

            if (result.status == 'failed') {
                failureCount++;
                failedSpecs.push(result);
                print(indent(colored('red', 'bold', ' - [FAILED ] ' + description), suiteLevel));
            }

            print(fileDescription);
            printNewline();
        };

        function printNewline() {
            print('\n');
        }

        function colored(color, type, str) {
            return showColors ? (ansi_csi + ansi_modifiers[type] + ansi[color] + str + ansi_csi + ansi.none) : str;
        }

        function plural(str, count) {
            return count == 1 ? str : str + 's';
        }

        function repeat(thing, times) {
            var arr = [];
            for (var i = 0; i < times; i++) {
                arr.push(thing);
            }
            return arr;
        }

        function indent(str, spaces) {
            var lines = (str || '').split('\n');
            var newArr = [];
            for (var i = 0; i < lines.length; i++) {
                newArr.push(repeat(' ', spaces).join('') + lines[i]);
            }
            return newArr.join('\n');
        }

        function only(str, n) {
            var lines = (str || '').split('\n');
            lines = lines.slice(0, n);
            return lines.join('\n');
        }

        function findIndexOfFailingSpecInStack(stack) {
            let lines = stack.split('\n');
            for (let index = 0; index < lines.length; index++) {
                const indexOfJasmineJS = lines[index].indexOf('jasmine.js');
                if (indexOfJasmineJS === -1) {
                    return index;
                }
            }

            throw new Error ('Expected to find a stack frame that did not end with jasmine.js');
        }

        function lineForIndex(stack, index) {
            let lines = stack.split('\n');
            return lines[index];
        }

        function specFailureDetails(result) {
            printNewline();
            print(colored('red', 'bold', result.fullName));

            for (var i = 0; i < result.failedExpectations.length; i++) {
                var failedExpectation = result.failedExpectations[i];
                printNewline();
                printNewline();
                let failedExpectationIndex = findIndexOfFailingSpecInStack(failedExpectation.stack);
                print(indent(colored('none',
                                     'none',
                                     lineForIndex(failedExpectation.stack,
                                                  failedExpectationIndex)),
                             suiteLevel + 2));
                printNewline();
                print(indent(colored('gray', 'bold', failedExpectation.message), suiteLevel + 2));
                printNewline();
                printNewline();

                print(indent(only(failedExpectation.stack, 10), suiteLevel + 4));
            }
        }

        return this;
    }

    return EndlessConsoleReporter;
};

const FD_STDOUT = 1;

let _fdstream = new Gio.UnixOutputStream({
    fd: FD_STDOUT,
    close_fd: false
});
let _stdout = new Gio.DataOutputStream({
    base_stream: _fdstream
});
let defaultConsoleReporter = (EndlessConsoleReporter())({
    showColors: true,
    print: function (str) {
        _stdout.put_string(str, null);
    },
    timer: new jasmine.Timer(),
    onComplete: function (success) {
        _stdout.close(null);

        if (success === false)
            System.exit(1);
        else
            Mainloop.quit("jasmine");
    }
});
