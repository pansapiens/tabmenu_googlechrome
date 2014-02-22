document.addEventListener("keyup", function(e) {
  if (!e.keyCode || !e.ctrlKey || e.metaKey) return;
  try {
    chrome.extension.sendRequest({
      code: "" + e.keyCode,
      alt: "" + e.altKey,
      shift: "" + e.shiftKey
    });
  } catch (e) {}
}, false);