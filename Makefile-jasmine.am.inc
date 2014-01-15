## Include this makefile fragment into your Makefile.am. It is meant to be used
## when the eos-jasmine repo is included as a submodule of another repo. Make
## sure to set JASMINE_SUBMODULE_PATH to the path of the Jasmine submodule in
## your source tree. Then add your test scripts to TESTS.
##
## Also make sure EXTRA_DIST, TEST_EXTENSIONS, and AM_JS_LOG_FLAGS are defined
## before including this fragment.

EXTRA_DIST += \
    $(JASMINE_SUBMODULE_PATH)/eos-jasmine-run \
    $(JASMINE_SUBMODULE_PATH)/jasminegjsbootstrap.js \
    $(JASMINE_SUBMODULE_PATH)/EndlessConsoleReporter.js \
    $(JASMINE_SUBMODULE_PATH)/EndlessTimer.js \
    $(JASMINE_SUBMODULE_PATH)/lib/jasmine-core/jasmine.js \
    $(JASMINE_SUBMODULE_PATH)/Makefile-jasmine.am.inc \
    $(NULL)

TEST_EXTENSIONS += .js
JS_LOG_COMPILER = $(JASMINE_SUBMODULE_PATH)/eos-jasmine-run
AM_JS_LOG_FLAGS += --include-path=$(JASMINE_SUBMODULE_PATH)
