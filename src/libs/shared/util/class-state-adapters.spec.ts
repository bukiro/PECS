import { computed, effect, Injector, runInInjectionContext } from '@angular/core';
import { createAdapter } from './class-state-adapters';
import { TestBed } from '@angular/core/testing';

interface Character {
    name: string;
    class: Class;
}

interface Class {
    levels: Array<Level>;
}

interface Level {
    number: number;
    skills: Array<Skill>;
}

interface Skill {
    name: string;
}

const initialCharacter: Character = { name: '', class: { levels: [] } };
const initialClass: Class = { levels: [] };
const initialLevel: Level = { number: 0, skills: [] };
const initialSkill: Skill = { name: '' };

const characterAdapter =
    createAdapter<Character>(
        initialCharacter,
        { class: value => classAdapter(value) },
    );
const classAdapter = createAdapter<Class>(initialClass, { levels: values => values.map(levelAdapter) });
const levelAdapter = createAdapter<Level>(initialLevel, { skills: values => values.map(skillAdapter) });
const skillAdapter = createAdapter<Skill>(initialSkill, {});

describe('Adapter', () => {
    let injector: Injector;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [
                Injector,
            ],
        });

        injector = TestBed.inject(Injector);
    });

    it('should complete partial information at initialization', () => {
        const character = characterAdapter({ class: undefined });

        expect(character.state().name).toEqual('');
        expect(character.state().class.levels).toEqual([]);
    });

    it('should complete partial information when updating', () => {
        const character = characterAdapter();

        character.adapterState().class.update({ levels: [{ number: 1 }] });

        expect(character.state().class.levels).toEqual([{ number: 1, skills: [] }]);
    });

    it('should complete deep partial information automatically', () => {
        const character = characterAdapter({ class: { levels: [undefined, { number: 1 }] } });

        expect(character.state().name).toEqual('');
        expect(character.state().class.levels[0]).toEqual({ number: 0, skills: [] });
        expect(character.state().class.levels[1]).toEqual({ number: 1, skills: [] });
    });

    it('should update children when the parent updates deeply', () => {
        const character = characterAdapter();

        character.update({ class: { levels: [{ number: 1 }] } });

        expect(character.state().class.levels[0]?.number).toEqual(1);
        expect(character.adapterState().class.adapterState().levels[0]?.state().number).toEqual(1);
    });

    it('should update the parent state when deep children update', () => {
        const character = characterAdapter();

        character.adapterState().class.update({ levels: [{ number: 1 }] });
        character.adapterState().class.adapterState().levels[0]?.update({ number: 2 });

        expect(character.state().class.levels[0]?.number).toEqual(2);
        expect(character.adapterState().class.adapterState().levels[0]?.state().number).toEqual(2);
    });

    it('should be reactive on the parent state', done => {
        const character = characterAdapter();
        const levelNumber = 2;

        const levelNumberSignal = computed(() => character.state().class.levels[0]?.number);

        runInInjectionContext(
            injector,
            () => effect(() => {
                const levelNumberResult = levelNumberSignal();

                expect(levelNumberResult).toEqual(levelNumber);
                done();
            }),
        );

        character.adapterState().class.update({ levels: [{ number: levelNumber }] });
    });

    it('should not trigger listeners more than necessary', done => {
        const character = characterAdapter();
        const levelNumber = 2;

        const levelNumberSignal = computed(() => character.state().class.levels[0]?.number);

        let count = 0;

        runInInjectionContext(
            injector,
            () => effect(() => {
                const levelNumberResult = levelNumberSignal();

                count++;

                expect(levelNumberResult).toEqual(levelNumber);
            }),
        );

        character.adapterState().class.update({ levels: [] });
        character.update({ name: 'name' });
        character.adapterState().class.update({ levels: [{ number: levelNumber }] });

        setTimeout(
            () => {
                expect(count).toEqual(1);
                done();
            },
            100,
        );
    });

    it('should be reactive on the child adapter state', done => {
        const character = characterAdapter();
        const levelNumber = 2;

        const levelNumberSignal = computed(() => character.adapterState().class.adapterState().levels[0]?.state().number);

        runInInjectionContext(
            injector,
            () => effect(() => {
                const levelNumberResult = levelNumberSignal();

                expect(levelNumberResult).toEqual(levelNumber);
                done();
            }),
        );

        character.adapterState().class.update({ levels: [{ number: levelNumber }] });
    });

    it('should be serializable', () => {
        const character = characterAdapter({ name: 'dude' });

        character.adapterState().class.update({ levels: [{ number: 1 }] });

        expect(character.state().class.levels).toEqual([{ number: 1, skills: [] }]);

        const serialized = JSON.stringify(character.state());

        const newCharacter = characterAdapter(JSON.parse(serialized));

        expect(newCharacter.state()).toEqual(character.state());
    });
});
