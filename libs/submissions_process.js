const { getCachedJudgeState } = require('./judger');

const getSubmissionInfo = (s, displayConfig) => ({
    submissionId: s.id,
    taskId: s.task_id,
    user: s.user.username,
    userId: s.user_id,
    problemName: s.problem.title,
    problemId: s.problem_id,
    language: displayConfig.showCode ? ((s.language != null && s.language !== '') ? syzoj.languages[s.language].show : null) : null,
    codeSize: displayConfig.showCode ? s.code_length : null,
    submitTime: syzoj.utils.formatDate(s.submit_time),
});

const getRoughResult = (x, displayConfig, roughOnly) => {
    if (displayConfig.showResult) {
        if (x.pending) {
            let res = getCachedJudgeState(x.task_id) || null;
            if (!res) return null;

            if (roughOnly) {
              return Object.assign({}, res, {
                result: 'Judging',
                time: 0,
                memory: 0,
                score: 0
              });
            } else return res;
        } else {
            return {
                result: x.status,
                time: displayConfig.showUsage ? x.total_time : null,
                memory: displayConfig.showUsage ? x.max_memory : null,
                score: displayConfig.showScore ? x.score : null
            };
        }
    } else {
        // 0: Waiting 1: Running
        if (x.status === "System Error")
            return { result: "System Error" };
        if (x.compilation == null || [0, 1].includes(x.compilation.status)) {
            return null;
        } else {
            if (x.compilation.status === 2) { // 2 is TaskStatus.Done
                return { result: "Submitted" };
            } else {
                return { result: "Compile Error" };
            }
        }
    }
}

const processOverallResult = (source, config) => {
    if (source == null)
        return null;
    if (source.error != null) {
        return {
            error: source.error,
            systemMessage: source.systemMessage
        };
    }
    return {
        compile: source.compile,
        judge: config.showDetailResult ? (source.judge && {
            subtasks: source.judge.subtasks && source.judge.subtasks.map(st => ({
                score: st.score,
                cases: st.cases.map(cs => ({
                    status: cs.status,
                    errorMessage: cs.errorMessage,
                    result: cs.result && {
                        type: cs.result.type,
                        time: config.showUsage ? cs.result.time : undefined,
                        memory: config.showUsage ? cs.result.memory : undefined,
                        scoringRate: cs.result.scoringRate,
                        systemMessage: cs.result.systemMessage,
                        input: config.showTestdata ? cs.result.input : undefined,
                        output: config.showTestdata ? cs.result.output : undefined,
                        userOutput: config.showTestdata ? cs.result.userOutput : undefined,
                        userError: config.showTestdata ? cs.result.userError : undefined,
                        spjMessage: config.showTestdata ? cs.result.spjMessage : undefined,
                    }
                }))
            }))
        }) : null
    };
}

module.exports = { getRoughResult, getSubmissionInfo, processOverallResult };
