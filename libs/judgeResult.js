"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _ = require("lodash");
const winston = require("winston");
const interfaces = require("./judger_interfaces");
const compileError = "Compile Error", systemError = "System Error", testdataError = "No Testdata";
exports.statusToString = {};
exports.statusToString[interfaces.TestcaseResultType.Accepted] = "Accepted";
exports.statusToString[interfaces.TestcaseResultType.WrongAnswer] = "Wrong Answer";
exports.statusToString[interfaces.TestcaseResultType.PartiallyCorrect] = "Partially Correct";
exports.statusToString[interfaces.TestcaseResultType.MemoryLimitExceeded] = "Memory Limit Exceeded";
exports.statusToString[interfaces.TestcaseResultType.TimeLimitExceeded] = "Time Limit Exceeded";
exports.statusToString[interfaces.TestcaseResultType.OutputLimitExceeded] = "Output Limit Exceeded";
exports.statusToString[interfaces.TestcaseResultType.RuntimeError] = "Runtime Error";
exports.statusToString[interfaces.TestcaseResultType.FileError] = "File Error";
exports.statusToString[interfaces.TestcaseResultType.JudgementFailed] = "Judgement Failed";
exports.statusToString[interfaces.TestcaseResultType.InvalidInteraction] = "Invalid Interaction";
function firstNonAC(t) {
    if (t.every(v => v === interfaces.TestcaseResultType.Accepted)) {
        return interfaces.TestcaseResultType.Accepted;
    }
    else {
        return t.find(r => r !== interfaces.TestcaseResultType.Accepted);
    }
}
exports.firstNonAC = firstNonAC;
function convertResult(taskId, source) {
    winston.debug(`Converting result for ${taskId}`, source);
    let time = null, memory = null, score = null, done = true, statusString = null;
    if (source.compile && source.compile.status === interfaces.TaskStatus.Failed) {
        statusString = compileError;
    }
    else if (source.error != null) {
        done = false;
        if (source.error === interfaces.ErrorType.TestDataError) {
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
        time = forEveryTestcase(c => (c.time ? c.time : 0), _.sum);
        memory = forEveryTestcase(c => (c.memory ? c.memory : 0), _.max);
        if (source.judge.subtasks.some(s => s.cases.some(c => c.status === interfaces.TaskStatus.Failed))) {
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
        statusNumber: done ? interfaces.TaskStatus.Done : interfaces.TaskStatus.Failed,
        statusString: statusString,
        result: source
    };
    winston.debug(`Result for ${taskId}`, result);
    return result;
}
exports.convertResult = convertResult;
//# sourceMappingURL=judgeResult.js.map
