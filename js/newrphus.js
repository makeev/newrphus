window.newrphus = window.newrphus || function() {
  var options = {};
  var defaultOptions = {
    url: '/lua_script/',
    callback: function() {
      alert('Thank you! Misprint was sent');
    },
    maxLength: 1000,
    minLength: 4
  };

  var ajaxPost = function(url, data, callback) {
    if (window.XMLHttpRequest == undefined) {
      return;
    }

    var request = new XMLHttpRequest();
    request.open('POST', url, true);

    request.onreadystatechange = function() {
      if (this.readyState === 4) {
        if (this.status >= 200 && this.status < 400) {
          var resp = this.responseText;
          if (callback != undefined) {
            callback(resp);
          }
        } else {
          // error callback
        }
      }
    };

    var query = [];
    for (var key in data) {
      query.push(encodeURIComponent(key) + '=' + encodeURIComponent(data[key]));
    }

    request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
    request.send(query.join('&'));
    request = null;
  }

  var getContextFromSelection = function(selection, offset) {
    var selectedRange = selection.rangeCount ? selection.getRangeAt(0) : null;
    var text = selectedRange.commonAncestorContainer;
    var new_start = selectedRange.startOffset < offset ? 0 : selectedRange.startOffset - 25;
    var new_end = selectedRange.endOffset+offset > text.length ? text.length : selectedRange.endOffset + 25;

    selectedRange.setStart(selectedRange.commonAncestorContainer, new_start);
    selectedRange.setEnd(selectedRange.commonAncestorContainer, new_end);
    return selectedRange.toString();
  }

  var getSelectedText = function() {
    var offset = 25; // context offset
    if (window.getSelection) {
        selection = window.getSelection();
        selected_text = window.getSelection().toString();
        context = getContextFromSelection(selection, offset);
    } else if (document.getSelection) {
        selection = document.getSelection();
        selected_text = selection;
        context = getContextFromSelection(selection, offset);
    } else if (document.selection) {
        selection = document.selection.createRange();
        selected_text = document.selection.createRange().text;
        context = ''; // IE
    }

    return {'text': selected_text, 'context': context};
  }

  var onKeyPress = function() {
    var e = arguments[0] || window.event;
    var code = e.keyCode ? e.keyCode : (e.which ? e.which : e.charCode);

    if (e.ctrlKey && (code == 13 || code == 10)) {
        var selected = getSelectedText()
        sendReport(selected.text, selected.context);
    }
  }

  var sendReport = function(text, context) {
    if (text !== undefined && text.length <= options.maxLength && text.length >= options.minLength) {
      options.callback();

      ajaxPost(options.url, {
        text: text,
        context: context,
        url: window.location.href ? window.location.href : ''
      });
    }
  }

  var init = function(opts) {
    options.url = opts.url || defaultOptions.url;
    options.callback = opts.callback || defaultOptions.callback;
    options.minLength = opts.minLength || defaultOptions.minLength;
    options.maxLength = opts.maxLength || defaultOptions.maxLength;

    document.onkeypress = onKeyPress;
  }

  return {
    'init': init
  }
}();
