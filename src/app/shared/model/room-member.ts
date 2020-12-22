import { User } from '@model/user';

export type RoomMember = User & { uid: string };
