const enums = require('./enums');
const util = require('util');
const winston = require('winston');
const msgPack = require('msgpack-lite');
const fs = require('fs-extra');
const interface = require('./judger_interfaces');
const judgeResult = require('./judgeResult');

const judgeStateCache = new Map();
const progressPusher = require('../modules/socketio');

function getRunningTaskStatusString(result) {
  let isPending = status => [0, 1].includes(status);
  let allFinished = 0, allTotal = 0;
  for (let subtask of result.judge.subtasks) {
    for (let curr of subtask.cases) {
      allTotal++;
      if (!isPending(curr.status)) allFinished++;
    }
  }

  return `Running ${allFinished}/${allTotal}`;
}

let judgeQueue;

async function connect() {
  const JudgeState = syzoj.model('judge_state');

  const  blockableRedisClient = syzoj.redis.duplicate();
  judgeQueue = {
    redisXADD: util.promisify(syzoj.redis.xadd).bind(syzoj.redis),
    async push(data, priority) {
      return await this.redisXADD("{core:queue:default}", "*", "sid", data.content.taskId, "data", JSON.stringify(data));
    },
  };
}
module.exports.connect = connect;

module.exports.judge = async function (judge_state, problem, priority) {
  let type, param, extraData = null;
  switch (problem.type) {
    case 'submit-answer':
      type = enums.ProblemType.AnswerSubmission;
      param = null;
      extraData = await fs.readFile(syzoj.model('file').resolvePath('answer', judge_state.code));
      break;
    case 'interaction':
      type = enums.ProblemType.Interaction;
      param = {
        language: judge_state.language,
        code: judge_state.code,
        timeLimit: problem.time_limit,
        memoryLimit: problem.memory_limit,
      }
      break;
    default:
      type = enums.ProblemType.Standard;
      param = {
        language: judge_state.language,
        code: judge_state.code,
        timeLimit: problem.time_limit,
        memoryLimit: problem.memory_limit,
        fileIOInput: problem.file_io ? problem.file_io_input_name : null,
        fileIOOutput: problem.file_io ? problem.file_io_output_name : null
      };
      break;
  }

  const content = {
    taskId: judge_state.task_id,
    testData: problem.id.toString(),
    type: type,
    priority: priority,
    param: param
  };

  judgeQueue.push({
    content: content,
    extraData: extraData
  }, priority);

  winston.warn(`Judge task ${content.taskId} enqueued.`);
}

module.exports.getCachedJudgeState = taskId => judgeStateCache.get(taskId);
