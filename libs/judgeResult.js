"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const winston = require("winston");
const interfaces_1 = require("./judger_interfaces");
const compileError = "Compile Error", systemError = "System Error", testdataError = "No Testdata";
exports.statusToString = {};
exports.statusToString[interfaces_1.TestcaseResultType.Accepted] = "Accepted";
exports.statusToString[interfaces_1.TestcaseResultType.WrongAnswer] = "Wrong Answer";
exports.statusToString[interfaces_1.TestcaseResultType.PartiallyCorrect] = "Partially Correct";
exports.statusToString[interfaces_1.TestcaseResultType.MemoryLimitExceeded] = "Memory Limit Exceeded";
exports.statusToString[interfaces_1.TestcaseResultType.TimeLimitExceeded] = "Time Limit Exceeded";
exports.statusToString[interfaces_1.TestcaseResultType.OutputLimitExceeded] = "Output Limit Exceeded";
exports.statusToString[interfaces_1.TestcaseResultType.RuntimeError] = "Runtime Error";
exports.statusToString[interfaces_1.TestcaseResultType.FileError] = "File Error";
exports.statusToString[interfaces_1.TestcaseResultType.JudgementFailed] = "Judgement Failed";
exports.statusToString[interfaces_1.TestcaseResultType.InvalidInteraction] = "Invalid Interaction";
function firstNonAC(t) {
    if (t.every(v => v === interfaces_1.TestcaseResultType.Accepted)) {
        return interfaces_1.TestcaseResultType.Accepted;
    }
    else {
        return t.find(r => r !== interfaces_1.TestcaseResultType.Accepted);
    }
}
exports.firstNonAC = firstNonAC;
function convertResult(taskId, source) {
    winston.debug(`Converting result for ${taskId}`, source);
    let time = null, memory = null, score = null, done = true, statusString = null;
    if (source.compile && source.compile.status === interfaces_1.TaskStatus.Failed) {
        statusString = compileError;
    }
    else if (source.error != null) {
        done = false;
        if (source.error === interfaces_1.ErrorType.TestDataError) {
            statusString = testdataError;
        }
        else {
            statusString = systemError;
        }
    }
    else if (source.judge != null && source.judge.subtasks != null) {
        const forEveryTestcase = function (map, reduce) {
            const list = source.judge.subtasks.map(s => reduce(s.cases.filter(c => c.result != null).map(c => map(c.result))));
            if (list.every(x => x == null))
                return null;
            else
                return reduce(list);
        };
        time = forEveryTestcase(c => c.time, _.sum);
        memory = forEveryTestcase(c => c.memory, _.max);
        if (source.judge.subtasks.some(s => s.cases.some(c => c.status === interfaces_1.TaskStatus.Failed))) {
            winston.debug(`Some subtasks failed, returning system error`);
            statusString = systemError;
        }
        else {
            score = _.sum(source.judge.subtasks.map(s => s.score));
            const finalResult = forEveryTestcase(c => c.type, firstNonAC);
            statusString = exports.statusToString[finalResult];
        }
    }
    else {
        statusString = systemError;
    }
    const result = {
        taskId: taskId,
        time: time,
        memory: memory,
        score: score,
        statusNumber: done ? interfaces_1.TaskStatus.Done : interfaces_1.TaskStatus.Failed,
        statusString: statusString,
        result: source
    };
    winston.debug(`Result for ${taskId}`, result);
    return result;
}
exports.convertResult = convertResult;
//# sourceMappingURL=judgeResult.js.map
