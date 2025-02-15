import { signal } from '@angular/core';
import { MessageSerializable, MaybeSerialized, Serialized } from '../definitions/interfaces/serializable';
import { setupSerialization } from './serialization';

const { assign, forExport, forMessage, isEqual } = setupSerialization<SerializationTestClass>({
    primitives: [
        'stringProperty',
        'numberProperty',
        'booleanProperty',
        'privateProperty',
        'stringProperty$$',
        'numberProperty$$',
        'booleanProperty$$',
    ],
    primitiveArrays: [
        'primitiveArrayProperty',
        'primitiveArrayProperty$$',
    ],
    primitiveObjects: [
        'primitiveObjectProperty',
        'primitiveObjectProperty$$',
    ],
    primitiveObjectArrays: [
        'primitiveObjectArrayProperty',
        'primitiveObjectArrayProperty$$',
    ],
    serializables: {
        serializableProperty:
            () => obj => obj ? SerializationTestClass.from(obj) : undefined,
        serializableProperty$$:
            () => obj => obj ? SerializationTestClass.from(obj) : undefined,
    },
    serializableArrays: {
        serializableArrayProperty:
            () => obj => SerializationTestClass.from(obj),
        serializableArrayProperty$$:
            () => obj => SerializationTestClass.from(obj),
    },
    messageSerializables: {
        messageSerializableProperty:
            () => obj => obj ? SerializationTestClass.from(obj) : undefined,
        messageSerializableProperty$$:
            () => obj => obj ? SerializationTestClass.from(obj) : undefined,
    },
    messageSerializableArrays: {
        messageSerializableArrayProperty:
            () => obj => SerializationTestClass.from(obj),
        messageSerializableArrayProperty$$:
            () => obj => SerializationTestClass.from(obj),
    },
});

class SerializationTestClass implements MessageSerializable<SerializationTestClass> {
    public stringProperty = 'text';
    public numberProperty = 1;
    public booleanProperty = true;
    public primitiveArrayProperty = [
        'text',
        1,
        true,
    ];
    public primitiveObjectProperty = {
        stringProperty: 'text',
        numberProperty: 1,
        boolProperty: true,
    };
    public primitiveObjectArrayProperty = [
        {
            stringProperty: 'text',
            numberProperty: 1,
            boolProperty: true,
        },
    ];
    public serializableProperty?: SerializationTestClass;
    public serializableArrayProperty: Array<SerializationTestClass> = [];
    public messageSerializableProperty?: SerializationTestClass;
    public messageSerializableArrayProperty: Array<SerializationTestClass> = [];

    public stringProperty$$ = signal('text');
    public numberProperty$$ = signal(1);
    public booleanProperty$$ = signal(true);
    public primitiveArrayProperty$$ = signal([
        'text',
        1,
        true,
    ]);
    public primitiveObjectProperty$$ = signal({
        stringProperty: 'text',
        numberProperty: 1,
        boolProperty: true,
    });
    public primitiveObjectArrayProperty$$ = signal([
        {
            stringProperty: 'text',
            numberProperty: 1,
            boolProperty: true,
        },
    ]);
    public serializableProperty$$ = signal<SerializationTestClass | undefined>(undefined);
    public serializableArrayProperty$$ = signal<Array<SerializationTestClass>>([]);
    public messageSerializableProperty$$ = signal<SerializationTestClass | undefined>(undefined);
    public messageSerializableArrayProperty$$ = signal<Array<SerializationTestClass>>([]);

    private _privateProperty = 'privateText';

    public get privateProperty(): string {
        return this._privateProperty;
    }

    public set privateProperty(value: string) {
        this._privateProperty = value;
    }

    public static from(values: MaybeSerialized<SerializationTestClass>): SerializationTestClass {
        return new SerializationTestClass().with(values);
    }

    public with(values: MaybeSerialized<SerializationTestClass>): SerializationTestClass {
        assign(this, values);

        return this;
    }

    public forExport(): Serialized<SerializationTestClass> {
        return { ...forExport(this) };
    }

    public forMessage(): Serialized<SerializationTestClass> {
        return { ...forMessage(this) };
    }

