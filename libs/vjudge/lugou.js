/// <reference types="../interfaces" />

const { LuoguOpenApiClient } = require("@menci/luogu-openapi");

/**
 * @type {LuoguOpenApiClient}
 */
let client;

const onUpstreamProgressCallbacks = new Map();

/**
 * @param {string} trackId 
 * @param {JudgeRecord} data 
 */
function onJudgeProgress(trackId, data) {
  const f = onUpstreamProgressCallbacks.get(trackId);
  if (!f) return;
  f(trackId, data);
}

/**
 * @param {(progress: ProgressReportData) => void} onProgress
 */
module.exports = async function vjudge(judge_state, problem, onProgress) {
  if (!client) {
    client = new LuoguOpenApiClient(syzoj.config.luogu_openapi_token, onJudgeProgress);
  }

  /**
   * @param {JudgeRecord} data
   */
  function onUpstreamProgress(trackId, data) {
    const compile = data.compile ? {
      status: data.compile.success ? /* Done */ 2 : /* Failed */ 3,
      message: data.compile.message
    } : null;
    const judge = data.compile && data.compile.success && data.judge ? {
      subtasks: data.judge.subtasks.map(subtask => ({
        score: subtask.score,
        cases: subtask.cases.map(testcase => {
          const status = {
            [/* Waiting */ 0]: /* Waiting */ 0,
            [/* Judging */ 1]: /* Running */ 1,
            [/* CompileError */ 2]: /* Failed */ 3,
            [/* OutputLimitExceeded */ 3]: /* Done */ 2,
            [/* MemoryLimitExceeded */ 4]: /* Done */ 2,
            [/* TimeLimitExceeded */ 5]: /* Done */ 2,
            [/* WrongAnswer */ 6]: /* Done */ 2,
            [/* RuntimeError */ 7]: /* Done */ 2,
            [/* Invalid */ 11]: /* Skipped */ 4,
            [/* Accepted */ 12]: /* Done */ 2,
            [/* OverallUnaccepted */ 14]: /* Done */ 2
          }[testcase.status];
          return {
            status: status,
            result: status === /* Done */ 2 ? {
              type: {
                [/* Waiting */ 0]: -1,
                [/* Judging */ 1]: -1,
                [/* CompileError */ 2]: -1,
                [/* OutputLimitExceeded */ 3]: /* OutputLimitExceeded */ 6,
                [/* MemoryLimitExceeded */ 4]: /* MemoryLimitExceeded */ 4,
                [/* TimeLimitExceeded */ 5]: /* TimeLimitExceeded */ 5,
                [/* WrongAnswer */ 6]: /* WrongAnswer */ 2,
                [/* RuntimeError */ 7]: /* RuntimeError */ 8,
                [/* Invalid */ 11]: -1,
                [/* Accepted */ 12]: /* Accepted */ 1,
                [/* OverallUnaccepted */ 14]: /* PartiallyCorrect */ 3
              }[testcase.status],
              time: testcase.time,
              memory: testcase.memory,
              scoringRate: testcase.score / 100,
              spjMessage: testcase.description,
              systemMessage: JSON.stringify(testcase, null, 2)
            } : null
          }
        })
      }))
    } : null;
    let finished = false;
    if (compile && judge) {
      finished = ![/* Waiting */ 1, /* Judging */ 2].includes(data.judge.status);
      onProgress({
        taskId: judge_state.task_id,
        type: finished ? /* Finished */ 4 : /* Progress */ 3,
        progress: { compile: compile, judge: judge }
      });
    } else if (compile) {
      finished = !data.compile.success;
      if (finished) {
        onProgress({
          taskId: judge_state.task_id,
          type: /* Finished */ 4,
          progress: { compile: compile }
        });
      } else {
        onProgress({
          taskId: judge_state.task_id,
          type: /* Compiled */ 2,
          progress: compile
        });
      }
    }

    if (finished) onUpstreamProgressCallbacks.delete(trackId);
  }

  try {
    const trackId = await client.submit({
      pid: problem.vjudge_config,
      lang: judge_state.language,
      o2: true,
      code: judge_state.code
    });
    onUpstreamProgressCallbacks.set(trackId, onUpstreamProgress);
  } catch (e) {
    onProgress({
      taskId: judge_state.task_id,
      type: /* Finished */ 4,
      progress: {
        error: /* SystemError */ 0,
        systemMessage: e.stack
      }
    });
  }
};

const languages = {
  "cxx/noi/202107": "ISO C++14 w/ GCC 9.3.0",
  "cxx/98/gcc": "ISO C++98 (GCC)",
  "cxx/11/gcc": "ISO C++11 (GCC)",
  "cxx/14/gcc": "ISO C++14 (GCC)",
  "cxx/17/gcc": "ISO C++17 (GCC)",
  "cxx/20/gcc  ": "ISO C++20 (GCC)",
  "c/99/gcc": "ISO C99 (GCC)",
  "python3/c": "Python 3 (CPython)",
  "python3/py": "Python 3 (PyPy)",
  "pascal/fpc": "Pascal",
  "rust/rustc": "Rust nightly (rustc)",
  "haskell/ghc": "Haskell (GHC)",
  "go": "Go",
  "php": "PHP",
  "ruby": "Ruby",
  "js/node/lts": "Node.js LTS",
  "perl": "Perl",
  "java/8": "Java 8",
  "kotlin/jvm": "Kotlin/JVM",
  "scala": "Scala",
};

module.exports.languages = {};
let i = 0;
for (const l in languages) {
  let base = l.split("/")[0];
  if (base === "cxx") base = "cpp";
  if (base.startsWith("python")) base = "python";
  const lang = {
    index: i++,
    show: languages[l],
    highlight: base,
    editor: base
  };
  if (base === "cpp" || base === "c") lang.format = base;
  module.exports.languages[l] = lang;
}
