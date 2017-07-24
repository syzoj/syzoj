var addUrlParam = function (url, key, val) {
  var newParam = encodeURIComponent(key) + '=' + encodeURIComponent(val);

  url = url.split('#')[0];
  if (url.indexOf('?') === -1) url += '?' + newParam;
  else url += '&' + newParam;

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

  $('form').each(function () {
    this.action = addUrlParam(this.action || location.href, '_csrf', document.head.getAttribute('data-csrf-token'));
  });
});
