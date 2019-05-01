let child_process = require('child_process');
let streamToString = require('stream-to-string');
let tempfile = require('tempfile');
let fs = require('fs-extra');

module.exports = async (code, lang) => {
  let timer, result, tempFile;
  try {
    let process, pascalAddProgram;
    if (lang === 'pas') {
      tempFile = tempfile('.pas');

      if (code.indexOf('program') === -1) {
        code = 'program format\n' + code;
        pascalAddProgram = true;
      }

      await fs.writeFile(tempFile, code);
      process = child_process.spawn(`${__dirname}/../bin/jcf`, [tempFile, '-inplace']);
    } else {
      process = child_process.spawn(`clang-format -style="{BasedOnStyle: Google, IndentWidth: 4, AccessModifierOffset: -4, SortIncludes: false, AllowShortIfStatementsOnASingleLine: false, ColumnLimit: 110, Cpp11BracedListStyle: false }" -assume-filename="a.${lang}"`, { shell: true });
      process.stdin.setEncoding('utf-8');
      process.stdin.write(code);
      process.stdin.end();
    }

    timer = setTimeout(() => process.kill(), 5000);

    if (lang === 'pas') {
      await streamToString(process.stdout);
      result = await fs.readFile(tempFile, 'utf-8');
      if (pascalAddProgram) result = result.replace('program format\n', '');
    } else {
      result = await streamToString(process.stdout);
    }

    await new Promise((resolve, reject) => {
      let exit = () => {
        if (process.exitCode === 0) resolve();
        else reject(process.exitCode);
      }

      if (process.exitCode !== null) exit();
      else process.on('close', () => exit());
    });
  } catch (e) {
    console.log(e);
    result = null;
  }

  clearTimeout(timer);
  try { if (tempFile) await fs.delete(tempFile); } catch (e) {}
  return result;
}
