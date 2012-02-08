# About

Implements a [CoffeeScript](http://coffeescript.org) compiler into [Komodo](http://www.activestate.com/komodo-ide).

# Install

[Download the lastest version](https://github.com/wGEric/Komodo-CoffeeScript-Compiler/downloads) and open with Komodo or [follow these instructions](http://docs.activestate.com/komodo/6.1/tutorial/tourlet_extensions.html#tourlet_install_extension_top)

# Use

Goto to Tools -> CoffeeScript and select an option.

* _Compile Saved File_ takes a .coffee file and compiles it into javascript and saves a new file with the same name but ending in .js
* _Compile Current Buffer_ takes the contents of the current buffer and compiles it into javascript.
* _Compile Selection_ takes the current selection and compiles it into javascript.

# Macro

You can [create a macro](http://docs.activestate.com/komodo/6.1/macros.html#macros_top) that will automatically compiles a CoffeeScript file when you save. Use the following code and have it trigger _After file save_:

    if (ko.extensions.coffeescript) {
        ko.extensions.coffeescript.compileFile();
    }

# Change Log

## 2.0.0

* Addon is now written in CoffeeScript
* `ko.extensions.coffeescript.compileFile('path/to/file');` is now available
* Komodo 7 now uses the Notifications pane instead of the Command Output
* Added the option to compress the file using UglifyJS (if it is installed and at least version 2.0.0) after compiled to javascript
