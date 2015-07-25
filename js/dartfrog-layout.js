function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
 }

var editor = null;
var schemaEditor = null;
var schemaSelectList = '';
var currentTableMetadata;
var currentTableData;
var currentFilePath;
var gameTimer;
var gameTick;

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

  var toolbar = '<div class="toolbar">'
    +'<button onclick="javascript:runStatementUnderCursor();dfl.startGameTimer();" id="run" class="icon-play3">SQL</button>'
    +'<button onclick="javascript:runPLSQLUnderCursor();" id="plsql" class="icon-power">PL/SQL</button>'
    +'<button onclick="javascript:runExplianPlanUnderCurrentCursor();" id="explain" class="icon-truck">Plan</button>'
    +'<button onclick="javascript:editor.getDoc().setValue(\'\');currentFilePath=null;$(\'#filePath\').text(\'\');" id="new-file" class="icon-plus">New</button>'    
    +'<button onclick="javascript:dfl.chooseFile(\'#fileDialog\');" id="open" class="icon-folder-open">Open</button>'
    +'<button onclick="javascript:dfl.saveFile(null);" id="save" class="icon-floppy-disk">Save</button>'
    +'<button onclick="javascript:toadMode();" id="toadMode" class="icon-crying" style="float:right;padding: 0.5em 0em 0.7em 0em;"></button>'
    +'<button onclick="javascript:dfl.saveAs();" id="saveAs">Save As...</button><span id="filePath"></span>'
    +'</div>'; 

  //Set up editor view
  $('#editor').w2layout({
    name: 'editor',
    panels: [
      { type: 'main', content: toolbar+'<textarea id="code">select * from dual</textarea>',  resizable: true, size: 50},
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
    mode: 'text/x-plsql',
    indentWithTabs: true,
    smartIndent: true,
    lineNumbers: true,
    matchBrackets : true,
    autofocus: true,
    theme: 'mdn-like',
    indentUnit: 2,
    extraKeys: {
      'F9': runStatementUnderCursor
    , 'F10': runUpdateUnderCurrentCursor
    , 'F11': runExplianPlanUnderCurrentCursor
    , Tab: function(cm) {
        var spaces = Array(cm.getOption("indentUnit") + 1).join(" ");
        cm.replaceSelection(spaces, "end", "+input");
      }
    },
  });

  editor.on("change", function() {
    $('#save').removeClass().addClass('icon-floppy-disk').prop( "disabled", false );
  });

  //Set up schema view
  $('#schema').w2layout({
    name: 'schema',
    panels: [
      { type: 'left', size: 300, resizable: true, content: 'left' },
      { type: 'main', content: 
        $().w2grid({
            name: 'metadata',
            header: 'Metadata',
            show: {
              toolbar: false,
              footer: false
            },
            columns: [
              { field: 'name', caption: 'Name', size: '16.6%' },
              { field: 'type', caption: 'Type', size: '16.6%' },
              { field: 'scale', caption: 'Scale', size: '16.6%' },
              { field: 'precision', caption: 'Precision', size: '16.6%' },
              { field: 'nullable', caption: 'Nullable', size: '16.6%' },
              { field: 'autoinc', caption: 'Auto-increment', size: '16.6%' },
            ],
            records: Array()
          })
      },
      { type: 'preview', resizable: true, size: 600,
      onResize: function() { dfl.getSchemaList(); }}
    ],
  });

  w2ui['schema'].content('left',$().w2layout({
    name: 'sidebar',
    panels: [
      {type: 'top', content: schemaSelectList, size: 25},
      {type: 'main', content: ''},
    ]
  }));

  w2ui['sidebar'].content('main',$().w2sidebar({
    name: 'objectList',
    img: null,
    nodes: [{id: 'xxx', text: 'xxx', expanded: true, nodes: Array()}],
    onClick: function (event) {
      showTableSchemaBrowserView($('#schema-select').val()+"."+event.target);
    }
  }));

  $('body').on('change','#schema-select',function() {
    dfl.getTableList();
  });

  w2ui['schema'].content('preview', $().w2grid({
    name: 'tableContents',
    header: 'Table',
    show: {
      toolbar: false,
      footer: false
    },
    onDblClick: function(event) {
      console.log(event);
      var column = currentTableMetadata.columns[event.column];
      
      runQuery("SELECT " + column.name + " FROM " + currentTableMetadata.table_name + " WHERE rowid = '" + event.recid + "'", function(results){
        var updateStatement = 'UPDATE ' + currentTableMetadata.table_name + ' SET ' + column.name + ' = ';
        if (currentTableMetadata.columns[event.column].type == "SYS.XMLTYPE") {
          updateStatement += 'XMLTYPE(\\\'\'+schemaEditor.getValue()+\'\\\')';
        }
        else if (currentTableMetadata.columns[event.column].type == "NUMBER") {
          updateStatement += '\'+schemaEditor.getValue()+\'';
        }
        else {
          updateStatement += '\\\'\'+schemaEditor.getValue()+\'\\\'';
        }
        updateStatement += ' WHERE rowid = \\\'' + event.recid + '\\\'';
        
        w2popup.open({
          title   : 'Edit ' + column.name + ' on ' + currentTableMetadata.table_name,
          body    : '<textarea id="editorCM">' + escapeHtml(results[0][column.name].value) + '</textarea>',
          buttons : '<button disabled="disabled">Save</button><button onClick="javascript:runUpdate(\'' + updateStatement + '\',  function(rowCount){console.log(rowCount);showTableSchemaBrowserView(\''+currentTableMetadata.table_name+'\');});w2popup.close();">Commit</button>',
          showClose: false,
          modal: true,
          width: 1000,
          height: 800
        });
        
        if (currentTableMetadata.columns[event.column].type == "SYS.XMLTYPE") {
          schemaEditor = CodeMirror.fromTextArea(document.getElementById('editorCM'),{
            mode: 'application/xml',
            indentWithTabs: false,
            smartIndent: true,
            lineNumbers: true,
            matchBrackets : true,
            matchTags: {bothTags: true},
            autofocus: true,
            theme: 'mdn-like',
            parserfile: "parsexml.js",
            indentUnit: 2,
            extraKeys: {
                Tab: function(cm) {
                    var spaces = Array(cm.getOption("indentUnit") + 1).join(" ");
                    cm.replaceSelection(spaces, "end", "+input");
                }
            }   
          });
        }
        else {
          schemaEditor = CodeMirror.fromTextArea(document.getElementById('editorCM'),{
            mode: 'text/plain',
            indentWithTabs: false,
            smartIndent: true,
            lineNumbers: true,
            matchBrackets : true,
            autofocus: true,
            theme: 'neat',
            indentUnit: 2,
            extraKeys: {
                Tab: function(cm) {
                    var spaces = Array(cm.getOption("indentUnit") + 1).join(" ");
                    cm.replaceSelection(spaces, "end", "+input");
                }
            }   
          });
        }
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

    dfl.stopGame();

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
  },

  populateTableMetadataview: function(metadata) {
    var recs = Array()

    for(var i = 0; i<metadata.column_count; i++) {
      recs.push({
        name: metadata.columns[i].name,
        type: metadata.columns[i].type,
        precision: metadata.columns[i].precision,
        scale: metadata.columns[i].scale,
        nullable: (metadata.columns[i].nullable == 0) ? 'No' : 'Yes',
        autoinc: metadata.columns[i].auto_increment,
      })
    }

    w2ui['metadata'].records = recs;
    w2ui['metadata'].refresh();
  },

  chooseFile: function(name) {
      var chooser = $(name);
      chooser.unbind('change');
      chooser.change(function(evt) {
        currentFilePath = $(this).val();
        $('#filePath').text(currentFilePath);

        fs.readFile($(this).val(),null,function(err,data){
          if(err){
            alert(err);
          } else {
            editor.getDoc().setValue(data.toString());
            $('#save').removeClass().addClass('icon-floppy-disk').prop( "disabled", true );
          }
        })
      });

      chooser.trigger('click');  
    },

    saveFile: function(path) {
      if(path == null && currentFilePath != null) {
        path = currentFilePath;
        fs.writeFile(path, editor.getValue(), function(err) {
            if(err) {
                alert("error");
            } else {
              $('#save').removeClass().addClass('icon-checkmark').prop( "disabled", true );
            }
        });          
      } else {
        dfl.saveAs();
      }  
    },

    saveAs: function() {
      var chooser = $('#saveAs');
      chooser.unbind('change');
      chooser.change(function(evt) {
        currentFilePath = $(this).val();
        $('#filePath').text(currentFilePath);

        fs.writeFile($(this).val(), editor.getValue(), function(err) {
            if(err) {
                alert("error");
            } else {
              $('#save').removeClass().addClass('icon-checkmark').prop( "disabled", true );
            }
        });  
      });

      chooser.trigger('click');       
    },

    startGameTimer: function() {
      gameTimer = setTimeout(dfl.startGame, 3000);
    },

    startGame: function() {
      $('#game-popup').show(250);
      var fs = "1111:01|01|01|01*011|110:010|011|001*110|011:001|011|010*111|010:01|11|01:010|111:10|11|10*11|11*010|010|011:111|100:11|01|01:001|111*01|01|11:100|111:11|10|10:111|001", now = [3,0], pos = [4,0];
      var gP = function(x,y) { return document.querySelector('[data-y="'+y+'"] [data-x="'+x+'"]'); };
      var draw = function(ch, cls) {
          var f = fs.split('*')[now[0]].split(':')[now[1]].split('|').map(function(a){return a.split('')});
          for(var y=0; y<f.length; y++)
              for(var x=0; x<f[y].length; x++)
                  if(f[y][x]=='1') {
                      if(x+pos[0]+ch[0]>9||x+pos[0]+ch[0]<0||y+pos[1]+ch[1]>19||gP(x+pos[0]+ch[0],y+pos[1]+ch[1]).classList.contains('on')) return false;
                      gP(x+pos[0]+ch[0], y+pos[1]+ch[1]).classList.add(cls!==undefined?cls:'now');
                  }
          pos = [pos[0]+ch[0], pos[1]+ch[1]];
      }
      var deDraw = function(){ if(document.querySelectorAll('.now').length>0) deDraw(document.querySelector('.now').classList.remove('now')); }
      var check = function(){
        for(var i=0; i<20; i++)
          if(document.querySelectorAll('[data-y="'+i+'"] .brick.on').length == 10) 
            return check(roll(i), document.querySelector('#result').innerHTML=Math.floor(document.querySelector('#result').innerHTML)+10);
      };
      var roll = function(ln){ if(false !== (document.querySelector('[data-y="'+ln+'"]').innerHTML = document.querySelector('[data-y="'+(ln-1)+'"]').innerHTML) && ln>1) roll(ln-1); };
      window.addEventListener('keydown', kdf = function(e){
          if(e.keyCode==38&&false!==(now[1]=((prv=now[1])+1)%fs.split('*')[now[0]].split(':').length) && false===draw([0,0], undefined, deDraw())) draw([0,0],undefined, deDraw(), now=[now[0],prv]);
          if((e.keyCode==39||e.keyCode==37)&&false===draw([e.keyCode==39?1:-1,0],undefined,deDraw())) draw([0,0],undefined,deDraw());
          if(e.keyCode == 40)
              if(false === draw([0,1], undefined, deDraw())) {
                  if(draw([0,0], 'on', deDraw())||true) check();
                  if(false === draw([0,0], undefined, now = [Math.floor(Math.random()*fs.split('*').length),0], pos = [4,0])) { 
              toV=-1; 
              alert('Your score: '+document.querySelector('#result').innerHTML); 
            }
              }
      });
      toF = function() {
          kdf({keyCode:40});
          gameTick = setTimeout(function(){if(toV>=0)toF();}, toV=toV>0?toV-0.5:toV);
      }
      toF(toV = 500);
    },

    stopGame: function() {
      $('#game-popup').hide(500);
      clearTimeout(gameTimer);
      clearTimeout(gameTick);
    }
};

$(function () {
    dfl.getSchemaList();
});