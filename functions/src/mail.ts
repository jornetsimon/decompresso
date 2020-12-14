import * as functions from 'firebase-functions';
import * as Mail from 'nodemailer/lib/mailer';

const nodeMailer = require('nodemailer');

export function sendMail(mailOptions: Mail.Options) {
	const transporter = nodeMailer.createTransport({
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

	return transporter.sendMail(mailOptions);
}
