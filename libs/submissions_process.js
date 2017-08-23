const getSubmissionInfo = (s, displayConfig) => ({
    taskId: s.id,
    user: s.user.username,
    userId: s.user_id,
    problemName: s.problem.title,
    problemId: s.problem_id,
    language: displayConfig.hideCode ? null : ((s.language != null && s.language !== '') ? syzoj.config.languages[s.language].show : null),
    codeSize: displayConfig.hideCode ? null : syzoj.utils.formatSize(s.code.length),
    submitTime: syzoj.utils.formatDate(s.submit_time),
});

const getRoughResult = (x, displayConfig) => {
    if (displayConfig.hideResult) {
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
    } else {
        if (x.pending) {
            return null;
        } else {
            return {
                result: x.status,
                time: displayConfig.hideUsage ? null : x.total_time,
                memory: displayConfig.hideUsage ? null : x.max_memory,
                score: displayConfig.hideUsage ? null : x.score
            };
        }
    }
}

module.exports = { getRoughResult, getSubmissionInfo };