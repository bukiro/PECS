import { Uncertain } from '../models/uncertain';

export const isDefined = <T>(obj: T | undefined): obj is T => obj !== undefined;

export const isTruthy = <T>(obj: Uncertain<T>): obj is T => !!obj;
