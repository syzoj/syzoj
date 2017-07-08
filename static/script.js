$(function () {
  $('a[href-post]').click(function (e) {
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
