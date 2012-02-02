// tools for common Komodo extension chores
xtk.load('chrome://coffeescriptcompiler/content/toolkit.js');

xtk.load('chrome://coffeescriptcompiler/content/coffee-script.js');

/**
 * Namespaces
 */
if (typeof(extensions) === 'undefined') extensions = {};
if (typeof(extensions.coffeescript) === 'undefined') extensions.coffeescript = { version : '1.1.0' };

(function() {
	var self = this;

	var prefs = Components.classes["@mozilla.org/preferences-service;1"]
        .getService(Components.interfaces.nsIPrefService).getBranch("extensions.coffeescript.");

	if (typeof ko.notifications !== 'undefined') {
		var msgLevels = {
			INFO : Components.interfaces.koINotification.SEVERITY_INFO,
			WARNING : Components.interfaces.koINotification.SEVERITY_WARNING,
			ERROR : Components.interfaces.koINotification.SEVERITY_ERROR
		};
	} else {
		// Komodo console in Output Window
		xtk.load('chrome://coffeescriptcompiler/content/konsole.js');

		var msgLevels = {
			INFO : msgLevels.INFO,
			WARNING : konsole.S_WARNING,
			ERROR : konsole.S_ERROR
		};
	}

	this.compileFile = function(showWarning) {
		showWarning = showWarning || false;

		var d = ko.views.manager.currentView.document || ko.views.manager.currentView.koDoc,
			file = d.file,
			path = (file) ? file.URI : null;

		if (!file) {
			self._log('Please save the file first', msgLevels.ERROR, 'Did you mean to compile the buffer?');
			return;
		}

		if (d.language == 'CoffeeScript') {
			self._log('Compiling CoffeeScript into Javascript', msgLevels.INFO);

			var output = this._compile(d.buffer),
				newFilename = path.replace('.coffee', '.js');

			if (output) {
				self._saveFile(newFilename, output);
			}
		} else {
			if (showWarning) {
				self._log('Not a CoffeeScript file', msgLevels.WARNING);
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
			var file = Components
				.classes["@activestate.com/koFileEx;1"]
				.createInstance(Components.interfaces.koIFileEx);
			file.path = filepath;

			file.open('w');

			file.puts(filecontent);
			file.close();

			self._log('File saved as: ' + filepath, msgLevels.INFO);
		} catch(e) {
			self._log('Error saving file', msgLevels.ERROR, e.message);
		}

		return;
	};

	this._compile = function(text) {
		try {
			return CoffeeScript.compile(text, {
				bare: prefs.getBoolPref('bare')
			});
		} catch(e) {
			self._log('Error parsing CoffeeScript', msgLevels.ERROR, e.message);
			return false;
		}
	};

	this._log = function(message, style, extra) {
		extra = extra || '';

		if (style == msgLevels.ERROR || prefs.getBoolPref('showMessages')) {
			if (typeof ko.notifications !== 'undefined') {
				ko.notifications.add(message, ['CoffeeScript Compiler'], 'coffeescript' + (new Date().getTime()), {
					severity : style,
					description : extra
				});
			} else {
				konsole.popup();
				konsole.writeln('[CoffeeScript] ' + message + extra, style);
			}
		}
	};
}).apply(extensions.coffeescript);
