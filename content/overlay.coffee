xtk.load 'chrome://coffeescriptcompiler/content/toolkit.js'
xtk.load 'chrome://coffeescriptcompiler/content/coffee-script.js'

extensions ?= {}
extensions.coffeescript = do () ->
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
	@compileFile = (showWarning = false) =>
		@_removeLog()

		# get the current document
		d = @_getCurrentDoc()
		file = d.file

		# make sure there is a file. If there isn't, it hasn't been saved
		unless file
			@_log 'Please save the file first', msgLevels.ERROR, 'Did you mean to compile the buffer?'
			return false

		# make sure it is a coffee script file
		if d.language is 'CoffeeScript' or file.ext == '.coffee'
			output = @_compile(d.buffer) # compile the coffeescript


			if output
				path = file.URI
				newFilename = path.replace '.coffee', '.js'
				return @_saveFile newFilename, output
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
