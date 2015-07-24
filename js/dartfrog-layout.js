function escapeHtml(unsafe) {
    return unsafe
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
 }

resultGrid = $().w2grid({
            name: 'grid',
            header: 'Results',
            show: {
                toolbar: false,
                footer: false
            }      
        });

schemaTree =  $().w2sidebar({
        name: 'sidebar',
        img: null,
        topHTML: '<select id="schema-select"></select>',
    nodes: [ 
            { id: 'level-1', text: 'l1', expanded: true,
              nodes: [ { id: 'level-1-1', text: 'Level 1.1', icon: 'fa-home' },
                       { id: 'level-1-2', text: 'Level 1.2', icon: 'fa-star' },
                       { id: 'level-1-3', text: 'Level 1.3', icon: 'fa-check' }
                     ]
            }
        ]        
    })

editor = null;         

$(function () {    
    $('#layout').w2layout({
        name: 'layout',
        panels: [
            { type: 'top', size: 50, resizable: false, content: ' <button onclick="javascript:runQuery(editor.getValue(),function(results){dfl.populateResultGrid(results);});">Run?</button><button onclick="javascript:getTableMetaData();">tablemetadata</button>' },
            { type: 'left', size: 200, resizable: true, content: 'left' },
            { type: 'main', content: '<textarea id="code">select * from portalmgr.web_roles</textarea>',  resizable: true, size: 50},
            { type: 'preview', content: 'preview', resizable: true, size: 500
            }            
        ]
    });

    w2ui['layout'].content('left',schemaTree);

    w2ui['layout'].content('preview', resultGrid);

    editor = CodeMirror.fromTextArea(document.getElementById('code'),{
        mode: 'text/x-sql',
        indentWithTabs: true,
        smartIndent: true,
        lineNumbers: true,
        matchBrackets : true,
        autofocus: true,
      });  

    $('#schema-select').change(function() {
        dfl.getTableList();
    });
});


dfl = {

    getSchemaList: function() {
        runQuery("SELECT username FROM dba_users ORDER BY username ASC", function(results) {
            for(var i = 0; i < results.length; i++) {
                var username = results[i].USERNAME.value;
               $('#schema-select').append('<option value="'+username+'">'+username+'</option>') 
            }

            dfl.getTableList();            
        })

    },

    getTableList: function() {
        runQuery("SELECT table_name FROM all_tables WHERE owner = '"+$('#schema-select').val()+"' ORDER BY table_name ASC", function(results) {
            var tables = Array();
            for(var i = 0; i < results.length; i++) {
                var table = results[i].TABLE_NAME.value;
                tables.push({id: table, text: table});
            }
            
            //schemaTree.nodes = tables;
            //schemaTree.refresh();
        })        
    },

    populateResultGrid: function(results) {
        var columns = Array();
        var data = results;
        var keys = Object.keys(results[0]);

        for(var i = 0; i < keys.length; i++) {
            columns.push({
                field: keys[i], 
                caption: keys[i], 
                size: 100/keys.length+'%', 
                resizable: true,
                sortable: true
            });
        };

        for(var i = 0; i < data.length; i++) {
            for(var j = 0; j < keys.length; j++) {
                if(data[i][keys[j]].type == 'CLOB') {
                   data[i][keys[j]] = '(CLOB)'; 
                } else {
                    data[i][keys[j]] = escapeHtml(data[i][keys[j]].value);
                }
            };
        }

        resultGrid.columns = columns;  
        resultGrid.records = data;
        resultGrid.refresh();    
    }
};

$(function () { 
    dfl.getSchemaList();
});