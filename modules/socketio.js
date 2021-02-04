Object.defineProperty(exports, "__esModule", { value: true });
const socketio = require("socket.io");
const diff = require("jsondiffpatch");
const jwt = require("jsonwebtoken");
const winston = require("winston");
const judgeResult = require("../libs/judgeResult");
const interfaces = require("../libs/judger_interfaces");
let ioInstance;
let detailProgressNamespace;
let roughProgressNamespace;
let compileProgressNamespace;
const currentJudgeList = {};
const finishedJudgeList = {};
const compiledList = [];
const clientDetailProgressList = {};
const clientDisplayConfigList = {};
const debug = false;

function processOverallResult(source, config) {
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
function getCompileStatus(status) {
    if (["System Error", "Compile Error", "No Testdata"].includes(status)) {
        return status;
    }
    else {
        return "Submitted";
    }
}
function processRoughResult(source, config) {
    const result = config.showResult ?
        source.result :
        getCompileStatus(source.result);
    return {
        result: result,
        time: config.showUsage ? source.time : null,
        memory: config.showUsage ? source.memory : null,
        score: config.showScore ? source.score : null
    };
}
function forAllClients(ns, taskId, exec) {
    ns.in(taskId.toString()).clients((err, clients) => {
        if (!err) {
            clients.forEach(client => {
                exec(client);
            });
        }
        else {
            if (debug) winston.warn(`Error while listing socketio clients in ${taskId}`, err);
        }
    });
}
function initializeSocketIO(s) {
    ioInstance = socketio(s);
    const initializeNamespace = (name, exec) => {
        if (debug) winston.debug('initializing socketIO', name);
        const newNamespace = ioInstance.of('/' + name);
        newNamespace.on('connection', (socket) => {
            socket.on('disconnect', () => {
                if (debug) winston.info(`Client ${socket.id} disconnected.`);
                delete clientDisplayConfigList[socket.id];
                if (clientDetailProgressList[socket.id]) {
                    delete clientDetailProgressList[socket.id];
                }
            });
            socket.on('join', (reqJwt, cb) => {
                if (debug) winston.info(`Client ${socket.id} connected.`);
                let req;
                try {
                    req = jwt.verify(reqJwt, syzoj.config.session_secret);
                    if (req.type !== name) {
                        throw new Error("Request type in token mismatch.");
                    }
                    clientDisplayConfigList[socket.id] = req.displayConfig;
                    const taskId = req.taskId;
                    if (debug) winston.verbose(`A client trying to join ${name} namespace for ${taskId}.`);
                    socket.join(taskId.toString());
                    exec(req, socket).then(x => cb(x), err => cb({ ok: false, message: err.toString() }));
                }
                catch (err) {
                    if (debug) winston.info('Error while joining.');
                    cb({
                        ok: false,
                        message: err.toString()
                    });
                    return;
                }
            });
        });
        return newNamespace;
    };
    detailProgressNamespace = initializeNamespace('detail', async (req, socket) => {
        const taskId = req.taskId;
        if (finishedJudgeList[taskId]) {
            if (debug) winston.debug(`Judge task #${taskId} has been finished, ${JSON.stringify(currentJudgeList[taskId])}`);
            return {
                ok: true,
                running: false,
                finished: true,
                result: processOverallResult(currentJudgeList[taskId], clientDisplayConfigList[socket.id]),
                roughResult: processRoughResult(finishedJudgeList[taskId], clientDisplayConfigList[socket.id])
            };
        }
        else {
            if (debug) winston.debug(`Judge task #${taskId} has not been finished`);
            if (currentJudgeList[taskId]) {
                clientDetailProgressList[socket.id] = {
                    version: 0,
                    content: processOverallResult(currentJudgeList[taskId], clientDisplayConfigList[socket.id])
                };
                return {
                    ok: true,
                    finished: false,
                    running: true,
                    current: clientDetailProgressList[socket.id]
                };
            }
            else {
                return {
                    ok: true,
                    finished: false,
                    running: false
                };
            }
        }
    });
    roughProgressNamespace = initializeNamespace('rough', async (req, socket) => {
        const taskId = req.taskId;
        if (finishedJudgeList[taskId]) {
            return {
                ok: true,
                running: false,
                finished: true,
                result: processRoughResult(finishedJudgeList[taskId], clientDisplayConfigList[socket.id])
            };
        }
        else if (currentJudgeList[taskId]) {
            return {
                ok: true,
                running: true,
                finished: false
            };
        }
        else {
            return {
                ok: true,
                running: false,
                finished: false
            };
        }
    });
    compileProgressNamespace = initializeNamespace('compile', async (req, socket) => {
        const taskId = req.taskId;
        if (compiledList[taskId]) {
            return {
                ok: true,
                running: false,
                finished: true,
                result: compiledList[taskId]
            };
        }
        else if (currentJudgeList[taskId]) {
            return {
                ok: true,
                running: true,
                finished: false
            };
        }
        else {
            return {
                ok: true,
                running: false,
                finished: false
            };
        }
    });

    return ioInstance;
}
exports.initializeSocketIO = initializeSocketIO;
function createTask(taskId) {
    if (debug) winston.debug(`Judge task #${taskId} has started`);
    currentJudgeList[taskId] = {};
    finishedJudgeList[taskId] = null;
    forAllClients(detailProgressNamespace, taskId, (clientId) => {
        clientDetailProgressList[clientId] = {
            version: 0,
            content: {}
        };
    });
    roughProgressNamespace.to(taskId.toString()).emit("start", { taskId: taskId });
    detailProgressNamespace.to(taskId.toString()).emit("start", { taskId: taskId });
    compileProgressNamespace.to(taskId.toString()).emit("start", { taskId: taskId });
}
exports.createTask = createTask;
function updateCompileStatus(taskId, result) {
    if (debug) winston.debug(`Updating compilation status for #${taskId}`);
    compiledList[taskId] = { result: result.status === interfaces.TaskStatus.Done ? 'Submitted' : 'Compile Error' };
    compileProgressNamespace.to(taskId.toString()).emit('finish', {
        taskId: taskId,
        result: compiledList[taskId]
    });
}
exports.updateCompileStatus = updateCompileStatus;
function updateProgress(taskId, data) {
    if (debug) winston.verbose(`Updating progress for #${taskId}`);
    currentJudgeList[taskId] = data;
    const finalResult = judgeResult.convertResult(taskId, data);
    const roughResult = {
        result: "Running",
        time: finalResult.time,
        memory: finalResult.memory,
        score: finalResult.score
    };
    forAllClients(detailProgressNamespace, taskId, (client) => {
        try {
            if (debug) winston.debug(`Pushing progress update to ${client}`);
           if (clientDetailProgressList[client] && clientDisplayConfigList[client]) {
                const original = clientDetailProgressList[client].content;
                const updated = processOverallResult(currentJudgeList[taskId], clientDisplayConfigList[client]);
                const version = clientDetailProgressList[client].version;
                detailProgressNamespace.sockets[client].emit('update', {
                    taskId: taskId,
                    from: version,
                    to: version + 1,
                    delta: diff.diff(original, updated),
                    roughResult: roughResult
                });
                clientDetailProgressList[client].version++;
            }
        } catch (e) {
            console.log(e);
        }
    });
}
exports.updateProgress = updateProgress;
function updateResult(taskId, data) {
    currentJudgeList[taskId] = data;
    if (compiledList[taskId] == null) {
        if (data.error != null) {
            compiledList[taskId] = { result: "System Error" };
            compileProgressNamespace.to(taskId.toString()).emit('finish', {
                taskId: taskId,
                result: compiledList[taskId]
            });
        }
    }
    const finalResult = judgeResult.convertResult(taskId, data);
    const roughResult = {
        result: finalResult.statusString,
        time: finalResult.time,
        memory: finalResult.memory,
        score: finalResult.score
    };
    finishedJudgeList[taskId] = roughResult;
    forAllClients(roughProgressNamespace, taskId, (client) => {
        if (debug) winston.debug(`Pushing rough result to ${client}`);
        roughProgressNamespace.sockets[client].emit('finish', {
            taskId: taskId,
            result: processRoughResult(finishedJudgeList[taskId], clientDisplayConfigList[client])
        });
    });
    forAllClients(detailProgressNamespace, taskId, (client) => {
        if (clientDisplayConfigList[client]) {
            if (debug) winston.debug(`Pushing detail result to ${client}`);
            detailProgressNamespace.sockets[client].emit('finish', {
                taskId: taskId,
                result: processOverallResult(currentJudgeList[taskId], clientDisplayConfigList[client]),
                roughResult: processRoughResult(finishedJudgeList[taskId], clientDisplayConfigList[client])
            });
            delete clientDetailProgressList[client];
        }
    });
}
exports.updateResult = updateResult;
function cleanupProgress(taskId) {
    setTimeout(() => { delete currentJudgeList[taskId]; }, 10000);
}
exports.cleanupProgress = cleanupProgress;
//# sourceMappingURL=socketio.js.map

syzoj.socketIO = initializeSocketIO(app.server);
