const enums = require('./enums'),
    rp = require('request-promise'),
    url = require('url');

const util = require('util');
module.exports.judge = async function (judge_state, problem, priority) {
    let type, param, extraFile = null;
    switch (problem.type) {
        case 'submit-answer':
            type = enums.ProblemType.AnswerSubmission;
            param = null;
            extraFile = 'static/uploads/answer/' + judge_state.code;
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

    const req = {
        content: {
            taskId: judge_state.task_id,
            testData: problem.id.toString(),
            type: type,
            priority: priority,
            param: param
        },
        extraFileLocation: extraFile
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