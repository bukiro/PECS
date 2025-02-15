import { Uncertain } from '../definitions/types/uncertain';

export const isDefined = <T>(obj: T | undefined): obj is T => obj !== undefined;

export const isTruthy = <T>(obj: Uncertain<T>): obj is T => !!obj;
