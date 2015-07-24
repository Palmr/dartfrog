
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
        console.error("runQuery", err);
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

function runUpdate(query, callback) {
  jdbc.open(function(err, conn) {
  if (conn) {
    jdbc.executeUpdate(query, function(err, rowCount) {
      if (err) {
        console.error("runUpdate", err);
      }
      else if (rowCount) {
        jdbc.commit(function (err) {
          if (err) {
            console.error("Failed to commit?", err);
          }
          else {
            callback(rowCount);
          }

          jdbc.close(function(err) {
            if(err) {
              console.log("run-close", err);
              alert("Error: Failed to close connection after running update!");
            }
          });
        });
      }
    });
  }
});
}

function getTableMetaData(tableName, callback) {
  jdbc.open(function(err, conn) {
  if (conn) {
    jdbc.getTableMetaData(tableName, function(err, results) {
      if (err) {
        console.error("getTableMetaData", err);
      }
      else if (results) {
        callback(results);
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