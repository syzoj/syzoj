var addUrlParam = function (url, key, val) {
  var newParam = encodeURIComponent(key) + '=' + encodeURIComponent(val);

  url = url.split('#')[0];
  var twoPart = url.split('?'), params = {};
  var tmp = twoPart[1] ? twoPart[1].split('&') : [];
  for (let i in tmp) {
    let a = tmp[i].split('=');
    params[a[0]] = a[1];
  }

  params[key] = val;

  url = twoPart[0] + '?';
  for (let key2 in params) {
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

    var input = document.createElement('input');
    input.type = 'hidden';
    input.name = '_csrf';
    input.value = document.head.getAttribute('data-csrf-token');
    form.appendChild(input);

    document.body.appendChild(form);
    form.submit();
  });

  $('form').not('.have-csrf').each(function () {
    this.action = addUrlParam(this.action || location.href, '_csrf', document.head.getAttribute('data-csrf-token'));
  });
});
