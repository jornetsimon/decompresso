export interface Timestamp {
	seconds: number;
	nanoseconds: number;
}

export function timestampToDate(timestamp: Timestamp): Date {
	return new Date(timestamp.seconds * 1000);
}
