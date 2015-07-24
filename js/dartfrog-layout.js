function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
 }

var editor = null;
var schemaSelectList = '';
var currentTableMetadata;
var currentTableData;

$(function () {
  // Set up tabs
  $('#main-tabs').w2tabs({
    name: 'mainTabs',
    active: 'editor',
    tabs: [
      { id: 'editor', caption: 'Editor' },
      { id: 'schema', caption: 'Schema Browser' },
    ],
    onClick: function (event) {
      $('.mode').hide();
      $('#'+event.target).show();
      dfl.getSchemaList();
    }
  });

  //Set up editor view
  $('#editor').w2layout({
    name: 'editor',
    panels: [
      { type: 'main', content: '<button onclick="javascript:runStatementUnderCursor();">Run?</button><button onclick="javascript:getTableMetaData();">tablemetadata</button><textarea id="code">select * from dual</textarea>',  resizable: true, size: 50},
      { type: 'preview', content: 'preview', resizable: true, size: 500}
    ]
  });

  w2ui['editor'].content('preview', $().w2grid({
    name: 'results',
    header: 'Results',
    show: {
      toolbar: false,
      footer: false
    }
  }));

  editor = CodeMirror.fromTextArea(document.getElementById('code'),{
    mode: 'text/x-sql',
    indentWithTabs: true,
    smartIndent: true,
    lineNumbers: true,
    matchBrackets : true,
    autofocus: true,
    extraKeys: {
      'F9': runStatementUnderCursor
    , 'F10': runUpdateUnderCurrentCursor
    , 'F11': runExplianPlanUnderCurrentCursor
    },
  });

  //Set up schema view
  $('#schema').w2layout({
    name: 'schema',
    panels: [
      { type: 'left', size: 300, resizable: true, content: 'left' },
      { type: 'main', resizable: true ,
      onResize: function() { dfl.getSchemaList(); }}
    ],
  });

  w2ui['schema'].content('left',$().w2layout({
    name: 'sidebar',
    panels: [
      {type: 'top', content: schemaSelectList, size: 25},
      {type: 'main', content: 'main'},
    ]
  }));

  w2ui['sidebar'].content('main',$().w2sidebar({
    name: 'objectList',
    img: null,
    nodes: [{id: 'xxx', text: 'xxx', expanded: true, nodes: Array()}],
    onClick: function (event) {
      var tableName = $('#schema-select').val()+"."+event.target;
      var columnNames = "rowid";
      currentTableMetadata = null;
      getTableMetaData(tableName, function (metadataResults) {
        currentTableMetadata = metadataResults;
        for (var c = 0; c < currentTableMetadata.columns.length; c++) {
          columnNames += ", " + currentTableMetadata.columns[c].name;
        }
      });

      setTimeout(function() {
      runQuery("SELECT " + columnNames + " FROM " + tableName, function(results){
        currentTableData = results;
        dfl.populateResultGrid(currentTableData, 'tableContents', true);
      });
      }, 100);
    }
  }));

  $('body').on('change','#schema-select',function() {
    dfl.getTableList();
  });

  w2ui['schema'].content('main', $().w2grid({
    name: 'tableContents',
    header: 'Table',
    show: {
      toolbar: false,
      footer: false
    },
    onClick: function(event) {
      console.log(event);
      var column = currentTableMetadata.columns[event.column];
      
      runQuery("SELECT " + column.name + " FROM " + currentTableMetadata.table_name + " WHERE rowid = '" + event.recid + "'", function(results){
        w2popup.open({
          title   : 'Edit ' + column.name + ' on ' + currentTableMetadata.table_name,
          body    : '<textarea id="editorCM">' + escapeHtml(results[0][column.name].value) + '</textarea>',
          buttons : '<button disabled="disabled">Save</button><button onClick="javascript:w2popup.close();">Commit</button>',
          showClose: false,
          modal: true
        });
        
        CodeMirror.fromTextArea(document.getElementById('editorCM'),{
          mode: 'application/xml',
          indentWithTabs: true,
          smartIndent: true,
          lineNumbers: true,
          matchBrackets : true,
          autofocus: true,
        });
      });
    }
  }));
});


dfl = {
  getSchemaList: function() {
    runQuery("SELECT username FROM all_users ORDER BY username ASC", function(results) {
      schemaSelectList = '<select id="schema-select" onchange="dfl.getTableList()">';
      for(var i = 0; i < results.length; i++) {
        var username = results[i].USERNAME.value;
        schemaSelectList += '<option value="'+username+'">'+username+'</option>';
      }
      schemaSelectList += '</select>';
      w2ui['sidebar'].content('top',schemaSelectList);

      dfl.getTableList();
    })
  },

  getTableList: function() {
    runQuery("SELECT table_name FROM all_tables WHERE owner = '"+$('#schema-select').val()+"' ORDER BY table_name ASC", function(results) {
      var tables = Array();
      for(var i = 0; i < results.length; i++) {
        var table = results[i].TABLE_NAME.value;
        tables.push({id: table, text: table, expanded: true, nodes: Array()});
      }

      w2ui['objectList'].nodes = tables;
      w2ui['objectList'].refresh();
    });
  },

  populateResultGrid: function(results, target, editable) {
    var columns = Array();
    var data = results;
    var keys;

    if(results.length > 0){
      keys = Object.keys(results[0]);

      for(var i = 0; i < keys.length; i++) {
        if (keys[i] !== "ROWID") {
          columns.push({
            field: keys[i],
            caption: keys[i],
            size: 100/keys.length+'%',
            resizable: true,
            sortable: true,
            min: keys[i].length * 9
          });
        }
      };

      for(var i = 0; i < data.length; i++) {
        for(var j = 0; j < keys.length; j++) {
          if (keys[j] === "ROWID") {
            data[i]["recid"] = data[i][keys[j]].value;
          }
          else {
            if(data[i][keys[j]].type == 'CLOB') {
              data[i][keys[j]] = '(CLOB)';
            }
            else if(data[i][keys[j]].type == 'BLOB') {
              data[i][keys[j]] = '(BLOB)';
            }
            else if(data[i][keys[j]].type == 'SYS.XMLTYPE') {
              data[i][keys[j]] = escapeHtml(data[i][keys[j]].value.substring(0,50)+'...');
            }
            else {
              data[i][keys[j]] = escapeHtml(data[i][keys[j]].value);
            }
          }
        };
      }
    }
    else {
      columns.push({field: 'NO_RESULTS', caption: 'No data found', size: '100%'});
    }

    w2ui[target].columns = columns;
    w2ui[target].records = data;
    w2ui[target].refresh();
  }
};

$(function () {
    dfl.getSchemaList();
});