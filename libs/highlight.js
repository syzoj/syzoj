const { highlight } = require('syzoj-renderer');

module.exports = (code, lang, cb) => {
  highlight(code, lang).then(cb);
}
