/*
 *  This file is part of SYZOJ.
 *
 *  Copyright (c) 2016 Menci <huanghaorui301@gmail.com>
 *
 *  SYZOJ is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU Affero General Public License as
 *  published by the Free Software Foundation, either version 3 of the
 *  License, or (at your option) any later version.
 *
 *  SYZOJ is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU Affero General Public License for more details.
 *
 *  You should have received a copy of the GNU Affero General Public
 *  License along with SYZOJ. If not, see <http://www.gnu.org/licenses/>.
 */

'use strict';

Array.prototype.forEachAsync = Array.prototype.mapAsync = async function (fn) {
  return Promise.all(this.map(fn));
};

Array.prototype.filterAsync = async function (fn) {
  let a = await this.mapAsync(fn);
  return this.filter((x, i) => a[i]);
};

global.ErrorMessage = class ErrorMessage {
  constructor(message, nextUrls, details) {
    this.message = message;
    this.nextUrls = nextUrls || {};
    this.details = details;
  }
};

let path = require('path');
let util = require('util');
let renderer = require('moemark-renderer');
let moment = require('moment');
let url = require('url');
let querystring = require('querystring');
let pygmentize = require('pygmentize-bundled-cached');
let gravatar = require('gravatar');
let AdmZip = require('adm-zip');
let filesize = require('file-size');

function escapeHTML(s) {
  // Code from http://stackoverflow.com/questions/5251520/how-do-i-escape-some-html-in-javascript/5251551
  return s.replace(/[^0-9A-Za-z ]/g, (c) => {
    return "&#" + c.charCodeAt(0) + ";";
  });
}

function highlightPygmentize(code, lang, cb) {
  pygmentize({
    lang: lang,
    format: 'html',
    options: {
      nowrap: true,
      classprefix: 'pl-'
    }
  }, code, (err, res) => {
    if (err || res.toString() === 'undefined') {
      cb(escapeHTML(code));
    } else {
      cb(res);
    }
  });
}

renderer.config.highlight = highlightPygmentize;

