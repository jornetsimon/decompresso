import * as functions from 'firebase-functions';
import * as Mail from 'nodemailer/lib/mailer';

const hbs = require('nodemailer-express-handlebars');

const nodeMailer = require('nodemailer');

function createTransporter(): Mail {
	return nodeMailer.createTransport({
		host: 'smtp-relay.gmail.com',
		port: 587,
		secure: false,
		auth: {
			type: 'OAuth2',
			user: 'simon@job-tunnel.com',
			serviceClient: functions.config().nodemailer.client_id,
			privateKey: functions.config().nodemailer.private_key,
		},
	});
}
const templateOptions = {
	viewEngine: {
		extname: '.hbs',
		layoutsDir: 'views/email/',
		defaultLayout: '',
		partialsDir: 'views/partials/',
	},
	viewPath: 'views/email/',
	extName: '.hbs',
};

export function sendMail(
	mailOptions: Mail.Options & { template?: string; context?: Record<string, any> }
) {
	const transporter = createTransporter();
	if (mailOptions.template) {
		transporter.use('compile', hbs(templateOptions));
		mailOptions.attachments = [
			{
				filename: 'logo@2x.png',
				path: 'views/assets/logo@2x.png',
				cid: 'logo',
			},
		];
	}
	return transporter.sendMail(mailOptions);
}
