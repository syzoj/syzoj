const enums = require('./enums'),
    rp = require('request-promise'),
    url = require('url');

const amqp = require('amqplib');
const util = require('util');
const winston = require('winston');
const msgPack = require('msgpack-lite');

let amqpConnection;
let publicChannel;

async function connect () {
    amqpConnection = await amqp.connect(syzoj.config.rabbitMQ);
    publicChannel = await amqpConnection.createChannel();
    await publicChannel.assertQueue('judge', {
        maxPriority: 5,
        durable: true
    });
    await publicChannel.assertQueue('result', {
        durable: true
    });
    await publicChannel.assertExchange('progress', 'fanout', {
        durable: false
    });
    amqpConnection.on('error', (err) => {
        winston.error('RabbitMQ connection failure: ${err.toString()}');
        amqpConnection.close();
        process.exit(1);
    });
}
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

    // TODO: parse extraFileLocation
    publicChannel.sendToQueue('judge', msgPack.encode({ content: req.content, extraData: null }), { priority: priority });
}

connect();
