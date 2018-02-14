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
            } else if(data.type == interface.ProgressReportType.Compiled) {
                if(!judge_state) return;
                judge_state.compilation = data.progress;
                await judge_state.save();
            } else {
                winston.error("Unsupported result type: " + data.type);
            }
       })(msg).then(async() => {
            amqpConsumeChannel.ack(msg)
       }, async(err) => {
            winston.error('Error handling report', err);
            amqpConsumeChannel.nack(msg, false, false);
       });
    });
    socketio = require('../modules/socketio');
    const progressChannel = await amqpConnection.createChannel();
    const queueName = (await progressChannel.assertQueue('', { exclusive: true })).queue;
    await progressChannel.bindQueue(queueName, 'progress', '');
    await progressChannel.consume(queueName, (msg) => {
        const data = msgPack.decode(msg.content);
        winston.verbose(`Got result from progress exchange, id: ${data.taskId}`);

        (async (result) => {
            if (result.type === interface.ProgressReportType.Started) {
                socketio.createTask(result.taskId);
            } else if (result.type === interface.ProgressReportType.Compiled) {
                socketio.updateCompileStatus(result.taskId, result.progress);
            } else if (result.type === interface.ProgressReportType.Progress) {
                socketio.updateProgress(result.taskId, result.progress);
            } else if (result.type === interface.ProgressReportType.Finished) {
                socketio.updateResult(result.taskId, result.progress);
            } else if (result.type === interface.ProgressReportType.Reported) {
                socketio.cleanupProgress(result.taskId);
            }
        })(data).then(async() => {
            progressChannel.ack(msg)
        }, async(err) => {
            winston.error('Error handling progress', err);
            progressChannel.nack(msg, false, false);
        });
    });
    winston.debug('Created progress exchange queue', queueName);
    amqpConnection.on('error', (err) => {
        winston.error('RabbitMQ connection failure: ${err.toString()}');
        amqpConnection.close();
        process.exit(1);
    });
}
module.exports.connect = connect;

module.exports.judge = async function (judge_state, problem, priority) {
    let type, param, extraData = null;
    switch (problem.type) {
        case 'submit-answer':
            type = enums.ProblemType.AnswerSubmission;
            param = null;
            let fs = Promise.promisifyAll(require('fs-extra'));
            extraData = await fs.readFileAsync(syzoj.model('file').resolvePath('answer', judge_state.code));
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

    amqpSendChannel.sendToQueue('judge', msgPack.encode({ content: content, extraData: extraData }), { priority: priority });
}
