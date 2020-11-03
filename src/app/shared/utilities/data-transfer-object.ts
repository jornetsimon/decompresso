type DataPropertyNames<T> = {
	// tslint:disable-next-line:ban-types
	[K in keyof T]: T[K] extends Function ? never : K;
}[keyof T];

type RequiredDataPropertyNames<T> = {
	// tslint:disable-next-line:ban-types
	[K in keyof T]: T[K] extends Function
		? never
		: Extract<T[K], undefined> extends never
		? K
		: never;
}[keyof T];
type OptionalDataPropertyNames<T> = {
	// tslint:disable-next-line:ban-types
	[K in keyof T]: T[K] extends Function
		? never
		: Extract<T[K], undefined> extends undefined
		? K
		: never;
}[keyof T];

type DtoOrOriginal<T> = NonNullable<T> extends ReadonlyArray<infer R>
	? ReadonlyArray<DtoOrOriginal<R>>
	: NonNullable<T> extends object
	? Dto<Exclude<T, undefined>>
	: T;

type DataPropertiesOnly<T> = {
	[P in DataPropertyNames<T>]?: DtoOrOriginal<T[P]>;
};
type RequiredDataPropertiesOnly<T> = {
	[P in RequiredDataPropertyNames<T>]: DtoOrOriginal<T[P]>;
};
type OptionalDataPropertiesOnly<T> = {
	[P in OptionalDataPropertyNames<T>]?: DtoOrOriginal<T[P]>;
};

export type Dto<T> = RequiredDataPropertiesOnly<T> & OptionalDataPropertiesOnly<T>;
export type Serialized<T> = DataPropertiesOnly<T>;