    public clone(): SerializationTestClass {
        return SerializationTestClass.from(this);
    }

    public isEqual(compared: Partial<SerializationTestClass>, options?: { withoutId?: boolean }): boolean {
        return isEqual(this, compared, options);
    }
}

describe('setupSerialization', () => {
    describe('assign', () => {
        it('should assign all primitive values present in the new data', () => {
            const newData = {
                stringProperty: 'newString',
                numberProperty: -1,
                booleanProperty: false,
            };

            const newClass = SerializationTestClass.from(newData);

            expect(newClass.stringProperty).toEqual(newData.stringProperty);
            expect(newClass.numberProperty).toEqual(newData.numberProperty);
            expect(newClass.booleanProperty).toEqual(newData.booleanProperty);
        });

        it('should assign all primitive signal values present in the new data', () => {
            const newData = {
                stringProperty$$: signal('newString'),
                numberProperty$$: signal(-1),
                booleanProperty$$: signal(false),
            };

            const newClass = SerializationTestClass.from(newData);

            expect(newClass.stringProperty$$()).toEqual(newData.stringProperty$$());
            expect(newClass.numberProperty$$()).toEqual(newData.numberProperty$$());
            expect(newClass.booleanProperty$$()).toEqual(newData.booleanProperty$$());
        });

        it('should assign all serialized primitive signal values present in the new data', () => {
            const newData = {
                stringProperty$$: 'newString',
                numberProperty$$: -1,
                booleanProperty$$: false,
            };

            const newClass = SerializationTestClass.from(newData);

            expect(newClass.stringProperty$$()).toEqual(newData.stringProperty$$);
            expect(newClass.numberProperty$$()).toEqual(newData.numberProperty$$);
            expect(newClass.booleanProperty$$()).toEqual(newData.booleanProperty$$);
        });

        it('should assign all primitive array values present in the new data', () => {
            const newData = {
                primitiveArrayProperty: [
                    'newString',
                ],
            };

            expect(new SerializationTestClass().primitiveArrayProperty.length).toBe(3);

            const newClass = SerializationTestClass.from(newData);

            expect(newClass.primitiveArrayProperty).toStrictEqual(newData.primitiveArrayProperty);
            expect(newClass.primitiveArrayProperty.length).toBe(1);
        });

        it('should assign all primitive array signal values present in the new data', () => {
            const newData = {
                primitiveArrayProperty$$: signal([
                    'newString',
                ]),
            };

            expect(new SerializationTestClass().primitiveArrayProperty$$().length).toBe(3);

            const newClass = SerializationTestClass.from(newData);

            expect(newClass.primitiveArrayProperty$$()).toStrictEqual(newData.primitiveArrayProperty$$());
            expect(newClass.primitiveArrayProperty$$().length).toBe(1);
        });

        it('should assign all serialized primitive array signal values present in the new data', () => {
            const newData = {
                primitiveArrayProperty$$: [
                    'newString',
                ],
            };

            expect(new SerializationTestClass().primitiveArrayProperty$$().length).toBe(3);

            const newClass = SerializationTestClass.from(newData);

            expect(newClass.primitiveArrayProperty$$()).toStrictEqual(newData.primitiveArrayProperty$$);
            expect(newClass.primitiveArrayProperty$$().length).toBe(1);
        });

        it('should assign all primitive object values present in the new data', () => {
            const newData = {
                primitiveObjectProperty: {
                    stringProperty: 'newString',
                },
            };

            expect(new SerializationTestClass().primitiveObjectProperty).not.toStrictEqual(newData);

            const newClass = SerializationTestClass.from(newData);

            expect(newClass.primitiveObjectProperty).toStrictEqual(newData.primitiveObjectProperty);
        });

        it('should assign all primitive object signal values present in the new data', () => {
            const newData = {
                primitiveObjectProperty$$: signal({
                    stringProperty: 'newString',
                }),
            };

            expect(new SerializationTestClass().primitiveObjectProperty$$()).not.toStrictEqual(newData);

            const newClass = SerializationTestClass.from(newData);

            expect(newClass.primitiveObjectProperty$$()).toStrictEqual(newData.primitiveObjectProperty$$());
        });

        it('should assign all serialized primitive object signal values present in the new data', () => {
            const newData = {
                primitiveObjectProperty$$: {
                    stringProperty: 'newString',
                },
            };

            expect(new SerializationTestClass().primitiveObjectProperty$$()).not.toStrictEqual(newData);

            const newClass = SerializationTestClass.from(newData);

            expect(newClass.primitiveObjectProperty$$()).toStrictEqual(newData.primitiveObjectProperty$$);
        });

        it('should assign all primitive object array values present in the new data', () => {
            const newData = {
                primitiveObjectArrayProperty: [
                    {
                        stringProperty: 'newString',
                    },
                ],
            };

            const newClass = SerializationTestClass.from(newData);

            expect(newClass.primitiveObjectArrayProperty).toStrictEqual(newData.primitiveObjectArrayProperty);
        });

        it('should assign all primitive object array signal values present in the new data', () => {
            const newData = {
                primitiveObjectArrayProperty$$: signal([
                    {
                        stringProperty: 'newString',
                    },
                ]),
            };

            const newClass = SerializationTestClass.from(newData);

            expect(newClass.primitiveObjectArrayProperty$$()).toStrictEqual(newData.primitiveObjectArrayProperty$$());
        });

        it('should assign all serialized primitive object array signal values present in the new data', () => {
            const newData = {
                primitiveObjectArrayProperty$$: [
                    {
                        stringProperty: 'newString',
                    },
                ],
            };

            const newClass = SerializationTestClass.from(newData);

            expect(newClass.primitiveObjectArrayProperty$$()).toStrictEqual(newData.primitiveObjectArrayProperty$$);
        });

        it('should assign all serializable values present in the new data', () => {
            const newData = {
                serializableProperty: new SerializationTestClass(),
            };

            const oldClass = new SerializationTestClass();

            expect(oldClass.serializableProperty).not.toStrictEqual(newData.serializableProperty);

            const newClass = SerializationTestClass.from(newData);

            expect(newClass.serializableProperty?.isEqual(newData.serializableProperty)).toBeTruthy();
        });

        it('should assign all serializable signal values present in the new data', () => {
            const newData = {
                serializableProperty$$: signal(new SerializationTestClass()),
            };

            const oldClass = new SerializationTestClass();

            expect(oldClass.serializableProperty$$()?.isEqual(newData.serializableProperty$$())).toBeFalsy();

            const newClass = SerializationTestClass.from(newData);

            expect(newClass.serializableProperty$$()?.isEqual(newData.serializableProperty$$())).toBeTruthy();
        });

        it('should assign all serialized serializable signal values present in the new data', () => {
            const newData = {
                serializableProperty$$: new SerializationTestClass(),
            };

            const oldClass = new SerializationTestClass();

            expect(oldClass.serializableProperty$$()?.isEqual(newData.serializableProperty$$)).toBeFalsy();

            const newClass = SerializationTestClass.from(newData);

            expect(newClass.serializableProperty$$()?.isEqual(newData.serializableProperty$$)).toBeTruthy();
        });

        it('should assign all serializable array values present in the new data', () => {
            const newData = {
                serializableArrayProperty: [
                    new SerializationTestClass(),
                ],
            };

            const oldClass = new SerializationTestClass();

            expect(
                oldClass.serializableArrayProperty.length === newData.serializableArrayProperty.length
                && oldClass.serializableArrayProperty
                    .every((serializable, index) =>
                        newData.serializableArrayProperty[index] &&
                        serializable.isEqual(newData.serializableArrayProperty[index]),
                    ),
            ).toBeFalsy();

            const newClass = SerializationTestClass.from(newData);

            expect(
                newClass.serializableArrayProperty.length === newData.serializableArrayProperty.length
                && newClass.serializableArrayProperty
                    .every((serializable, index) =>
                        newData.serializableArrayProperty[index] &&
                        serializable.isEqual(newData.serializableArrayProperty[index]),
                    ),
            ).toBeTruthy();
        });

        it('should assign all serializable array signal values present in the new data', () => {
            const newData = {
                serializableArrayProperty$$: signal([
                    new SerializationTestClass(),
                ]),
            };

            const oldClass = new SerializationTestClass();

            expect(
                oldClass.serializableArrayProperty$$().length === newData.serializableArrayProperty$$().length
                && oldClass.serializableArrayProperty$$()
                    .every((serializable, index) =>
                        newData.serializableArrayProperty$$()[index] &&
                        serializable.isEqual(newData.serializableArrayProperty$$()[index] ?? {}),
                    ),
            ).toBeFalsy();

            const newClass = SerializationTestClass.from(newData);

            expect(
                newClass.serializableArrayProperty$$().length === newData.serializableArrayProperty$$().length
                && newClass.serializableArrayProperty$$()
                    .every((serializable, index) =>
                        newData.serializableArrayProperty$$()[index] &&
                        serializable.isEqual(newData.serializableArrayProperty$$()[index] ?? {}),
                    ),
            ).toBeTruthy();
        });

        it('should assign all serialized serializable array signal values present in the new data', () => {
            const newData = {
                serializableArrayProperty$$: [
                    new SerializationTestClass(),
                ],
            };

            const oldClass = new SerializationTestClass();

            expect(
                oldClass.serializableArrayProperty$$().length === newData.serializableArrayProperty$$.length
                && oldClass.serializableArrayProperty$$()
                    .every((serializable, index) =>
                        newData.serializableArrayProperty$$[index] &&
                        serializable.isEqual(newData.serializableArrayProperty$$[index]),
                    ),
            ).toBeFalsy();

            const newClass = SerializationTestClass.from(newData);

            expect(
                newClass.serializableArrayProperty$$().length === newData.serializableArrayProperty$$.length
                && newClass.serializableArrayProperty$$()
                    .every((serializable, index) =>
                        newData.serializableArrayProperty$$[index] &&
                        serializable.isEqual(newData.serializableArrayProperty$$[index]),
                    ),
            ).toBeTruthy();
        });

        it('should assign all message-serializable values present in the new data', () => {
            const newData = {
                messageSerializableProperty: new SerializationTestClass(),
            };

            const oldClass = new SerializationTestClass();

            expect(oldClass.messageSerializableProperty?.isEqual(newData.messageSerializableProperty)).toBeFalsy();

            const newClass = SerializationTestClass.from(newData);

            expect(newClass.messageSerializableProperty?.isEqual(newData.messageSerializableProperty)).toBeTruthy();
        });

        it('should assign all message-serializable signal values present in the new data', () => {
            const newData = {
                messageSerializableProperty$$: signal(new SerializationTestClass()),
            };

            const oldClass = new SerializationTestClass();

            expect(oldClass.messageSerializableProperty$$()?.isEqual(newData.messageSerializableProperty$$())).toBeFalsy();

            const newClass = SerializationTestClass.from(newData);

            expect(newClass.messageSerializableProperty$$()?.isEqual(newData.messageSerializableProperty$$())).toBeTruthy();
        });

        it('should assign all serialized message-serializable signal values present in the new data', () => {
            const newData = {
                messageSerializableProperty$$: new SerializationTestClass(),
            };

            const oldClass = new SerializationTestClass();

            expect(oldClass.messageSerializableProperty$$()?.isEqual(newData.messageSerializableProperty$$)).toBeFalsy();

            const newClass = SerializationTestClass.from(newData);

            expect(newClass.messageSerializableProperty$$()?.isEqual(newData.messageSerializableProperty$$)).toBeTruthy();
        });

        it('should assign all message-serializable array values present in the new data', () => {
            const newData = {
                messageSerializableArrayProperty: [
                    new SerializationTestClass(),
                ],
            };

            const oldClass = new SerializationTestClass();

            expect(
                oldClass.messageSerializableArrayProperty.length === newData.messageSerializableArrayProperty.length
                && oldClass.messageSerializableArrayProperty
                    .every((serializable, index) =>
                        newData.messageSerializableArrayProperty[index] &&
                        serializable.isEqual(newData.messageSerializableArrayProperty[index]),
                    ),
            ).toBeFalsy();

            const newClass = SerializationTestClass.from(newData);

            expect(
                newClass.messageSerializableArrayProperty.length === newData.messageSerializableArrayProperty.length
                && newClass.messageSerializableArrayProperty
                    .every((serializable, index) =>
                        newData.messageSerializableArrayProperty[index] &&
                        serializable.isEqual(newData.messageSerializableArrayProperty[index]),
                    ),
            ).toBeTruthy();
        });

        it('should assign all message-serializable array signal values present in the new data', () => {
            const newData = {
                messageSerializableArrayProperty$$: signal([
                    new SerializationTestClass(),
                ]),
            };

            const oldClass = new SerializationTestClass();

            expect(
                oldClass.messageSerializableArrayProperty$$().length === newData.messageSerializableArrayProperty$$().length
                && oldClass.messageSerializableArrayProperty$$()
                    .every((serializable, index) =>
                        newData.messageSerializableArrayProperty$$()[index] &&
                        serializable.isEqual(newData.messageSerializableArrayProperty$$()[index] ?? {}),
                    ),
            ).toBeFalsy();

            const newClass = SerializationTestClass.from(newData);

            expect(
                newClass.messageSerializableArrayProperty$$().length === newData.messageSerializableArrayProperty$$().length
                && newClass.messageSerializableArrayProperty$$()
                    .every((serializable, index) =>
                        newData.messageSerializableArrayProperty$$()[index] &&
                        serializable.isEqual(newData.messageSerializableArrayProperty$$()[index] ?? {}),
                    ),
            ).toBeTruthy();
        });

        it('should assign all serialized message-serializable array signal values present in the new data', () => {
            const newData = {
                messageSerializableArrayProperty$$: [
                    new SerializationTestClass(),
                ],
            };

            const oldClass = new SerializationTestClass();

            expect(
                oldClass.messageSerializableArrayProperty$$().length === newData.messageSerializableArrayProperty$$.length
                && oldClass.messageSerializableArrayProperty$$()
                    .every((serializable, index) =>
                        newData.messageSerializableArrayProperty$$[index] &&
                        serializable.isEqual(newData.messageSerializableArrayProperty$$[index]),
                    ),
            ).toBeFalsy();

            const newClass = SerializationTestClass.from(newData);

            expect(
                newClass.messageSerializableArrayProperty$$().length === newData.messageSerializableArrayProperty$$.length
                && newClass.messageSerializableArrayProperty$$()
                    .every((serializable, index) =>
                        newData.messageSerializableArrayProperty$$[index] &&
                        serializable.isEqual(newData.messageSerializableArrayProperty$$[index]),
                    ),
            ).toBeTruthy();
        });

        it('should not keep any pointers to the input object', () => {
            const oldClass = new SerializationTestClass();

            oldClass.serializableProperty = new SerializationTestClass();

            const newClass = oldClass.clone();

            expect(newClass.booleanProperty).toEqual(oldClass.booleanProperty);
            expect(newClass.serializableProperty?.isEqual(oldClass.serializableProperty)).toBeTruthy();
            expect(newClass.serializableProperty).not.toBe(oldClass.serializableProperty);

            newClass.booleanProperty = !newClass.booleanProperty;

            if (newClass.serializableProperty) {
                newClass.serializableProperty.booleanProperty = !newClass.serializableProperty.booleanProperty;
            }

            expect(newClass.booleanProperty).not.toEqual(oldClass.booleanProperty);
            expect(newClass.serializableProperty?.booleanProperty).not.toEqual(oldClass.serializableProperty?.booleanProperty);
        });

        it('should use getters and setters correctly', () => {
            const newText = 'newText';
            const oldClass = new SerializationTestClass();

            oldClass.privateProperty = newText;

            const newClass = oldClass.clone();

            expect(newClass.privateProperty).toEqual(oldClass.privateProperty);
            expect(newClass.privateProperty).toEqual(newText);
        });
    });
});
