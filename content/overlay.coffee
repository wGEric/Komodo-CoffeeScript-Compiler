###
Copyright (C) 2012 Eric Faerber

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
###

xtk.load 'chrome://coffeescriptcompiler/content/coffee-script.js'

ko.extensions ?= {}
ko.extensions.coffeescript = do () ->
	@version = '2.0.0'

	# preferences
	prefs = Components.classes["@mozilla.org/preferences-service;1"]
        .getService(Components.interfaces.nsIPrefService).getBranch("extensions.coffeescript.")

	# message levels
	if ko.notifications
		# komodo 7+ so use the notifications area
		msgLevels =
			INFO : Components.interfaces.koINotification.SEVERITY_INFO
			WARNING : Components.interfaces.koINotification.SEVERITY_WARNING
			ERROR : Components.interfaces.koINotification.SEVERITY_ERROR

	else
		# load the konsole script to write to the output
		xtk.load 'chrome://coffeescriptcompiler/content/konsole.js'

		msgLevels =
			INFO : konsole.S_OK
			WARNING : konsole.S_WARNING
			ERROR : konsole.S_ERROR

	###
	compiles the current file
	###
	@compileFile = (filepath = null, showWarning = false) =>
		@_removeLog()

		# if filepath is a boolean then it is really the showWarning variable
		if typeof filepath is "boolean"
			showWarning = filepath
			filepath = null

		# setup the variables, either get them from the external file or from the current document
		unless filepath is null
			file = @_getFile filepath
			file.open 'r'
			contents = file.readfile()
		else
			# get the current document
			d = @_getCurrentDoc()
			file = d.file
			contents = d.buffer

		# make sure there is a file. If there isn't, it hasn't been saved
		unless file
			@_log 'Please save the file first', msgLevels.ERROR, 'Did you mean to compile the buffer?'
			return false

		# make sure it is a coffee script file
		if file.ext == '.coffee'
			output = @_compile(contents);

			if output
				path = file.URI
				newFilename = path.replace '.coffee', '.js'

				status = @_saveFile newFilename, output

				if @_checkUglify()
					@_uglifyFile newFilename

				return status
		else if showWarning
			@_log 'Not a CoffeeScript file', msgLevels.ERROR

		return false

	###
	compiles the current buffer
	###
	@compileBuffer = () =>
		@_removeLog()

		d = @_getCurrentDoc()

		output = @_compile(d.buffer) # compile the coffeescript

		unless output is false
			d.buffer = output
			return true

		false

	###
	compiles the current selection
	###
	@compileSelection = () =>
		@_removeLog()

		view = ko.views.manager.currentView
		scimoz = view.scintilla.scimoz
		text = scimoz.selText
		output = this._compile(text);

		if output
			scimoz.targetStart = scimoz.currentPos;
			scimoz.targetEnd = scimoz.anchor;
			scimoz.replaceTarget output.length, output;
			return true

		false

	###
	gets the current document
	###
	@_getCurrentDoc = () =>
		ko.views.manager.currentView.document or ko.views.manager.currentView.koDoc

	###
	reads an external file
	###
	@_getFile = (filepath) =>
		reader = Components
				.classes["@activestate.com/koFileEx;1"]
				.createInstance Components.interfaces.koIFileEx

		reader.path = filepath
		reader

	###
	compiles a string
	###
	@_compile = (text) =>
		try
			output = CoffeeScript.compile text, {
				bare: prefs.getBoolPref 'bare'
			}
		catch e
			@_log 'Error parsing CoffeeScript', msgLevels.ERROR, e.message

		output || false

	###
	saves a file
	###
	@_saveFile = (filepath, filecontent) =>
		try
			@._log 'Saving file as: ' + filepath, msgLevels.INFO
			file = Components
				.classes["@activestate.com/koFileEx;1"]
				.createInstance Components.interfaces.koIFileEx

			file.path = filepath

			file.open 'w'

			file.puts filecontent
			file.close()

			@_log 'File saved as: ' + filepath, msgLevels.INFO
		catch e
			@._log 'Error saving file', msgLevels.ERROR, e.message
			return false

		true

	###
	removes entry from the notifications
	###
	@_removeLog = () =>
		if not prefs.getBoolPref('showMessages') and ko.notifications and @notification
			ko.notifications.remove @notification

		true

	###
	checks to see if uglify is enabled, installed and the correct version
	###
	@_checkUglify = () =>
		if prefs.getBoolPref('uglify') and ko.extensions.uglifyjs
			uglifyVer = ko.extensions.uglifyjs.version or ''
			uglifyVer = uglifyVer.split '.'

			if uglifyVer[0] < 2
				@_log 'UglifyJS needs to be version 2.0.0 or higher', msgLevels.WARNING
				return false

			return true

		false

	###
	uglifies a file
	###
	@_uglifyFile = (filepath) =>
		ko.extensions.uglifyjs.compressFile filepath

	###
	writes to the log
	###
	@_log = (msg, level = msgLevels.INFO, description = '') =>
		# only show a message if it is an error or the preference has been set for it
		if level is msgLevels.ERROR or prefs.getBoolPref 'showMessages'
			if ko.notifications
				noteId = unless prefs.getBoolPref 'showMessages' then 'coffeescript' else 'coffeescript' + (new Date().getTime())
				# komodo 7+ notifications
				@notification = ko.notifications.add msg, ['CoffeeScript Compiler'], noteId, {
					severity : level,
					description : description
				}
			else
				# konsole
				unless description is ''
					description = ': ' + description

				konsole.popup()
				konsole.writeln '[CoffeeScript] ' + msg + description, level
		true

	@

# legacy support
extensions ?= {}
extensions.coffeescript = ko.extensions.coffeescript;
