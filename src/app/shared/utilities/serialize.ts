import { Serialized } from './data-transfer-object';

export const serialize = <T>(object: T): Serialized<T> => {
	return JSON.parse(JSON.stringify(object));
};
