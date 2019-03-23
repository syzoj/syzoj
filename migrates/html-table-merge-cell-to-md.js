/*
 * This script will help migrate from the old marked-based markdown renderer
 * to the new markdown-it based (syzoj-renderer).
 * 
 * The later doesn't support inline markdown inside HTML blocks. But in
 * LibreOJ that's widely used in problem's limits' cell-merged table displaying
 * displaying. So TeX maths inside are broken.
 */

const cheerio = require('cheerio');

function processMarkdown(text) {
  return text.replace(/(<table(?:[\S\s]+?)<\/table>)/gi, (match, offset, string) => {
    const $ = cheerio.load(match, { decodeEntities: false }),
          table = $('table');

    let defaultAlign = '-';
    if (table.hasClass('center')) defaultAlign = ':-:';
    else if (table.hasClass('left')) defaultAlign = ':-';
    else if (table.hasClass('right')) defaultAlign = '-:';
    
    let columnCount = 0;
    const columnAlign = [];
    table.find('th').each((i, th) => {
      const count = parseInt($(th).attr('colspan')) || 1;
      columnCount += count;

      const style = ($(th).attr('style') || '').split(' ').join('').toLowerCase();
      if (style.includes('text-align:center')) columnAlign.push(':-:');
      else if (style.includes('text-align:left')) columnAlign.push(':-');
      else if (style.includes('text-align:right')) columnAlign.push('-:');
      else columnAlign.push(defaultAlign);
    });

    const rowCount = table.find('tr').length;

    function escape(s) {
      return ` ${s.trim().split('|').join('\\|')} `;
    }

    const matrix = Array(rowCount).fill(null).map(() => []);
    table.find('tr').each((i, tr) => {
      const cells = $(tr).find('th, td');

      let columnIndex = 0, resColumnIndex = 0;
      cells.each((j, td) => {
        while (typeof matrix[i][resColumnIndex] !== 'undefined') resColumnIndex++;

        if (columnIndex >= columnCount) return false;
        if (resColumnIndex >= columnCount) return false;

        const colspan = parseInt($(td).attr('colspan')) || 1,
              rowspan = parseInt($(td).attr('rowspan')) || 1,
              content = $(td).html();
        
        for (let cntRow = 0; cntRow < rowspan; cntRow++) {
          for (let cntCol = 0; cntCol < colspan; cntCol++) {
            if (i + cntRow < rowCount && resColumnIndex + cntCol < columnCount) {
              matrix[i + cntRow][resColumnIndex + cntCol] = escape(content);
            }
          }
        }

        resColumnIndex += colspan;
      });
    });

    const code = [matrix[0], columnAlign, ...matrix.slice(1)].map(row => `|${row.join('|')}|`).join('\n');

    return `<!-- BEGIN: Migrated markdown table -->\n\n${code}\n\n<!-- Migrated from original HTML table:\n${match}\n-->\n\n<!-- END: Migrated markdown table -->`;
  });
}

// Load syzoj.
process.chdir(__dirname + '/..');
require('..');

const modelFields = {
  problem: [
    'description',
    'input_format',
    'output_format',
    'example',
    'limit_and_hint'
  ],
  contest: [
    'information',
    'problems'
  ],
  article: [
    'content'
  ],
  'article-comment': [
    'content'
  ]
};

const fn = async () => {
  for (const model in modelFields) {
    const modelObject = syzoj.model(model);
    const allData = await modelObject.all();

    let cnt = 0, tot = allData.length;
    for (const obj of allData) {
      console.log(`${model}: ${++cnt}/${tot}`);

      let modified = false;

      for (field of modelFields[model]) {
        const processed = processMarkdown(obj[field]);
        if (processed != obj[field]) {
          obj[field] = processed;
          modified = true;
        }
      }

      if (modified) {
        await obj.save();
      }
    }
  }

  process.exit();
};

// NOTE: Uncomment to run.
// fn();
