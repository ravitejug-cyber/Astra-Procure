(function () {
  // Patch window.btoa: replace any char > U+00FF with '?' so
  // React 19's applyViewTransitionName never crashes on non-Latin1 strings.
  // The crash is also fixed at the source in the react-dom CJS files via
  // the postinstall script, so this is a secondary defence only.
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
})();
