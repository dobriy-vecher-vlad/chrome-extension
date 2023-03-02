window.onload = function() {
    var s = document.createElement('script');
    console.warn(chrome);
    s.type = 'text/javascript';
    var code = 'alert("hello world!");';
    try {
      s.appendChild(document.createTextNode(code));
      document.body.appendChild(s);
    } catch (e) {
      s.text = code;
      document.body.appendChild(s);
    }
}