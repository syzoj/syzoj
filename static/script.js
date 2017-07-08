$(function () {
  $('a[href-post]').click(function (e) {
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
    var input = document.createElement('input');
    input.type = 'hidden';
    input.name = '_csrf';
    input.value = document.head.getAttribute('data-csrf-token');
    this.appendChild(input);
  });
});
