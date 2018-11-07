/*
 *  This file is part of moemark-renderer.
 *
 *  Copyright (c) 2016 Menci <huanghaorui301@gmail.com>
 *
 *  moemark-renderer is free software: you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License as published by
 *  the Free Software Foundation, either version 3 of the License, or
 *  (at your option) any later version.
 *
 *  moemark-renderer is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with moemark-renderer. If not, see <http://www.gnu.org/licenses/>.
 */

const pygmentize = require('pygmentize-bundled-cached');

function escapeHTML(s) {
  // Code from http://stackoverflow.com/questions/5251520/how-do-i-escape-some-html-in-javascript/5251551
  return s.replace(/[^0-9A-Za-z ]/g, (c) => {
    return "&#" + c.charCodeAt(0) + ";";
  });
}

module.exports = (code, lang, cb) => {
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
