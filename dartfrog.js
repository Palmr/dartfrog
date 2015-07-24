var gui = require('nw.gui');



// Make global references to the window methods. Needed for CodeMirror which expects to be running
// in a browser context but is currently called from node
global.document = window.document;
global.navigator = window.navigator;
global.getComputedStyle = window.getComputedStyle;

require('CodeMirror/mode/sql/sql');
require('CodeMirror/mode/xml/xml');
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
    runQuery(statement.trim(), function(results){dfl.populateResultGrid(results, 'results', false);});
  }
  else {
    console.log("No statement found under the cursor?");
  }
}

function runUpdateUnderCurrentCursor() {
  var statement = getStatementUnderCursor(editor);
  if (statement && statement.trim().length > 0) {
    runUpdate(statement.trim(), function(rowCount){console.log(rowCount);});
  }
  else {
    console.log("No statement found under the cursor?");
  }
}

function runExplianPlanUnderCurrentCursor() {
  var statement = getStatementUnderCursor(editor);
  if (statement && statement.trim().length > 0) {
    jdbc.open(function(err, conn) {
      if (conn) {
        jdbc.execute("EXPLAIN PLAN FOR " + statement.trim(), function(err) {
          if (err) {
            console.error("execute", err);
          }

          jdbc.executeQuery("select plan_table_output from table(dbms_xplan.display())", function(err, results) {
            if (err) {
              console.error("runQuery", err);
            }
            else if (results) {
              dfl.populateResultGrid(results, 'results', false);
            }

            jdbc.close(function(err) {
              if(err) {
                console.log("run-close", err);
                alert("Error: Failed to close connection after running query!");
              }
            });
          });
        });
      }
    });
  }
  else {
    console.log("No statement found under the cursor?");
  }
}