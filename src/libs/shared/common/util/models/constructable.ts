export type Constructable<T, P extends Array<unknown> = []> = new (...args: P) => T;
