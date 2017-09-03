const Promise = require('bluebird');
const sendmail = Promise.promisify(require('sendmail')());

async function send_sendmail(to, subject, body) {
    await sendmail({
        from: `${syzoj.config.title} <${syzoj.config.register_mail.address}>`,
        to: to,
        type: 'text/html',
        subject: subject,
        html: body
    });
}

module.exports.send = async function sendEmail(to, subject, body) {
    await send_sendmail(to, subject, body);
}