module.exports = {
  resolvePath(s) {
    let a = Array.from(arguments);
    a.unshift(__dirname);
    return path.resolve.apply(null, a);
  },
  markdown(obj, keys, noReplaceUI) {
    let XSS = require('xss');
    let CSSFilter = require('cssfilter');
    let whiteList = Object.assign({}, require('xss/lib/default').whiteList);
    delete whiteList.audio;
    delete whiteList.video;
    for (let tag in whiteList) whiteList[tag] = whiteList[tag].concat(['id', 'style', 'class']);
    let xss = new XSS.FilterXSS({
      css: {
        whiteList: Object.assign({}, require('cssfilter/lib/default').whiteList, {
          'vertical-align': true,
          top: true,
          bottom: true,
          left: true,
          right: true
        })
      },
      whiteList: whiteList,
      stripIgnoreTag: true
    });
    let replaceXSS = s => {
      return xss.process(s);
    };
    let replaceUI = s => {
        if (noReplaceUI) return s;
        return s.split('<pre>').join('<div class="ui existing segment"><pre style="margin-top: 0; margin-bottom: 0; ">').split('</pre>').join('</pre></div>')
                .split('<table>').join('<table class="ui table">')
                .split('<blockquote>').join('<div class="ui message">').split('</blockquote>').join('</div>');
    };
    return new Promise((resolve, reject) => {
      if (!keys) {
        if (!obj || !obj.trim()) resolve("");
        else renderer(obj, { mathjaxUseHtml: true }, s => {
            resolve(replaceUI(replaceXSS(s)));
        });
      } else {
        let res = obj, cnt = keys.length;
        for (let key of keys) {
          renderer(res[key], { mathjaxUseHtml: true }, (s) => {
            res[key] = replaceUI(replaceXSS(s));
            if (!--cnt) resolve(res);
          });
        }
      }
    });
  },
  formatDate(ts, format) {
    let m = moment(ts * 1000);
    m.locale('eu');
    return m.format(format || 'L H:mm:ss');
  },
  formatTime(x) {
    let sgn = x < 0 ? '-' : '';
    x = Math.abs(x);
    function toStringWithPad(x) {
      x = parseInt(x);
      if (x < 10) return '0' + x.toString();
      else return x.toString();
    }
    return sgn + util.format('%s:%s:%s', toStringWithPad(x / 3600), toStringWithPad(x / 60 % 60), toStringWithPad(x % 60));
  },
  formatSize(x) {
    let res = filesize(x, { fixed: 1 }).calculate();
    if (res.result === parseInt(res.result)) res.fixed = res.result.toString();
    if (res.suffix.startsWith('Byte')) res.suffix = 'B';
    else res.suffix = res.suffix.replace('iB', '');
    return res.fixed + ' ' + res.suffix;
  },
  parseDate(s) {
    return parseInt(+new Date(s) / 1000);
  },
  getCurrentDate() {
    return parseInt(+new Date / 1000);
  },
  makeUrl(req_params, form) {
    let res = '';
    if (!req_params) res = '/';
    else if (req_params.originalUrl) {
      let u = url.parse(req_params.originalUrl);
      res = u.pathname;
    } else {
      if (!Array.isArray(req_params)) req_params = [req_params];
      for (let param of req_params) res += '/' + param;
    }
    let encoded = querystring.encode(form);
    if (encoded) res += '?' + encoded;
    return res;
  },
  escapeHTML: escapeHTML,
  highlight(code, lang) {
    return new Promise((resolve, reject) => {
      highlightPygmentize(code, lang, res => {
        resolve(res);
      });
    });
  },
  gravatar(email, size) {
    return gravatar.url(email, { s: size, d: 'mm' }).replace('www', 'cn');
  },
  parseTestData(filename) {
    let zip = new AdmZip(filename);
    let list = zip.getEntries().filter(e => !e.isDirectory).map(e => e.entryName);
    let res = [];
    if (!list.includes('data_rule.txt')) {
      res[0] = {};
      res[0].cases = [];
      for (let file of list) {
        let parsedName = path.parse(file);
        if (parsedName.ext === '.in') {
          if (list.includes(`${parsedName.name}.out`)) {
            res[0].cases.push({
              input: file,
              output: `${parsedName.name}.out`
            });
          }

          if (list.includes(`${parsedName.name}.ans`)) {
            res[0].cases.push({
              input: file,
              output: `${parsedName.name}.ans`
            });
          }
        }
      }

      res[0].type = 'sum';
      res[0].score = 100;
      res[0].cases.sort((a, b) => {
        function getLastInteger(s) {
          let re = /(\d+)\D*$/;
          let x = re.exec(s);
          if (x) return parseInt(x[1]);
          else return -1;
        }

        return getLastInteger(a.input) - getLastInteger(b.input);
      });
    } else {
      let lines = zip.readAsText('data_rule.txt').split('\r').join('').split('\n').filter(x => x.length !== 0);

      if (lines.length < 3) throw '无效的数据配置文件（data_rule.txt）。';

      let input = lines[lines.length - 2];
      let output = lines[lines.length - 1];

      for (let s = 0; s < lines.length - 2; ++s) {
        res[s] = {};
        res[s].cases = [];
        let numbers = lines[s].split(' ').filter(x => x);
        if (numbers[0].includes(':')) {
          let tokens = numbers[0].split(':');
          res[s].type = tokens[0] || 'sum';
          res[s].score = parseFloat(tokens[1]) || (100 / (lines.length - 2));
          numbers.shift();
        } else {
          res[s].type = 'sum';
          res[s].score = 100;
        }
        for (let i of numbers) {
          let testcase = {
            input: input.replace('#', i),
            output: output.replace('#', i)
          };

          if (!list.includes(testcase.input)) throw `找不到文件 ${testcase.input}`;
          if (!list.includes(testcase.output)) throw `找不到文件 ${testcase.output}`;
          res[s].cases.push(testcase);
        }
      }

      res = res.filter(x => x.cases && x.cases.length !== 0);
    }

    res.spj = list.includes('spj.js') || list.some(s => s.startsWith('spj_'));
    return res;
  },
  ansiToHTML(s) {
    let Convert = require('ansi-to-html');
    let convert = new Convert({ escapeXML: true });
    return convert.toHtml(s);
  },
  paginate(count, currPage, perPage) {
    currPage = parseInt(currPage);
    if (!currPage || currPage < 1) currPage = 1;

    let pageCnt = Math.ceil(count / perPage);
    if (currPage > pageCnt) currPage = pageCnt;

    return {
      currPage: currPage,
      perPage: perPage,
      pageCnt: pageCnt
    };
  },
  removeTitleTag(s) {
    return s.replace(/「[\S\s]+?」/, '');
  },
  md5(data) {
    let crypto = require('crypto');
    let md5 = crypto.createHash('md5');
    md5.update(data);
    return md5.digest('hex');
  },
  async hitokoto() {
    try {
      let request = require('request-promise');
      let res = await request({
        uri: 'http://api.hitokoto.us/rand',
        timeout: 1500,
        qs: {
          encode: 'json',
          cat: 'a'
        },
        json: true
      });
      if (!res.hitokoto) return null;
      else return res;
    } catch (e) {
      return null;
    }
  },
  isValidUsername(s) {
    return /^[a-zA-Z0-9\-\_]+$/.test(s);
  }
};
