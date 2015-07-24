resultGrid = $().w2grid({
            name: 'grid',
            header: 'Results',
            show: {
                toolbar: false,
                footer: false
            }      
        });    

$(function () {    
    $('#layout').w2layout({
        name: 'layout',
        panels: [
            { type: 'top', size: 50, resizable: false, content: '<button onclick="javascript:testJDBC();">Run?</button>' },
            { type: 'left', size: 200, resizable: true, content: 'left' },
            { type: 'main', content: '<textarea id="code">select * from portalmgr.web_roles</textarea>',  resizable: true, size: 50},
            { type: 'preview', content: 'preview', resizable: true, size: 500
            }            
        ]
    });

    w2ui['layout'].content('left', $().w2sidebar({
        name: 'sidebar',
        img: null,
        nodes: [ 
            { id: 'level-1', text: 'Level 1', expanded: true,
              nodes: [ { id: 'level-1-1', text: 'Level 1.1', icon: 'fa-home' },
                       { id: 'level-1-2', text: 'Level 1.2', icon: 'fa-star' },
                       { id: 'level-1-3', text: 'Level 1.3', icon: 'fa-check' }
                     ]
            }
        ],
        onClick: function (event) {
            w2ui['layout'].content('main', 'id: ' + event.target);
        }
    }));

    w2ui['layout'].content('preview', resultGrid);

    editor = CodeMirror.fromTextArea(document.getElementById('code'),{
        mode: 'text/x-sql',
        indentWithTabs: true,
        smartIndent: true,
        lineNumbers: true,
        matchBrackets : true,
        autofocus: true,
      });    
});

dfl = {
    populateResultGrid: function(results) {
        var columns = Array();
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

        resultGrid.columns = columns;  
        resultGrid.records = results;
        resultGrid.refresh();    
    }
}