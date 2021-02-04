const renderer = require('syzoj-renderer');
const XSS = require('xss');
const xssWhiteList = Object.assign({}, require('xss/lib/default').whiteList);
delete xssWhiteList.audio;
delete xssWhiteList.video;

for (const tag in xssWhiteList) {
  xssWhiteList[tag] = xssWhiteList[tag].concat(['style', 'class']);
}

const xss = new XSS.FilterXSS({
  whiteList: xssWhiteList,
  stripIgnoreTag: true,
  onTagAttr: (tag, name, value, isWhiteAttr) => {
    if (tag.toLowerCase() === 'img' && name.toLowerCase() === 'src' && value.startsWith('data:image/')) {
      return name + '="' + XSS.escapeAttrValue(value) + '"';
    }
  }
});

const Redis = require('redis');
const RedisLRU = require('redis-lru');
const util = require('util');
const redis = Redis.createClient(process.argv[2]);
const redisLru = RedisLRU(redis, parseInt(process.argv[3]));
const redisCache = {
  get: redisLru.get.bind(redisLru),
  set: redisLru.set.bind(redisLru)
};

async function highlight(code, lang) {
  return await renderer.highlight(code, lang, redisCache, {
    wrapper: null
  });
}

async function markdown(markdownCode) {
  function filter(html) {
    html = xss.process(html);
    if (html) {
      html = `<div style="position: relative; overflow: hidden; ">${html}</div>`;
    }
    return html;
  };

  return await renderer.markdown(markdownCode, redisCache, filter);
}

process.on('message', async msg => {
  if (msg.type === 'markdown') {
    process.send({
      id: msg.id,
      result: await markdown(msg.source)
    });
  } else if (msg.type === 'highlight') {
    process.send({
      id: msg.id,
      result: await highlight(msg.source.code, msg.source.lang)
    });
  }
});

process.on('disconnect', () => process.exit());
