var gui = require('nw.gui');
fs = require('fs');



// Make global references to the window methods. Needed for CodeMirror which expects to be running
// in a browser context but is currently called from node
global.document = window.document;
global.navigator = window.navigator;
global.getComputedStyle = window.getComputedStyle;

require('CodeMirror/addon/fold/xml-fold.js');
require('CodeMirror/addon/edit/matchtags.js');
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

var outbuffer;
function runPLSQLUnderCursor() {
  var statement = getStatementUnderCursor(editor);
  if (statement && statement.trim().length > 0) {
    jdbc.open(function(err, conn) {
      if (conn) {
        // Enable dbms_output
        jdbc.executeUpdate("begin dbms_output.enable(99999); end;", function(err, rowcount) {
          if (err) {
            console.error("dbms_output.enable", err);
          }

          // Run the PL/SQL
          jdbc.execute(statement.trim(), function(err) {
            if (err) {
              console.error("execute", err);
            }

            // Run the getter loop
            jdbc.executeUpdateWithBinds(
              "declare " +
              "    l_line varchar2(255); " +
              "    l_done number; " +
              "    l_buffer long; " +
              "begin " +
              "  loop " +
              "    exit when length(l_buffer)+255 > :maxbytes OR l_done = 1; " +
              "    dbms_output.get_line( l_line, l_done ); " +
              "    l_buffer := l_buffer || l_line || chr(10); " +
              "  end loop; " +
              " :done := l_done; " +
              " :buffer := l_buffer; " +
              "end;"
            , {"maxbytes":{"dir":"in", "type":"INTEGER", "value": 32000},
               "done":{"dir":"out", "type":"INTEGER"},
               "buffer":{"dir":"out", "type":"VARCHAR"}}
            , function(err, outbinds, rowcount) {
              if (err) {
                console.error("getting output", err);
              }

              var results = [];
              var outBufferLines = outbinds.buffer.split("\n");
              for (var line in outBufferLines){
                results.push({"DBMS_OUTPUT": {"type": "VARCHAR2", "value": outBufferLines[line]}});
              }
              dfl.populateResultGrid(results, 'results', false);

              // Disable dbms_output
              jdbc.executeUpdate("begin dbms_output.disable; end;", function(err, rowcount) {
                if (err) {
                  console.error("dbms_output.disable", err);
                }

                // close connection
                jdbc.close(function(err) {
                  if(err) {
                    console.log("run-close", err);
                    alert("Error: Failed to close connection after running query!");
                  }
                });
              });
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
              console.error("executeQuery", err);
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

function showTableSchemaBrowserView(tableName) {
  // I could get the rowid from the JDBC ResultSet ideally and put that on the row object, rather than mangling the query (that may also enable editing from simple selects in the editor tab)
  var columnNames = "rowid";
  currentTableMetadata = null;
  getTableMetaData(tableName, function (metadataResults) {
    currentTableMetadata = metadataResults;
    for (var c = 0; c < currentTableMetadata.columns.length; c++) {
      columnNames += ", " + currentTableMetadata.columns[c].name;
      dfl.populateTableMetadataview(currentTableMetadata);
    }
  });

  setTimeout(function() {
  runQuery("SELECT " + columnNames + " FROM " + tableName, function(results){
    currentTableData = results;
    dfl.populateResultGrid(currentTableData, 'tableContents', true);
  });
  }, 100);
}

function toadMode() {
  $("#feelsbad").show();
  alert("Unexpected error occurred");
  alert("Pepe has become unresponsive");
  alert("Error: No error");
  alert("Hope you saved your work!");
  alert("Pepe.exe has encountered a serious error and needs to shut down");
  var win = gui.Window.open('bsod.html', {
    "toolbar": false,
    fullscreen: true
  });
  $("#feelsbad").hide();
}

function formatEditorSQL() {
  var formattedEditor = '';
  var statements = editor.getValue().split(/^\/$/m);
  for (var s = 0; s < statements.length; s++) {
    formattedEditor += vkbeautify.sql(statements[s]) + "\r\n/\r\n\r\n";
  }
  editor.setValue(formattedEditor);
}