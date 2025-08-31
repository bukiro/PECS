import { isSignal, Signal, WritableSignal } from '@angular/core';

export type SignalType<S> = S extends Signal<infer T> ? T : never;

export type ResolveSignal<T> = T extends Signal<SignalType<T>> ? SignalType<T> : T;

export const isWritableSignal = <T>(value: unknown): value is WritableSignal<T> =>
    isSignal(value) && ('set' in value);


/**
 * Updates the signal with the new value, only if the compare function returns false.
 */
export function setSignalIfUnequal<T>(signalObj: WritableSignal<T>, newValue: T, compareFn: (oldValue: T, newValue: T) => boolean): void {
    const signalValue = signalObj();

    if (!compareFn(signalValue, newValue)) {
        signalObj.set(newValue);
    }
}
