const Bluebird = require('bluebird');
const sendmail = Bluebird.promisify(require('sendmail')());
const { DM } = require('waliyun');
const nodemailer = require('nodemailer');

let doSendEmail;

if (syzoj.config.email.method === "sendmail") {
    doSendEmail = async function send_sendmail(to, subject, body) {
        await sendmail({
            from: `${syzoj.config.title} <${syzoj.config.email.options.address}>`,
            to: to,
            type: 'text/html',
            subject: subject,
            html: body
        });
    }
} else if (syzoj.config.email.method === "aliyundm") {
    const dm = DM({
        AccessKeyId: syzoj.config.email.options.AccessKeyId,
        AccessKeySecret: syzoj.config.email.options.AccessKeySecret
    });
    doSendEmail = async function send_aliyundm(to, subject, body) {
        const result = await dm.singleSendMail({
            AccountName: syzoj.config.email.options.AccountName,
            AddressType: 1,
            ReplyToAddress: false,
            ToAddress: to,
            FromAlias: syzoj.config.title,
            Subject: subject,
            HtmlBody: body
        });
        if (result.Code != null) {
            throw new Error("阿里云 API 错误：" + JSON.stringify(result));
        }
    }
} else if (syzoj.config.email.method === "smtp") {
    const smtpConfig = {
        host: syzoj.config.email.options.host,
        port: syzoj.config.email.options.port || 465,
        secure: (syzoj.config.email.options.port === 465 || !syzoj.config.email.options.port) ? true : false,
        auth: {
            user: syzoj.config.email.options.username,
            pass: syzoj.config.email.options.password,
        },
        tls: {
            rejectUnauthorized: !syzoj.config.email.options.allowUnauthorizedTls,
        },
    };
    const transporter = Bluebird.promisifyAll(nodemailer.createTransport(smtpConfig));

    doSendEmail = async function send_smtp(to, subject, body) {
        await transporter.sendMailAsync({
            from: `"${syzoj.config.title}" <${syzoj.config.email.options.username}>`,
            to: to,
            subject: subject,
            html: body
        });
    };
} else {
    doSendEmail = async () => {
        throw new Error("邮件发送配置不正确。");
    }
}
module.exports.send = doSendEmail;