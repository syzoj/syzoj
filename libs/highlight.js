const { highlight } = require('syzoj-renderer');
const objectHash = require('object-hash');

module.exports = async (code, lang, cb) => {
  highlight(code, lang, syzoj.redisCache, {
    wrapper: null
  }).then(cb);
}
