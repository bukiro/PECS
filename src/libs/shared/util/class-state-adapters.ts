import { signal, WritableSignal } from '@angular/core';

type DeepPartial<T> = Partial<{ [P in keyof T]: DeepPartial<T[P]> }>;

// TYPES

// Helper type to specify Object.entries(AdapterConstructorState) because Object.entries isn't strict
type AdapterConstructorEntries<T extends object> = Array<{
    [K in ObjectKeys<T>]: [K, AdapterConstructor<T, K>];
}[ObjectKeys<T>]>;

// Helper type to determine T of Array<T>
type ArrayType<A extends Array<unknown>> = A extends Array<infer T> ? T : never;

// Any key of T that contains either an object or an array of objects (but not an array of primitives)
type ObjectKeys<T extends object> = {
    [K in keyof T]: T[K] extends Array<object> ? K : T[K] extends Array<unknown> ? never : T[K] extends object ? K : never;
}[keyof T];

type Objects<T extends object> = {
    [K in ObjectKeys<T>]: T[K] extends Array<object> ? T[K] : T[K] extends Array<unknown> ? never : T[K] extends object ? T[K] : never;
};

// An object where all ObjectKeys of T are represented by a matching AdapterEntry
type Adapters<T extends object> = {
    [K in ObjectKeys<T>]: AdapterEntry<T, K>
};

// An Adapter or Array<Adapter> matching the type or array type of T[K]
type AdapterEntry<T extends object, K extends ObjectKeys<T>> =
    T[K] extends Array<object> ? Array<Adapter<ArrayType<T[K]>>> : T[K] extends object ? Adapter<T[K]> : never;

// An object where all ObjectKeys of T are represented by a matching AdapterConstructor
type AdapterConstructors<T extends object> = {
    [K in ObjectKeys<T>]: AdapterConstructor<T, K>;
};

// A constructor function to create an Adapter or Array<Adapter> for T[K]
type AdapterConstructor<T extends object, K extends ObjectKeys<T>> =
    (value: DeepPartial<T[K]>) =>
    T[K] extends Array<object> ? Array<Adapter<ArrayType<T[K]>>> : T[K] extends object ? Adapter<T[K]> : never;

// THE CLASS

class Adapter<T extends object> {
    private _onUpdate?: (state: T) => void;

    constructor(
        public state: WritableSignal<T>,
        public adapterState: WritableSignal<Adapters<T>>,
        private readonly _update: ({ value, state, adapterState }: { value: DeepPartial<T>; state: T; adapterState: Adapters<T> }) =>
        { newState: T; newAdapterState: Adapters<T> },
    ) {
        // After creating the adapterState, register the update function in all of them.
        this._registerOnUpdateOnAdapters();
    }

    public hasOnUpdate(): boolean {
        return !!this._onUpdate;
    }

    public registerOnUpdate(fn: (state: T) => void): void {
        this._onUpdate = fn;
    }

    public update(value: DeepPartial<T>): void {
        // The update function given during construction
        const { newState, newAdapterState } = this._update({ value, state: this.state(), adapterState: this.adapterState() });

        this.state.set({ ...newState });
        this.adapterState.set({ ...newAdapterState });

        // To account for the case of any new adapters in the adapterState, iterate through them and
        this._registerOnUpdateOnAdapters();

        // Run the parent's callback function, if present
        this._onUpdate?.({ ...newState });
    }

    // For every adapter in the adapter state and its arrays,
    // have it register a callback function that updates this state with its changes.
    // I would prefer to create adapters with the update function in the constructor,
    // so they just have it and don't need to get it afterwards.
    private _registerOnUpdateOnAdapters(): void {
        (Object.entries(this.adapterState()) as Array<[ObjectKeys<T>, AdapterEntry<T, ObjectKeys<T>>]>)
            .forEach(([key, adapterOrArray]) => {
                if (Array.isArray(adapterOrArray)) {
                    adapterOrArray.forEach((adapter, index) => {
                        if (adapter.hasOnUpdate()) {
                            return;
                        }

                        adapter.registerOnUpdate(
                            state => {
                                const list = [...(this.state()[key] as Array<typeof state>)];

                                list[index] = { ...state };

                                this.update({ [key]: [...list] } as Partial<T>);
                            },
                        );
                    });
                } else {
                    if (adapterOrArray.hasOnUpdate()) {
                        return;
                    }

                    adapterOrArray.registerOnUpdate(
                        state => {
                            this.update({ [key]: { ...state } } as unknown as Partial<T>);
                        },
                    );
                }
            });
    }
}

// THE ADAPTER FACTORY

export const createAdapter = <T extends object>(initialState: T, childAdapterConstructors: AdapterConstructors<T>) =>
    (partialState?: DeepPartial<T>): Adapter<T> => {
        const startingState: T = { ...initialState, ...partialState };
        // Build the adapter state from the given childAdapterConstructors, using the starting values from the startingState.
        const startingAdapterState =
            (Object.entries(childAdapterConstructors) as AdapterConstructorEntries<T>)
                .reduce<Adapters<T>>(
                (result, [key, fn]) => ({ ...result, [key]: fn(startingState[key]) }),
                {} as Adapters<T>,
            );

        // The adapterConstructors complete deep partial data in the children that may be missing in the initial or partial state.
        // Play this data back into the simple state.
        const completedStartingState: T = {
            ...startingState,
            ...adapterStateSnapshot(startingAdapterState),
        };

        return new Adapter<T>(
            // The main state of the adapter
            signal(completedStartingState),
            // The state containing all child adapters (possibly in arrays)
            signal(startingAdapterState),
            // The update code to generate an updated state and adapter state from any changes
            ({ value, state, adapterState }: { value: DeepPartial<T>; state: T; adapterState: Adapters<T> }) => {
                // For all new values that match a child adapter, create a new adapter with the included constructor function
                const newAdapterState = {
                    ...adapterState,
                    ...Object.fromEntries(
                        (Object.entries(childAdapterConstructors) as AdapterConstructorEntries<T>)
                            .filter(([key]) => key in value)
                            .map(([key, fn]) => {
                                const keyValue = value[key];

                                if (keyValue === undefined) {
                                    return undefined;
                                }

                                return [key, fn(keyValue)];
                            })
                            .filter((result): result is [ObjectKeys<T>, AdapterEntry<T, ObjectKeys<T>>] => !!result),
                    ),
                };

                // Play autocompleted value back into the flat state.
                const newState = {
                    ...state,
                    ...value,
                    ...adapterStateSnapshot(Object.fromEntries(Object.entries(newAdapterState).filter(([key]) => key in value))),
                };

                return {
                    newState,
                    newAdapterState,
                };
            },
        );
    };

const adapterStateSnapshot = <T extends object>(adapterState: Adapters<T>): Objects<T> =>
    Object.fromEntries(
        (Object.entries(adapterState) as Array<[ObjectKeys<T>, AdapterEntry<T, ObjectKeys<T>>]>)
            .map(([key, adapterOrArray]) => [
                key,
                Array.isArray(adapterOrArray)
                    ? adapterOrArray.map(adapter => adapter.state())
                    : adapterOrArray.state(),
            ]),
    ) as Objects<T>;
