const luogu = require("./vjudge/lugou");

module.exports = function vjudge(judge_state, problem, onProgress) {
  if (problem.type === "vjudge:luogu") return luogu(judge_state, problem, onProgress);
};

module.exports.languages = {
  luogu: luogu.languages
};
