// tools for common Komodo extension chores
xtk.load('chrome://coffeescriptcompiler/content/toolkit.js');
// Komodo console in Output Window
xtk.load('chrome://coffeescriptcompiler/content/konsole.js');

xtk.load('chrome://coffeescriptcompiler/content/coffee-script.js');

/**
 * Namespaces
 */
if (typeof(extensions) === 'undefined') extensions = {};
if (typeof(extensions.coffeescript) === 'undefined') extensions.coffeescript = { version : '1.0.0' };

(function() {
	var self = this;

	var prefs = Components.classes["@mozilla.org/preferences-service;1"]
        .getService(Components.interfaces.nsIPrefService).getBranch("extensions.coffeescript.");

	this.compileFile = function(showWarning) {
		showWarning = showWarning || false;

		var d = ko.views.manager.currentView.document || ko.views.manager.currentView.koDoc,
			file = d.file,
			path = (file) ? file.URI : null;

		if (!file) {
			self._log('Please save the file first', konsole.S_ERROR);
			return;
		}

		if (file.ext == '.coffee') {
			self._log('Compiling CoffeeScript into Javascript', konsole.S_DEBUG);

			var output = this._compile(d.buffer),
				newFilename = path.replace('.coffee', '.js');

			if (output) {
				self._saveFile(newFilename, output);
				self._log('File saved', konsole.S_OK);
			}
		} else {
			if (showWarning) {
				self._log('Not a CoffeeScript file', konsole.S_ERROR);
			}
		}
	};

	this.compileBuffer = function() {
		var d = ko.views.manager.currentView.document || ko.views.manager.currentView.koDoc,
			output = this._compile(d.buffer);

		if (output) {
			d.buffer = output;
		}
	};

	this.compileSelection = function() {
		var view = ko.views.manager.currentView,
			scimoz = view.scintilla.scimoz;
			text = scimoz.selText;

			var output = this._compile(text);

			if (output) {
				scimoz.targetStart = scimoz.currentPos;
				scimoz.targetEnd = scimoz.anchor;
				scimoz.replaceTarget(output.length, output);
			}
	};

	this._saveFile = function(filepath, filecontent) {
		try {
			self._log('Saving file as ' + filepath, konsole.S_DEBUG);

			var file = Components
				.classes["@activestate.com/koFileEx;1"]
				.createInstance(Components.interfaces.koIFileEx);
			file.path = filepath;

			file.open('w');

			file.puts(filecontent);
			file.close();
		} catch(e) {
			self._log('Error saving file', konsole.S_ERROR);
		}

		return;
	};

	this._compile = function(text) {
		try {
			return CoffeeScript.compile(text, {
				bare: prefs.getBoolPref('bare')
			});
		} catch(e) {
			self._log('Error parsing CoffeeScript: ' + e.message, konsole.S_ERROR);
			return false;
		}
	};

	this._log = function(message, style) {
		if (style == konsole.S_ERROR || prefs.getBoolPref('showMessages')) {
			konsole.popup();
			konsole.writeln('[CoffeeScript] ' + message, style);
		}
	};
}).apply(extensions.coffeescript);
