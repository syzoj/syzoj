"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var RPCTaskType;
(function (RPCTaskType) {
    RPCTaskType[RPCTaskType["Compile"] = 1] = "Compile";
    RPCTaskType[RPCTaskType["RunStandard"] = 2] = "RunStandard";
    RPCTaskType[RPCTaskType["RunSubmitAnswer"] = 3] = "RunSubmitAnswer";
    RPCTaskType[RPCTaskType["RunInteraction"] = 4] = "RunInteraction";
})(RPCTaskType = exports.RPCTaskType || (exports.RPCTaskType = {}));
;
var ErrorType;
(function (ErrorType) {
    ErrorType[ErrorType["SystemError"] = 0] = "SystemError";
    ErrorType[ErrorType["TestDataError"] = 1] = "TestDataError";
})(ErrorType = exports.ErrorType || (exports.ErrorType = {}));
var TaskStatus;
(function (TaskStatus) {
    TaskStatus[TaskStatus["Waiting"] = 0] = "Waiting";
    TaskStatus[TaskStatus["Running"] = 1] = "Running";
    TaskStatus[TaskStatus["Done"] = 2] = "Done";
    TaskStatus[TaskStatus["Failed"] = 3] = "Failed";
    TaskStatus[TaskStatus["Skipped"] = 4] = "Skipped";
})(TaskStatus = exports.TaskStatus || (exports.TaskStatus = {}));
var TestcaseResultType;
(function (TestcaseResultType) {
    TestcaseResultType[TestcaseResultType["Accepted"] = 1] = "Accepted";
    TestcaseResultType[TestcaseResultType["WrongAnswer"] = 2] = "WrongAnswer";
    TestcaseResultType[TestcaseResultType["PartiallyCorrect"] = 3] = "PartiallyCorrect";
    TestcaseResultType[TestcaseResultType["MemoryLimitExceeded"] = 4] = "MemoryLimitExceeded";
    TestcaseResultType[TestcaseResultType["TimeLimitExceeded"] = 5] = "TimeLimitExceeded";
    TestcaseResultType[TestcaseResultType["OutputLimitExceeded"] = 6] = "OutputLimitExceeded";
    TestcaseResultType[TestcaseResultType["FileError"] = 7] = "FileError";
    TestcaseResultType[TestcaseResultType["RuntimeError"] = 8] = "RuntimeError";
    TestcaseResultType[TestcaseResultType["JudgementFailed"] = 9] = "JudgementFailed";
    TestcaseResultType[TestcaseResultType["InvalidInteraction"] = 10] = "InvalidInteraction";
})(TestcaseResultType = exports.TestcaseResultType || (exports.TestcaseResultType = {}));
var RPCReplyType;
(function (RPCReplyType) {
    RPCReplyType[RPCReplyType["Started"] = 1] = "Started";
    RPCReplyType[RPCReplyType["Finished"] = 2] = "Finished";
    RPCReplyType[RPCReplyType["Error"] = 3] = "Error";
})(RPCReplyType = exports.RPCReplyType || (exports.RPCReplyType = {}));
var ProgressReportType;
(function (ProgressReportType) {
    ProgressReportType[ProgressReportType["Started"] = 1] = "Started";
    ProgressReportType[ProgressReportType["Compiled"] = 2] = "Compiled";
    ProgressReportType[ProgressReportType["Progress"] = 3] = "Progress";
    ProgressReportType[ProgressReportType["Finished"] = 4] = "Finished";
    ProgressReportType[ProgressReportType["Reported"] = 5] = "Reported";
})(ProgressReportType = exports.ProgressReportType || (exports.ProgressReportType = {}));
exports.redisBinarySuffix = '-bin';
exports.redisMetadataSuffix = '-meta';
//# sourceMappingURL=interfaces.js.map