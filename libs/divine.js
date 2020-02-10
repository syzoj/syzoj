let Random = require('random-js');

let crc32 = require('buffer-crc32');
let hash = x => crc32.unsigned(Buffer(x));

let config = require('../divine.json');

/*
  name: Used for the random seed
  sex: 1 for boys, -1 for girls, 0 for others
 */
module.exports = (name, sex) => {
  if (sex == 1) sex = 'boy';
  else if (sex == -1) sex = 'girl';

  let res = {
    fortune: undefined,
    good: [],
    bad: []
  };

  let date = new Date();
  let h = hash(name + hash(date.getFullYear().toString() + date.getMonth().toString() + date.getDate().toString()));
  let random = new Random(Random.engines.mt19937().seed(h));

  let x = random.integer(1, 100);
  if (x <= 25) res.fortune = '大吉';
  else if (x <= 50) res.fortune = '大凶';
  else if (x <= 60) res.fortune = '中平';
  else if (x <= 70) res.fortune = '小吉';
  else if (x <= 80) res.fortune = '小凶';
  else if (x <= 90) res.fortune = '吉';
  else res.fortune = '凶';

  let items = Array.from(config.items);
  function generate(type) {
    while (1) {
      let id = random.integer(0, items.length - 1);

      if (!items[id]) continue;

      let x = Object.assign({}, items[id]);
      if (typeof x.title === 'object') {
        if (x.title[sex]) x.title = x.title[sex];
        else continue;
      }

      if (!x.detail[type]) continue;

      x.detail = x.detail[type];

      if (typeof x.detail === 'object') {
        if (x.detail[sex]) x.detail = x.detail[sex];
        else continue;
      }

      items[id] = null;

      return x;
    }
  }

  if (res.fortune != '大凶') {
    res.good[0] = generate(0);
    res.good[1] = generate(0);
  }

  if (res.fortune != '大吉') {
    res.bad[0] = generate(1);
    res.bad[1] = generate(1);
  }

  return res;
};
