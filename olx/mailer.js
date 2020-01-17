const nodemailer = require('nodemailer');

// async..await is not allowed in global scope, must use a wrapper
function main() {

	// create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        host: 'smtpout.asia.secureserver.net',
        port: 465,
        secure: true, // true for 465, false for other ports
        auth: {
            user: '', // generated ethereal user
            pass: '*' // generated ethereal password
        }
    });

    // send mail with defined transport object
    let info = transporter.sendMail({
        from: '"OLX Notifier" <olx-notifier@sayanispace.com>', // sender address
        to: 'kiliyani.sajeesh@gmail.com', // list of receivers
        subject: 'New OLX Ads', // Subject line
        text: 'Hello world?', // plain text body
        html: '<b>Hello world?</b>' // html body
    });

    console.log('Message sent: %s', info.messageId);
    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

    // Preview only available when sending through an Ethereal account
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
}

main();