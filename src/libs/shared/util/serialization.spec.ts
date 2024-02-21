import { MessageSerializable } from '../definitions/interfaces/serializable';
import { DeepPartial } from '../definitions/types/deepPartial';
import { setupSerialization } from './serialization';

const { assign, forExport, forMessage } = setupSerialization<SerializationTestClass>({
    primitives: [
        'stringProperty',
        'numberProperty',
        'booleanProperty',
        'privateProperty',
    ],
    primitiveArrays: [
        'primitiveArrayProperty',
    ],
    primitiveObjects: [
        'primitiveObjectProperty',
    ],
    primitiveObjectArrays: [
        'primitiveObjectArrayProperty',
    ],
    serializables: {
        serializableProperty:
            () => obj => obj ? SerializationTestClass.from(obj) : undefined,
    },
    serializableArrays: {
        serializableArrayProperty:
            () => obj => SerializationTestClass.from(obj),
    },
    messageSerializables: {
        messageSerializableProperty:
            () => obj => obj ? SerializationTestClass.from(obj) : undefined,
    },
    messageSerializableArrays: {
        messageSerializableArrayProperty:
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
    private _privateProperty = 'privateText';

    public get privateProperty(): string {
        return this._privateProperty;
    }

    public set privateProperty(value: string) {
        this._privateProperty = value;
    }

    public static from(values: DeepPartial<SerializationTestClass>): SerializationTestClass {
        return new SerializationTestClass().with(values);
    }

    public with(values: DeepPartial<SerializationTestClass>): SerializationTestClass {
        assign(this, values);

        return this;
    }

    public forExport(): DeepPartial<SerializationTestClass> {
        return { ...forExport(this) };
    }

    public forMessage(): DeepPartial<SerializationTestClass> {
        return { ...forMessage(this) };
    }

    public clone(): SerializationTestClass {
        return SerializationTestClass.from(this);
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

        it('should assign all primitive object array values present in the new data', () => {
            const newData = {
                primitiveObjectArrayProperty: [
                    {
                        stringProperty: 'newString',
                    },
                ],
            };

            const oldClass = new SerializationTestClass();

            oldClass.primitiveObjectArrayProperty = [
                {
                    stringProperty: 'text',
                    numberProperty: 1,
                    boolProperty: true,
                },
                {
                    stringProperty: 'text',
                    numberProperty: 1,
                    boolProperty: true,
                },
            ];

            const newClass = SerializationTestClass.from(newData);

            expect(newClass.primitiveObjectArrayProperty).toStrictEqual(newData.primitiveObjectArrayProperty);
        });

        it('should assign all serializable values present in the new data', () => {
            const newData = {
                serializableProperty: new SerializationTestClass(),
            };

            const oldClass = new SerializationTestClass();

            expect(oldClass.serializableProperty).not.toStrictEqual(newData.serializableProperty);

            const newClass = SerializationTestClass.from(newData);

            expect(newClass.serializableProperty).toStrictEqual(newData.serializableProperty);
        });

        it('should assign all serializable array values present in the new data', () => {
            const newData = {
                serializableArrayProperty: [
                    new SerializationTestClass(),
                ],
            };

            const oldClass = new SerializationTestClass();

            expect(oldClass.serializableArrayProperty).not.toStrictEqual(newData.serializableArrayProperty);

            const newClass = SerializationTestClass.from(newData);

            expect(newClass.serializableArrayProperty).toStrictEqual(newData.serializableArrayProperty);
        });

        it('should assign all message-serializable values present in the new data', () => {
            const newData = {
                messageSerializableProperty: new SerializationTestClass(),
            };

            const oldClass = new SerializationTestClass();

            expect(oldClass.messageSerializableProperty).not.toStrictEqual(newData.messageSerializableProperty);

            const newClass = SerializationTestClass.from(newData);

            expect(newClass.messageSerializableProperty).toStrictEqual(newData.messageSerializableProperty);
        });

        it('should assign all message-serializable array values present in the new data', () => {
            const newData = {
                messageSerializableArrayProperty: [
                    new SerializationTestClass(),
                ],
            };

            const oldClass = new SerializationTestClass();

            expect(oldClass.messageSerializableArrayProperty).not.toStrictEqual(newData.messageSerializableArrayProperty);

            const newClass = SerializationTestClass.from(newData);

            expect(newClass.messageSerializableArrayProperty).toStrictEqual(newData.messageSerializableArrayProperty);
        });

        it('should not keep any pointers to the input object', () => {
            const oldClass = new SerializationTestClass();

            oldClass.serializableProperty = new SerializationTestClass();

            const newClass = oldClass.clone();

            expect(newClass.booleanProperty).toEqual(oldClass.booleanProperty);
            expect(newClass.serializableProperty).toEqual(oldClass.serializableProperty);
            expect(newClass.serializableProperty).toStrictEqual(oldClass.serializableProperty);
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
