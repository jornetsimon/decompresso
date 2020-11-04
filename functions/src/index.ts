import { createUser } from './auth';

export enum Endpoints {
	Users = '/users',
	UserPersonalData = '/user_personal_data',
	PublicEmailDomains = 'public_email_domains',
}

exports.createUser = createUser;
