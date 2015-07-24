var gui = require('nw.gui');



// Make global references to the window methods. Needed for CodeMirror which expects to be running 
// in a browser context but is currently called from node
global.document = window.document;
global.navigator = window.navigator;
global.getComputedStyle = window.getComputedStyle;

require('CodeMirror/mode/sql/sql');
var CodeMirror = require('CodeMirror/lib/codemirror');


function getStatementUnderCursor(codeMirrorEditor) {
  var cursor = codeMirrorEditor.getCursor();
  var statements = codeMirrorEditor.getValue().split(/^\/$/m);
  var statementLineCountSum = 0;
  var focusedStatement;
  for (var s = 0; s < statements.length; s++) {
    statementLineCountSum += statements[s].split(/\r*\n/).length;
    if (statementLineCountSum > cursor.line) {
      return statements[s];
    }
  }
}

function runStatementUnderCursor() {
  var statement = getStatementUnderCursor(editor);
  if (statement && statement.trim().length > 0) {
    runQuery(statement.trim(), function(results){dfl.populateResultGrid(results);});
  }
  else {
    console.log("No statement found under the cursor?");
  }
}