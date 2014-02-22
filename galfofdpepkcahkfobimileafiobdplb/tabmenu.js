try{
/*
<license>
Tab Menu - a Google Chrome extension
Copyright 2010 Frank Yan.

This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License
as published by the Free Software Foundation; either version 2
of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
</license>

The tab menu icon can be found at
<http://wefunction.com/2008/07/function-free-icon-set>.
*/

var main, sorting = 0, moved = 0, count = 0, update;

function list(tabs) {

  var length = tabs.length;
  for (var i = 0; i !== length; i++) {

    var f = tabs[i].favIconUrl, t = tabs[i].title, u = tabs[i].url;
    if (!u) u = "";
    if (!t) t = u;

    var li = document.createElement("div");
    li.tabIndex = 0;
    li.className = "item" + (tabs[i].selected ? " selected" : "");

    var favicon = document.createElement("img");
    if (f) favicon.src = f;
    if (u) favicon.title = u;

    var title = document.createElement("div");
    title.className = "title";
    if (t.length > 38)
      title.title = t;
    title.textContent = t;  

    var close = document.createElement("div");
    close.className = "close";
    close.title = "Close Tab";
    close.textContent = "x";

    li.appendChild(favicon);
    li.appendChild(title);
    li.appendChild(close);

    li.tabId = tabs[i].id;
    li.url = u;
    li.search = ((t && t != u ? t + "" : "") + " " + (u ? u : "")).toLowerCase();
    main.appendChild(li);
  }

  flow(32);
  anim();

}

function anim() {

  $(".close").click(function(e) {
    cloz(e, e.currentTarget.parentNode);
  });

  $(".item").mousedown(function(e) {
    if (!e.button) {
      main.tabId = e.currentTarget.tabId;
      moved = 0;
    }
  });

  $(".item").click(function(e) {
    if (!e.button && !moved)
      chrome.tabs.update(e.currentTarget.tabId, { selected : true });
    if (e.button == 1)
      cloz(e, e.currentTarget);
  });

  $(".item").keyup(function(e) {
    if (e.keyCode == 13)
      chrome.tabs.update(e.currentTarget.tabId, { selected : true });
    if (e.keyCode == 46)
      cloz(e, e.currentTarget);
  });

  $("#search").bind("keyup change", function() {
    var v = $(this).val();
    if (v) {
      $("#main").sortable("disable");
      v = v.toLowerCase().split(" ");
      $(".item").each(function() {
        for (var i = 0; i < v.length; i++) {
          if (this.search.indexOf(v[i]) == -1) {
            $(this).css("display", "none");
            break;
          }
        }
        if (i >= v.length)
          $(this).css("display", "block");
      });
    }
    else {
      $(".item").css("display", "block");
      $("#main").sortable("enable");
    }
    flow(4);
  });

  $("#main").sortable({
    forcePlaceholderSize: true,
    opacity: .8,
    distance: 5,
    scroll: false,
    containment: "document",
    axis: "y",
    items: ".item",
    cancel: ".close",
    tolerance: "pointer",
    start: function() {
      if (!document.body.className)
        document.body.style.cssText = "overflow-y: hidden";
      sorting = 1;
      moved = 1;
    },
    stop: function() {
      document.body.style.cssText = "";
      sorting = 0;
    },
    update: function() {
      if (main.tabId) {
        var i, t = main.childNodes;
        for (i = 1; i < t.length; i++)
          if (main.tabId == t[i].tabId)
            break;
        if (i-- < t.length) {
          chrome.tabs.move(main.tabId, { index: i });
          main.tabId = 0;
        }
      }
    }
  });

  onunload = function() {
    $("*").unbind();
  };

  if (!$("#key").length) return;
  $("#key").bind("keydown", function(e) {
    if (e.keyCode && e.keyCode < 30)
      return;
    $("#key").val("");
    $("#key").get(0).className = "";
  });
  $("#key").keyup(disp);
  $("#alt").get(0).checked = localStorage.alt == "true";
  $("#shift").get(0).checked = localStorage.shift == "true";
  disp(localStorage.code);
  if (location.search.indexOf("options") != -1)
    $("#alt").get(0).focus();
  $("#save").bind("click keyup", function(e) {
    if (e.button !== 0 && e.keyCode !== 13 && e.keyCode !== 32)
      return;
    if (!$("#key").hasClass("letter")) {
      alert("Tab Menu requires that your keyboard shortcut use a letter.\nSorry for any inconvenience. :(");
      return;
    }
    localStorage.code = $("#key").get(0).keyCode;
    localStorage.alt = $("#alt").get(0).checked;
    localStorage.shift = $("#shift").get(0).checked;
    var msg = "Saved! :)";
    if (localStorage.notice == "true") {
      msg += "\n\nNOTE: Google Chrome extensions' keyboard shortcuts\n" +
        "currently may not work on all pages and do require that\n" +
        "pages be refreshed for the new setting to take effect.";
      localStorage.notice = "false";
    }
    alert(msg);
  });
  $(document).bind("mouseover keyup", function() {
    setTimeout(update, 10);
  });
  $("#merge").bind("click keyup", function(e) {
    if (e.button !== 0 && e.keyCode !== 13 && e.keyCode !== 32)
      return;
    chrome.windows.getCurrent(function(current) {
      chrome.windows.getAll({ populate: true }, function(windows) {
        var toBeMerged = [];
        windows.forEach(function(window) {
          if (window.id != current.id)
            window.tabs.forEach(function(tab) { toBeMerged.push(tab.id); });
        });
        if (toBeMerged.length) {
          toBeMerged.forEach(function(id) {
            chrome.tabs.move(id, { windowId: current.id, index: 9999 });
          });
          location.reload();
        }
      });
    });
  });
  chrome.extension.getBackgroundPage().realCount();

}

function disp(e) {
  if (typeof e == "string")
    e = { keyCode: parseInt(e, 10) };
  if (e.keyCode && e.keyCode < 30)
    return;
  if (e.keyCode) {
    var letter = String.fromCharCode(e.keyCode).toLowerCase();
    var valid = /^[a-z]$/.test(letter);
  }
  if (!e.keyCode || !valid) {
    $("#key").val("");
    $("#key").get(0).className = "";
    return;
  }
  $("#key").val(letter);
  $("#key").get(0).className = "letter";
  $("#key").get(0).keyCode = e.keyCode;
}

function flow(min) {
  for (var i = min; i < min * 8; i *= 2)
    setTimeout(mode, i);
}

function mode(length) {
  if (document.body.id == "tab") return;
  var noscroll = document.body.clientWidth < innerWidth ? "true" : "";
  if (document.body.className != noscroll)
    document.body.className = noscroll;
}

function cloz(e, tab) {
  tab = main.removeChild(tab);
  chrome.tabs.remove(tab.tabId);
  e.stopPropagation();
  e.preventDefault();
  flow(8);
}

function opts() {
  chrome.tabs.getAllInWindow(null, function(tabs) {
    count = tabs.length;
    for (var i = 0, tab; tab = tabs[i]; i++)
      if (tab.url && /^chrome.*popup.html.tab([&]options)?$/.test(tab.url) && !tab.selected)
        chrome.tabs.remove(tab.id);
  });

  document.body.id = "tab";
  var options = document.body.insertBefore(document.createElement("div"), main);
  options.id = "options";
  var caption = options.appendChild(document.createElement("div"));
  caption.id = "caption";
  caption.appendChild(document.createTextNode("Keyboard Shortcut to open Tab Menu in a tab:"));
  var shortcut = options.appendChild(document.createElement("div"));
  var d = document.createElement("input");
  d.type = "checkbox";
  d.id = "ctrl";
  d.checked = true;
  d.disabled = true;
  shortcut.appendChild(d);
  shortcut.appendChild(document.createTextNode("ctrl + "));
  for (var i = 0; i < 2; i++) {
    var m = document.createElement("input");
    m.type = "checkbox";
    m.id = !i ? "alt" : "shift";
    shortcut.appendChild(m);
    shortcut.appendChild(document.createTextNode(!i ? "alt + " : "shift + "));
  }
  var k = document.createElement("input");
  k.type = "text";
  k.id = "key";
  k.maxLength = "1";
  shortcut.appendChild(k);
  var v = document.createElement("input");
  v.type = "checkbox";
  v.checked = true;
  v.disabled = true;
  v.id = "valid";
  shortcut.appendChild(v);
  var saver = shortcut.appendChild(document.createElement("button"));
  saver.id = "save";
  saver.textContent = "save";
  var tabcount = options.appendChild(document.createElement("div"));
  var counter = tabcount.appendChild(document.createElement("span"));
  counter.id = "counter";
  counter.appendChild(document.createTextNode("Tab counter:"));
  for (var i = 0; i < 3; i++) {
    var m = document.createElement("input");
    m.type = "radio";
    m.name = "counter";
    m.id = !i ? "badge" : i == 1 ? "title" : "none";
    m.checked = localStorage.counter == m.id;
    function pref() {
      localStorage.counter = this.id;
      chrome.extension.getBackgroundPage().countTabs();
    }
    m.onclick = pref;
    m.onchange = pref;
    tabcount.appendChild(m);
    tabcount.appendChild(document.createTextNode(!i ? "on icon" : i == 1 ? "on hover" : "none"));
  }
  var thethird = options.appendChild(document.createElement("div"));
  var merger = thethird.appendChild(document.createElement("button"));
  merger.id = "merge";
  merger.textContent = "merge windows";

  update = function() {
    chrome.tabs.getAllInWindow(null, function(tabs) {
      if (sorting) return;
      var l = document.getElementsByClassName("item");
      if (tabs.length != l.length)
        location.reload();
      for (var i = 0; i !== tabs.length; i++)
        if (tabs[i].id.toString() != l[i].tabId.toString() || tabs[i].url != l[i].url)
          location.reload();
    });
  };
  setTimeout(update, 100);
}

$(document).ready(function() {
  main = document.getElementById("main");
  location.search.lastIndexOf("?tab") ? onblur = close : opts();
  chrome.tabs.getAllInWindow(null, list);
  if (location.search.indexOf("options") == -1)
    $("#search").focus();
});
}
catch(e){
	console.error(e)
}