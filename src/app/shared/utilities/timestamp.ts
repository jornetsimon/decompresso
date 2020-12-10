export interface Timestamp {
	seconds: number;
	nanoseconds: number;
}

export function timestampToDate(timestamp: Timestamp): Date {
	return new Date(timestamp.seconds * 1000);
}
export function dateToTimestamp(date: Date): Timestamp {
	return {
		seconds: date.getTime() / 1000,
		nanoseconds: 0,
	};
}
