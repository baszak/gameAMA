(function($) {
  _globalWindowDragged = null;
  _globalResizedWindow = null;
  _globalDragAnchor = null;
  _globalResizeDir = null;
  _globalDraggedItem = null;
  _globalZIndex = 999;
  _globalFakeItem = $(document.createElement("div"));
  _globalFakeItem.addClass("globalFakeItem");
  _globalItemAnchor = null;

  
  var windowDefaults = {
    width: 200,
    height: 300,
    closeable: true,
    onclose: function(){},
    resizable: true,
    position: {x:100, y:100},
    title: "New window",
    icon: "bp.gif"
  };
  
  $.fn.changeWindowProp = function(options) {
    this.each(function() {
      var div = $( this );
      for(var opt in options) {
        if (opt === "title") { div.find(".header_text").html(options[opt]); }
        if (opt === "content") { div.find(".content").append(options[opt]); }
      }
    });
    return this;
  };
  
  $.fn.makeWindow = function(options) {
    options = $.extend(windowDefaults, options);
    this.each(function() {
      var div = $( this );
      
      div.css({
        height: options.height + 37,
        width: options.width + 12
      });
      var header = $(document.createElement("div")).addClass("header").appendTo(div);
      header.append('<div class="win_icon"></div>').append('<div class="header_text">'+(options.title||'')+'</div>').append('<div class="win_btns"></div>');
      header.find('.win_btns').append('<div title="Close" class="button_close">x</div>');
      var border = $(document.createElement("div")).addClass("brd").appendTo(div);
      var content = $(document.createElement("div")).addClass("content").appendTo(div);
      options.content && content.append(options.content);
      header.mousedown(function(e){
        _globalWindowDragged = div;
        div.css("z-index",++_globalZIndex);
        _globalDragAnchor = [e.clientX-div.position().left, e.clientY-div.position().top];
        e.preventDefault();
        return false;
      });
      
      options.onclose && div.find(".button_close").click(options.onclose);
      
      if(options.resizable) {
        border.mousemove(function(e){
          var left = e.clientX - div.position().left + document.body.scrollLeft;
          var right = div.position().left + div.outerWidth() - e.clientX - document.body.scrollLeft;
          var bottom = div.position().top + div.outerHeight() - e.clientY - document.body.scrollTop;        
          if (left < 10) {
            if(bottom < 10) {
              $(this).css("cursor","sw-resize");
            } else {
              $(this).css("cursor","w-resize");
            }
          } else if (right < 10) {
            if(bottom < 10) {
              $(this).css("cursor","se-resize");
            } else {
              $(this).css("cursor","e-resize");
            }
          } else {
            $(this).css("cursor","s-resize");
          }
        });
        
        border.mousedown(function(e){
          var left = e.clientX - div.position().left + document.body.scrollLeft;
          var right = div.position().left + div.outerWidth() - e.clientX - document.body.scrollLeft;
          var bottom = div.position().top + div.outerHeight() - e.clientY - document.body.scrollTop;        
          if (left < 10) {
            if(bottom < 10) {
              _globalResizeDir = "sw";
            } else {
              _globalResizeDir = "w";
            }
          } else if (right < 10) {
            if(bottom < 10) {
              _globalResizeDir = "se";
            } else {
              _globalResizeDir = "e";
            }
          } else {
            _globalResizeDir = "s";
          }
          _globalResizedWindow = div;
          e.preventDefault();
          return 0;
        });
      }
    });
    return this;
  };
  
   $.fn.makeContainter = function(size_x, size_y) {
    this.each(function() {
      var div = $( this );
      var size_x = div.attr("size_x")||size_x;
      var size_y = div.attr("size_y")||size_y;
      div[0].data = [];
      for(var i = 0; i < size_x; i++) {
        div[0].data[i] = []; 
        for(var j = 0; j < size_y; j++) 
          div[0].data[i][j] = 0;
      }
      div.css({
        width: size_x*32,
        height: size_y*32
      });
      div.mousemove(function(e){
        if(_globalDraggedItem) {
          var w = _globalDraggedItem.attr("w");
          var h = _globalDraggedItem.attr("h");
          
        }
      });
      div[0].ondrop = function(ev){
        var offset = $(this).offset();
        var position = {};
        position.left = ev.clientX - offset.left + document.body.scrollLeft;
        position.top = ev.clientY - offset.top + document.body.scrollTop;
        var pos = {left: Math.floor((position.left-_globalItemAnchor.left) / 32), top: Math.floor((position.top-_globalItemAnchor.top) / 32)};
        var valid = 1;

        var data = ev.dataTransfer.getData("text");
        var size = {x: $("#"+data).attr("size_x"), y: $("#"+data).attr("size_y")};
        if (pos.left < 0 || pos.top < 0) valid = 0;
        else for(var i = 0; i < size.x; i ++) for(var j = 0; j < size.y; j ++) {
          if (pos.left+i >= size_x || pos.top+j >= size_y || div[0].data[pos.left+i][pos.top+j]) valid = 0;
        }        
        if (valid) {

          $("#"+data).appendTo(div).css({
            left: pos.left*32,
            top: pos.top*32
          });
          for(var i = 0; i < size.x; i ++) for(var j = 0; j < size.y; j ++) {
            div[0].data[pos.left+i][pos.top+j] = 1;
          }     
        }
        ev.preventDefault();
      };
      div[0].ondragover = function(ev){
        var position = {};
        var offset = $(this).offset();
        position.left = ev.clientX - offset.left + document.body.scrollLeft;
        position.top = ev.clientY - offset.top + document.body.scrollTop;
        
        var data = ev.dataTransfer.getData("text");
        var size = {x: $("#"+data).attr("size_x"), y: $("#"+data).attr("size_y")};
        
        var pos = {left: Math.floor((position.left-_globalItemAnchor.left) / 32), top: Math.floor((position.top-_globalItemAnchor.top) / 32)};
        var valid = 1;
        if (pos.left < 0 || pos.top < 0) valid = 0;
        else for(var i = 0; i < size.x; i ++) for(var j = 0; j < size.y; j ++) {
          if (pos.left+i >= size_x || pos.top+j >= size_y || div[0].data[pos.left+i][pos.top+j]) valid = 0;
        }
        _globalFakeItem.appendTo(div).show().css({
          backgroundColor: valid?'green':'red',
          left: pos.left*32,
          top: pos.top*32,
          width: size.x * 32,
          height: size.y * 32
        });
        if(valid) ev.preventDefault();
      };
    });
    return this;
  };
  
  $.fn.makeItem = function(size_x, size_y, parent, pos_x, pos_y) {
    this.each(function() {
      var div = $( this );
      div.prop("draggable", true);
      div.attr("size_x", size_x);
      div.attr("size_y", size_y);
      div.css({
        width: size_x*32,
        height: size_y*32
      });
      div.addClass("item");
      div[0].ondragstart = function(ev) {
        ev.dataTransfer.setData("text", ev.target.id);
        for(var i = 0; i < size_x; i ++) for(var j = 0; j < size_y; j ++) {
          var pos_old = div.position();
          div.parent()[0].data[pos_old.left/32+i][pos_old.top/32+j] = 0;
        }
        _globalItemAnchor = {left: Math.floor((ev.clientX - div.offset().left + document.body.scrollLeft)/32)*32, top: Math.floor((ev.clientY - div.offset().top + document.body.scrollTop)/32)*32};

        ev.dataTransfer.setDragImage(div[0], ev.offsetX, ev.offsetY);
        ev.dataTransfer.effectAllowed = "move";
      }
      div[0].ondragend = function(ev) {
        _globalFakeItem.hide();
        for(var i = 0; i < size_x; i ++) for(var j = 0; j < size_y; j ++) {
          var pos_old = div.position();
          div.parent()[0].data[pos_old.left/32+i][pos_old.top/32+j] = 1;
        }
      }
      div.appendTo(parent).css({
        left: (pos_x||0)*32,
        top: (pos_y||0)*32
      });
      for(var i = 0; i < size_x; i ++) for(var j = 0; j < size_y; j ++) {
        parent[0].data[(pos_x||0)+i][(pos_y||0)+j] = 1;
      }    
    });
    return this;
  };
  
  $(document).ready(function(){
    $(document.body).mousemove(function(e) {
      if(_globalWindowDragged){      
        _globalWindowDragged.css({
          left: e.clientX - _globalDragAnchor[0],
          top: e.clientY - _globalDragAnchor[1]
        });
        _globalWindowDragged.find(".header").css("cursor","move");
      }
      if(_globalResizedWindow){
        if (_globalResizeDir.indexOf("s") != -1)
          _globalResizedWindow.css({height: Math.max(e.clientY - _globalResizedWindow.position().top + document.body.scrollTop + 3, 80)});
        if (_globalResizeDir.indexOf("e") != -1)
          _globalResizedWindow.css({width: Math.max(e.clientX - _globalResizedWindow.position().left + document.body.scrollLeft + 3, 100)});
        if (_globalResizeDir.indexOf("w") != -1)
          _globalResizedWindow.css({width: Math.max(_globalResizedWindow.outerWidth() + _globalResizedWindow.position().left - e.clientX -document.body.scrollLeft + 1, 100), left: Math.min(e.clientX + document.body.scrollLeft -3, _globalResizedWindow.outerWidth() + _globalResizedWindow.position().left +  -102)});
      }
    });
    $(document.body).mouseup(function(e) {
      if(_globalWindowDragged){
        _globalWindowDragged.find(".header").css("cursor","default");
        _globalWindowDragged = null;
      }
      if(_globalResizedWindow){
        _globalResizedWindow = null;
      }
    });
  });
}( jQuery ));