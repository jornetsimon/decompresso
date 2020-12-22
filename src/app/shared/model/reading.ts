import { Message } from '@model/message';

export interface Reading {
	last_read_message: Message | null;
}
