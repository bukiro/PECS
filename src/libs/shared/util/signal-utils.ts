import { isSignal, Signal, WritableSignal } from '@angular/core';

export type SignalType<S> = S extends Signal<infer T> ? T : never;

export type ResolveSignal<T> = T extends Signal<SignalType<T>> ? SignalType<T> : T;

export const isWritableSignal = <T>(value: unknown): value is WritableSignal<T> =>
    isSignal(value) && ('set' in value);
