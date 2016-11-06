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

let path = require('path');
let renderer = require('moemark-renderer');
let moment = require('moment');
let url = require('url');
let querystring = require('querystring');
let highlightjs = require('highlight.js');
let gravatar = require('gravatar');
let AdmZip = require('adm-zip');

module.exports = {
  resolvePath(s) {
    let a = Array.from(arguments);
    a.unshift(__dirname);
    return path.resolve.apply(null, a);
  },
  markdown(obj, keys) {
    return new Promise((resolve, reject) => {
      if (!keys) {
        if (!obj || !obj.trim()) resolve("");
        else renderer(obj, resolve);
      } else {
        let res = obj, cnt = 0;
        for (let key of keys) {
          if (res[key].trim()) {
            cnt++;
            renderer(res[key], (s) => {
              res[key] = s;
              if (!--cnt) resolve(res);
            });
          }
        }
      }
    });
  },
  formatDate(ts, format) {
    let m = moment(ts * 1000);
    m.locale('zh-cn');
    return m.format(format || 'L H:mm:ss');
  },
  getCurrentTime() {
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
  highlight(code) {
    return highlightjs.highlightAuto(code).value;
  },
  gravatar(email, size) {
    return gravatar.url(email, { s: size, d: 'mm' });
  },
  parseTestData(filename) {
    let zip = new AdmZip(filename);
    let list = zip.getEntries().filter(e => !e.isDirectory).map(e => e.entryName);
    let lines = zip.readAsText('data_rule.txt').split('\n');
    if (lines.length < 3) throw 'Invalid data_rule.txt';

    let numbers = lines[0].split(' ').filter(x => x);
    let input = lines[1];
    let output = lines[2];

    let res = [];
    for (let i of numbers) {
      res[i] = {};
      res[i].input = input.replace('#', i);
      res[i].output = output.replace('#', i);
      if (!list.includes(res[i].input)) throw `Can't find file ${res[i].input}`;
      if (!list.includes(res[i].output)) throw `Can't find file ${res[i].output}`;
    }

    return res.filter(x => x);
  }
};
