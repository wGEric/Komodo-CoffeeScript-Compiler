/**
 * Konsole - Komodo console in Output Window
 *
 * @fileoverview
 *
 * Allows to output formatted text into Command Output tab of Komodo
 *
 * @version 2.0
 * @author Adam Łyskawa
 *
 * Copyright (c) 2012, Adam Łyskawa
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * Redistributions of source code must retain the above copyright notice,
 * this list of conditions and the following disclaimer.
 * Redistributions in binary form must reproduce the above copyright
 * notice, this list of conditions and the following disclaimer in the
 * documentation and/or other materials provided with the distribution.
 * Neither the name of  nor the names of its contributors may be used to
 * endorse or promote products derived from this software without specific
 * prior written permission.

 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
 * ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
 * POSSIBILITY OF SUCH DAMAGE.
 */

/**
 * Command Output tab tool
 * To code with style, and use styles :)
 */
var konsole = {

    version         : '2.0',

    S_DEFAULT       : 0,
    S_STRONG        : 1,
    S_OK            : 2,
    S_NOTICE        : 3,
    S_WARNING       : 4,
    S_ERROR         : 5,
    S_DEBUG         : 6,
    S_HINT          : 7,
    S_CUSTOM        : 8,

    C_BACKGROUND : 0xFFFFFF,
    C_GUTTER : 0xCCE7F7,

    /**
     * Console style definitions
     * @type array [ [RGB Color, Bold, Italic], ... ]
     */
    styles : [
        [0x000000, 0, 0], [0x000000, 1, 0], [0x007700, 1, 0], [0x777777, 1, 0],
        [0xFFAA00, 1, 0], [0xCC0000, 1, 0], [0x0055AA, 1, 0], [0xAAAAAA, 0, 0],
        [0x555555, 0, 0], [0xFF5555, 1, 0], [0x55FF55, 0, 0], [0xFFFF55, 0, 0],
        [0x5555FF, 0, 0], [0xFF55FF, 0, 0], [0x55FFFF, 0, 0], [0x000000, 1, 0]
    ],
    /**
     * @type Document
     */
    document : null,
    /**
     * Command Output scintilla editor object
     * @type Components.interfaces.ISciMoz
     */
    scimoz : null,
    /**
     * Newline sequence used: CRLF, LF or CL
     * @type string
     */
    NL : null,
    /**
     * Initializes scimoz object and defines basic "terminal" styles
     */
    init : function() {
        this.document = window.parent ? window.parent.document : window.document;
        var self = this, runoutputScintilla, runoutputContentDocument;
        runoutputScintilla = this.document.getElementById('runoutput-scintilla'); // Komodo 6 style
        if (!runoutputScintilla) { // Komodo 7 style
            runoutputContentDocument = this.document.getElementById("runoutput-desc-tabpanel").contentDocument;
            runoutputScintilla = runoutputContentDocument.getElementById("runoutput-scintilla");
        }
        var BGR = function(RGB) {
            return ((RGB & 0xff0000) >> 0x10) +
                    (RGB & 0x00ff00) +
                    ((RGB & 0x0000ff) << 0x10);
        };
        this.scimoz = runoutputScintilla.scimoz;
        this.NL = ["\r\n", "\n", "\r"][this.scimoz.eOLMode];
        this.scimoz.lexer = 0; // no lexer please, it's a humble terminal thingie
        this.scimoz.styleBits = 8; // for moar styles
        this.scimoz.caretLineVisible = false;
        this.scimoz.caretStyle = 2;
        this.scimoz.caretFore = BGR(0xff8800);
        this.scimoz.caretPeriod = 100;
        this.scimoz.styleSetBack(this.scimoz.STYLE_DEFAULT, BGR(this.C_BACKGROUND)); // to prevent...
        this.scimoz.styleSetBack(this.scimoz.STYLE_LINENUMBER, BGR(this.C_GUTTER)); // colors from user's scheme
        for (var i in this.styles) { // apply styles from config
            this.scimoz.styleSetFore(i, BGR(this.styles[i][0]));
            this.scimoz.styleSetBack(i, this.C_BACKGROUND);
            this.scimoz.styleSetBold(i, !!this.styles[i][1]);
            this.scimoz.styleSetItalic(i, !!this.styles[i][2]);
        }
        // Following line fixes one very evil Komodo 6.x conflict, don't ask:
        addEventListener('unload', function() { self.scimoz = null; }, false);
    },
    /**
     * Pops up Command Output tab
     */
    popup : function() {
        ko.run.output.show(window, false);
        var deckWidget = this.document.getElementById('runoutput-deck');
        if (!deckWidget)
            deckWidget = this.document.getElementById("workspace_bottom_area");
        if (deckWidget.selectedIndex != 0)
            ko.run.output.toggleView();
    },
    /**
     * Clears Command Output tab content
     */
    clear : function() {
        if (!this.scimoz) this.init();
        var ro = this.scimoz.readOnly;
        this.scimoz.readOnly = false;
        this.scimoz.clearAll();
        this.scimoz.readOnly = ro;
    },
    /**
     * Writes styled text to Command Output tab
     * @param {string} text
     * @param {number} style (optional, defaults to 0)
     */
    write : function(text, style) {
        if (!this.scimoz) this.init();
        var start = this.scimoz.length;
        var ro = this.scimoz.readOnly;
        this.scimoz.readOnly = false;
        this.scimoz.appendText(ko.stringutils.bytelength(text), text);
        if (typeof(style) != 'undefined') {
            this.scimoz.startStyling(start, 0xFFFF);
            this.scimoz.setStyling(text.length, style);
        }
        this.scimoz.readOnly = ro;
        this.scimoz.gotoPos(start + 1);
    },
    /**
     * Writes styled text to Command Output tab, with newline
     * @param {string} text
     * @param {number} style (optional, defaults to 0)
     */
    writeln : function(text, style) {
        if (!this.scimoz) this.init();
        if (text) this.write(text, style);
        this.write(this.NL);
    },
    /**
     * Displays simple debug information for exception caught
     * @param {Error} exception
     */
    error : function(exception) {
        this.popup();
        this.write('ERROR: ', this.S_ERROR);
        this.write(exception.message + ' ', this.S_STRONG);
        this.writeln('in line ' +
                                 exception.lineNumber +
                                 ' of ' +
                                 exception.fileName + '.');
    }
};
