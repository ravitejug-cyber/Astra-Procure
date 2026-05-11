(function () {
  // Patch window.btoa: replace any char > U+00FF with '?' so
  // React 19's applyViewTransitionName never crashes on non-Latin1 strings.
  var _b = window.btoa.bind(window);
  window.btoa = function (s) {
    if (typeof s !== "string") return _b(s);
    var o = "";
    for (var i = 0; i < s.length; i++) {
      var c = s.charCodeAt(i);
      o += c > 255 ? "?" : s[i];
    }
    return _b(o);
  };

  // Clear ALL astra-procure localStorage keys so stale data with
  // bullet chars from old sessions cannot re-trigger the crash.
  try {
    var keys = Object.keys(localStorage);
    for (var i = 0; i < keys.length; i++) {
      if (keys[i].indexOf("astra-procure") === 0) {
        localStorage.removeItem(keys[i]);
      }
    }
  } catch (e) {}
})();
