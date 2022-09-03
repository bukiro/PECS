import { Item } from 'src/app/classes/Item';

export type ItemRestoreFn = <T extends Item>(obj: T, options?: { type?: string; skipMerge?: boolean }) => T;
