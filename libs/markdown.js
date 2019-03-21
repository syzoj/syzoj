const { markdown } = require('syzoj-renderer');
const XSS = require('xss');
const CSSFilter = require('cssfilter');
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

const defaultCache = {
    data: {},
    get(key) {
        return this.data[key];
    },
    set(key, val) {
        this.data[key] = val;
    }
};

function filter(html) {
  html = xss.process(html);
  if (html) {
    html = `<div style="position: relative; overflow: hidden; ">${html}</div>`;
  }
  return html;
};

module.exports = (markdownCode, callback) => {
  markdown(markdownCode, defaultCache, filter).then(callback);
};
