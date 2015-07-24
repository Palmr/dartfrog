
// When things are breaking at the very start, force the dev tools to load at startup
var gui = require('nw.gui');
gui.Window.get().showDevTools();


// Make global references to the window methods. Needed for CodeMirror which expects to be running 
//   in a browser context but is currently called from node
global.document = window.document;
global.navigator = window.navigator;
global.getComputedStyle = window.getComputedStyle;

require('CodeMirror/mode/sql/sql');
var CodeMirror = require('CodeMirror/lib/codemirror');

var editor = CodeMirror.fromTextArea(document.getElementById("code"), {
  mode: 'text/x-plsql',
  lineWrapping: true,
  extraKeys: {
    'Ctrl-Space': 'autocomplete'
  },
  lineNumbers: true,
  theme: 'monokai'
});
global.editor = editor;
