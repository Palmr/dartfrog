var gui = require('nw.gui');



// Make global references to the window methods. Needed for CodeMirror which expects to be running 
// in a browser context but is currently called from node
global.document = window.document;
global.navigator = window.navigator;
global.getComputedStyle = window.getComputedStyle;

require('CodeMirror/mode/sql/sql');
var CodeMirror = require('CodeMirror/lib/codemirror');
  
var jdbc = new (require('jdbc'));

jdbc.initialize(config, function(err, res) {
  if (err) {
    console.error("init-error", err);
		alert("Error: initialising jdbc connection!");
  }
});

global.jdbc = jdbc;
global.editor = editor;

function testJDBC() {
	jdbc.open(function(err, conn) {
  if (conn) {
    jdbc.executeQuery(editor.getValue(), function(err, results) {
			if (err) {
				console.error("run-return", err);
				alert("Error: Failed to run query:" + err.message);
			}
			else if (results) {
        dfl.populateResultGrid(results);
			}
			
			jdbc.close(function(err) {
				if(err) {
					console.log("run-close", err);
					alert("Error: Failed to close connection after running query!");

				}
			});
		});
  }
});
}