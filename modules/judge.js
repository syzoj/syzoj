const enums = require('./enums'),
    rp = require('request-promise'),
    url = require('url');

module.exports.judge = async function (judge_state, priority) {
    let type, param;
    switch (judge_state.problem.type) {
        case 'submit-answer':
            type = enums.ProblemType.AnswerSubmission;
            break;
        case 'interaction':
            type = enums.ProblemType.Interaction;
            break;
        default:
            type = enums.ProblemType.Standard;
            param = {
                language: judge_state.language,
                code: judge_state.code,
                timeLimit: judge_state.problem.time_limit,
                memoryLimit: judge_state.problem.memory_limit,
                fileIOInput: judge_state.problem.file_io ? judge_state.problem.file_io_input_name : null,
                fileIOOutput: judge_state.problem.file_io ? judge_state.problem.file_io_output_name : null
            };
            break;
    }

    const req = {
        taskId: judge_state.id,
        testData: judge_state.problem.id.toString(),
        type: type,
        priority: priority,
        param: param
    };

    await rp(url.resolve(syzoj.config.judge_server_addr, "/daemon/task"), {
        method: 'PUT',
        body: req,
        headers: {
            Token: syzoj.config.judge_token
        },
        json: true,
        simple: true
    });
}