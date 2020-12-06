import { User } from '@model/user';
import { Message } from '@model/message';

export type RoomMember = User & { uid: string; last_read_message?: Message };
