var gui = require('nw.gui');



// Make global references to the window methods. Needed for CodeMirror which expects to be running 
// in a browser context but is currently called from node
global.document = window.document;
global.navigator = window.navigator;
global.getComputedStyle = window.getComputedStyle;

require('CodeMirror/mode/sql/sql');
var CodeMirror = require('CodeMirror/lib/codemirror');
