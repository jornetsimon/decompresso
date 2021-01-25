import * as functions from 'firebase-functions';
import * as Mail from 'nodemailer/lib/mailer';

const hbs = require('nodemailer-express-handlebars');
const nodeMailer = require('nodemailer');

class EmailSender {
	private readonly transport: Mail;
	private readonly templateOptions = {
		viewEngine: {
			extname: '.hbs',
			layoutsDir: 'views/email/',
			defaultLayout: '',
			partialsDir: 'views/partials/',
		},
		viewPath: 'views/email/',
		extName: '.hbs',
	};

	constructor() {
		this.transport = nodeMailer.createTransport({
			host: 'smtp.gmail.com',
			port: 465,
			secure: true,
			auth: {
				type: 'OAuth2',
				user: 'simon@job-tunnel.com',
				serviceClient: functions.config().nodemailer.client_id,
				privateKey: functions.config().nodemailer.private_key,
			},
			pool: true,
		});
	}

	sendMail(mailOptions: Mail.Options & { template?: string; context?: Record<string, any> }) {
		if (mailOptions.template) {
			this.transport.use('compile', hbs(this.templateOptions));
			mailOptions.attachments = [
				{
					filename: 'logo@2x.png',
					path: 'views/assets/logo@2x.png',
					cid: 'logo',
				},
			];
		}
		return this.transport.sendMail(mailOptions);
	}
}

export default new EmailSender();
