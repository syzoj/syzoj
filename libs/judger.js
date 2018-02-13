const enums = require('./enums'),
    rp = require('request-promise'),
    url = require('url');

const amqp = require('amqplib');
const util = require('util');
const winston = require('winston');
const msgPack = require('msgpack-lite');
const interface = require('./judger_interfaces');
const judgeResult = require('./judgeResult');

let amqpConnection;
let amqpSendChannel;
let amqpConsumeChannel;

async function connect () {
    amqpConnection = await amqp.connect(syzoj.config.rabbitMQ);
    amqpSendChannel = await amqpConnection.createChannel();
    await amqpSendChannel.assertQueue('judge', {
        maxPriority: 5,
        durable: true
    });
    await amqpSendChannel.assertQueue('result', {
        durable: true
    });
    await amqpSendChannel.assertExchange('progress', 'fanout', {
        durable: false
    });
    amqpConsumeChannel = await amqpConnection.createChannel();
    amqpConsumeChannel.prefetch(1);
    winston.debug('Winston test');
    amqpConsumeChannel.consume('result', async (msg) => {
        (async(msg) => {
            const data = msgPack.decode(msg.content);
            winston.verbose('Received report for task ' + data.taskId);
            let JudgeState = syzoj.model('judge_state');
            let judge_state = await JudgeState.findOne({ where: { task_id: data.taskId } });
            if(data.type === interface.ProgressReportType.Finished) {
                const convertedResult = judgeResult.convertResult(data.taskId, data.progress);
                winston.verbose('Reporting report finished: ' + data.taskId);
                const payload = msgPack.encode({ type: interface.ProgressReportType.Reported, taskId: data.taskId });
                amqpSendChannel.publish('progress', '', payload);
                if(!judge_state) return;
                judge_state.score = convertedResult.score;
                judge_state.pending = false;
                judge_state.status = convertedResult.statusString;
                judge_state.total_time = convertedResult.time;
                judge_state.max_memory = convertedResult.memory;
                judge_state.result = convertedResult.result;
                await judge_state.save();
                await judge_state.updateRelatedInfo();
            } else {
                if(!judge_state) return;
                judge_state.compilation = data.progress;
                await judge_state.save();
            }
       })(msg).then(async() => {
            amqpConsumeChannel.ack(msg)
       }, async(err) => {
            winston.error('Error handling report', err);
            amqpConsumeChannel.nack(msg, false, false);
       });
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
    amqpSendChannel.sendToQueue('judge', msgPack.encode({ content: req.content, extraData: null }), { priority: priority });
}

connect();
