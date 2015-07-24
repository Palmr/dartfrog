
var jdbc = new (require('jdbc'));

jdbc.initialize(config, function(err, res) {
  if (err) {
    console.error("init-error", err);
		alert("Error: initialising jdbc connection!");
  }
});

global.jdbc = jdbc;

function runQuery(query, callback) {
	jdbc.open(function(err, conn) {
  if (conn) {
    jdbc.executeQuery(query, function(err, results) {
			if (err) {
				console.error("run-return", err);
				alert("Error: Failed to run query:" + err.message);
			}
			else if (results) {
				callback(results);
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

function getTableMetaData() {
	jdbc.open(function(err, conn) {
  if (conn) {
    jdbc.getTableMetaData(prompt("Which table?"), function(err, results) {
			if (err) {
				console.error("run-return", err);
				alert("Error: Failed to run getTableMetaData:" + err.message);
			}
			else if (results) {
        console.log(results);        
				dfl.populateResultGrid(results);
			}
			
			jdbc.close(function(err) {
				if(err) {
					console.log("run-close", err);
					alert("Error: Failed to close connection after running getTableMetaData!");
				}
			});
		});
  }
});
}