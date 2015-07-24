var jdbc = new (require('jdbc'));

var config = {
  libpath: 'jars/ojdbc6-11.2.0.4.jar',
  libs: ['jars/xdb6-11.2.0.4.jar', 'jars/xmlparserv2-11.2.0.3.jar'],
  drivername: 'oracle.jdbc.driver.OracleDriver',
  url: 'jdbc:oracle:thin:@foxbox.fivium.local:1521:foxref1',
  user: 'foxmgr',
  password: 'dev',
};


jdbc.initialize(config, function(err, res) {
  console.log("init callback");
  if (err) {
    console.error("init-error", err);
  }
  console.log("init-success", res);
});

var genericQueryHandler = function(err, results) {
  console.log("genericQueryHandler-callback", err, results);
  if (err) {
    console.error(err);
  } else if (results) {
    console.log(results);
  }
  
  jdbc.close(function(err) {
    if(err) {
      console.log(err);
    } else {
      console.log("Connection closed successfully!");
    }
  });
 
};
 
jdbc.open(function(err, conn) {
  console.log("open-pre", err, conn);
  if (conn) {
    console.log("select-exec");
    // SELECT statements are called with executeQuery 
    jdbc.executeQuery("SELECT fe.environment_key, fe.engine_config.getClobVal() FROM foxmgr.fox_environments fe", genericQueryHandler);
  }
});