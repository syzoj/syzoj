const winston = require('winston');
const _ = require('lodash');
const util = require('util');

function formatter(args) {
    var msg = args.level + ' - ' + args.message + (_.isEmpty(args.meta) ? '' : (' - ' + util.inspect(args.meta)));
    return msg;
}

function configureWinston(verbose) {
    winston.configure({
        transports: [
            new (winston.transports.Console)({ formatter: formatter })
        ]
    });
    if (verbose) {
        winston.level = 'debug';
    } else {
        winston.level = 'info';
    }
}

module.exports.configureWinston = configureWinston;
