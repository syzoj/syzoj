var addUrlParam = function (url, key, val) {
  var newParam = encodeURIComponent(key) + '=' + encodeURIComponent(val);

  url = url.split('#')[0];
  var twoPart = url.split('?'), params = {};
  var tmp = twoPart[1] ? twoPart[1].split('&') : [];
  for (var i in tmp) {
    var a = tmp[i].split('=');
    params[a[0]] = a[1];
  }

  params[key] = val;

  url = twoPart[0] + '?';
  for (var key2 in params) {
    url += encodeURIComponent(key2) + '=' + encodeURIComponent(params[key2]) + '&';
  }

  url = url.substring(0, url.length - 1);

  return url;
};

$(function () {
  $(document).on('click', 'a[href-post]', function (e) {
    e.preventDefault();

    var form = document.createElement('form');
    form.style.display = 'none';
    form.method = 'post';
    form.action = $(this).attr('href-post');
    form.target = '_self';

    document.body.appendChild(form);
    form.submit();
  });
});
