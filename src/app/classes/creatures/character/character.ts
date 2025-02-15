import { Alignments } from 'src/libs/shared/definitions/alignments';
import { AbilityBaseValueSetting } from 'src/libs/shared/definitions/creature-properties/ability-base-value-setting';
import { AbilityBoost } from 'src/libs/shared/definitions/creature-properties/ability-boost';
import { CreatureTypeIds } from 'src/libs/shared/definitions/creature-type-ids';
import { CreatureTypes } from 'src/libs/shared/definitions/creature-types';
import { Defaults } from 'src/libs/shared/definitions/defaults';
import { RecastFns } from 'src/libs/shared/definitions/interfaces/recast-fns';
import { Serialized, MaybeSerialized, Serializable } from 'src/libs/shared/definitions/interfaces/serializable';
import { Feat } from 'src/libs/shared/definitions/models/feat';
import { spellLevelFromCharLevel } from 'src/libs/shared/util/character-utils';
import { setupSerializationWithHelpers } from 'src/libs/shared/util/serialization';
import { Settings } from '../../app/settings';
import { SkillChoice } from '../../character-creation/skill-choice';
import { ItemCollection } from '../../items/item-collection';
import { Weapon } from '../../items/weapon';
import { Skill } from '../../skills/skill';
import { SkillIncrease } from '../../skills/skill-increase';
import { Creature } from '../creature';
import { CharacterClass } from './character-class';
import { CharacterClassLevel } from './character-class-level';
import { BonusDescription } from 'src/libs/shared/definitions/bonuses/bonus-description';
import { computed, Signal, signal } from '@angular/core';
import { matchBooleanFilter, matchStringFilter } from 'src/libs/shared/util/filter-utils';
import { stringEqualsCaseInsensitive } from 'src/libs/shared/util/string-utils';

interface IgnoredMessage { id: string; ttl: number }

const { assign, forExport, isEqual } = setupSerializationWithHelpers<Character>({
    primitives: [
        'appVersionMajor',
        'appVersion',
        'appVersionMinor',
        'yourTurn',
        'experiencePoints',
        'heroPoints',
        'partyName',
    ],
    primitiveArrays: [
        'cash',
    ],
    primitiveObjectArrays: [
        'ignoredMessages',
        'baseValues',
    ],
    serializables: {
        class:
            recastFns => obj => CharacterClass.from(obj, recastFns),
        settings:
            // TO-DO: getters aren't included in spread, so values are missing here (and likely in many other places)
            // Does the obj get mutated in this process? I don't think so - needs to be tested.
            () => obj => Settings.from(obj),
    },
    serializableArrays: {
        customFeats:
            recastFns => obj => Feat.from(obj, recastFns),
    },
});

export class Character extends Creature implements Serializable<Character> {
    public readonly type: CreatureTypes = CreatureTypes.Character;
    public readonly typeId: CreatureTypeIds = CreatureTypeIds.Character;
    public appVersionMajor = 0;
    public appVersion = 0;
    public appVersionMinor = 0;
    //yourTurn is only written when saving the character to the database and read when loading.
    public yourTurn = 0;

    public cash: [number, number, number, number] = [0, Defaults.startingGold, 0, 0];

    public ignoredMessages: Array<IgnoredMessage> = [];

    public readonly heroPoints = signal(1);
    public readonly experiencePoints = signal(0);
    public readonly partyName = signal('');
    public readonly baseValues = signal<Array<AbilityBaseValueSetting>>([]);
    public readonly class = signal(new CharacterClass());
    public readonly settings = signal(new Settings());
    public readonly customFeats = signal<Array<Feat>>([]);

    public baseSize$$ = computed(() =>
        this.class().ancestry().size ?? 0,
    );

    /**
     * The character is considered blank if texts haven't been changed, no class and no basevalues have been chosen,
     * and no items or inventories have been added.
     * Most other changes are only possible after selecting a class.
     */
    public readonly isBlankCharacter$$ = computed(() =>
        ([
            this.alignment() !== Alignments.N,
            this.settings().useIndividualAbilityBaseValues(),
            !!this.class().name,
            this.level() > 1,
            !!this.experiencePoints(),
            !!this.name(),
            !!this.partyName(),
            this._areInventoriesTouched$$(),
        ]).includes(true),
    );

    public readonly maxSpellLevel$$ = computed(() =>
        spellLevelFromCharLevel(this.level()),
    );

    /**
     * If more than one wayfinder with slotted aeon stones is invested, you do not gain the benefits of any of them.
     */
    public hasTooManySlottedAeonStones$$ = computed(() =>
        this.mainInventory$$().activeWornItems$$()
            .filter(item => item.isWayfinder && item.aeonStones.length)
            .length > Defaults.maxInvestedAeonStones,
    );

    constructor() {
        super();

        //Characters get one extra inventory for worn items.
        this.inventories.set([new ItemCollection(), new ItemCollection(Defaults.wornToolsInventoryBulkLimit)]);
    }

    public get requiresConForHP(): boolean { return true; }

    public static from(values: MaybeSerialized<Character>, recastFns: RecastFns): Character {
        return new Character().with(values, recastFns);
    }

    public with(values: MaybeSerialized<Character>, recastFns: RecastFns): Character {
        super.with(values, recastFns);
        assign(this, values, recastFns);

        return this;
    }

    public forExport(): Serialized<Character> {
        return {
            ...super.forExport(),
            ...forExport(this),
        };
    }

    public clone(recastFns: RecastFns): Character {
        return Character.from(this, recastFns);
    }

    public isEqual(compared: Partial<Character>, options?: { withoutId?: boolean }): boolean {
        return super.isEqual(compared, options) && isEqual(this, compared, options);
    }

    public isCharacter(): this is Character {
        return true;
    }

    public canEquipItems(): this is Character {
        return true;
    }

    public baseHP$$(charLevel: number, conModifier: number): Signal<{ result: number; bonuses: Array<BonusDescription> }> {
        return computed(() => {
            const currentClass = this.class();
            const ancestry = currentClass.ancestry();

            const bonuses = new Array<BonusDescription>();
            let result = 0;

            if (currentClass.hitPoints) {
                if (ancestry.name) {
                    result += ancestry.hitPoints;
                    bonuses.push({ title: 'Ancestry base HP', value: String(ancestry.hitPoints) });
                }

                result += (currentClass.hitPoints + conModifier) * charLevel;
                bonuses.push(
                    {
                        title: 'Class base HP',
                        subline: '(multiplied with level)',
                        value: `${ currentClass.hitPoints } (${ currentClass.hitPoints * charLevel })`,
                    },
                    {
                        title: 'Constitution modifier',
                        subline: '(multiplied with level)',
                        value: `${ conModifier } (${ conModifier * charLevel })`,
                    },
                );
            }

            return { result, bonuses };
        });
    }

    public baseSpeed$$(speedName: string): Signal<{ result: number; explain: string }> {
        return computed(() => {
            const currentClass = this.class();
            const ancestry = currentClass.ancestry();

            if (ancestry.name) {
                return ancestry.speeds
                    .filter(speed => matchStringFilter({ value: speed.name, match: speedName }))
                    .reduce(
                        (_, speed) => ({
                            result: speed.value,
                            explain: `${ ancestry.name } base speed: ${ speed.value }`,
                        }),
                        { result: 0, explain: '' },
                    );
            }

            return { result: 0, explain: '' };
        });
    }

    public abilityBoosts$$(
        minLevelNumber: number,
        maxLevelNumber: number,
        abilityName = '',
        type = '',
        source = '',
        sourceId = '',
        locked: boolean | undefined = undefined,
    ): Signal<Array<AbilityBoost>> {
        return computed(() => {
            const flatRecursion = 2;

            const currentClass = this.class();

            const levels = currentClass.levels.filter(level => level.number >= minLevelNumber && level.number <= maxLevelNumber);

            return levels.map(level =>
                level.abilityChoices().map(choice =>
                    choice.boosts.filter(boost =>
                        matchStringFilter({ value: boost.name, match: abilityName })
                        && matchStringFilter({ value: boost.type, match: type })
                        && matchStringFilter({ value: boost.source, match: source })
                        && matchStringFilter({ value: boost.sourceId, match: sourceId })
                        && matchBooleanFilter({ value: boost.locked, match: locked }),
                    ),
                ),
            ).flat(flatRecursion);
        });
    }

    public skillIncreases$$(
        minLevelNumber: number,
        maxLevelNumber: number,
        skillName = '',
        source = '',
        sourceId = '',
        locked: boolean | undefined = undefined,
        excludeTemporary = false,
    ): Signal<Array<SkillIncrease>> {
        return computed(() => {
            //Collect all skill choices from spellcasting, level and some item runes as well as oils that emulate those runes.
            const levels = this.class().levels.filter(level => level.number >= minLevelNumber && level.number <= maxLevelNumber);

            const choices = new Array<SkillChoice>(
                ...levels
                    .map(level =>
                        new Array<SkillChoice>(
                            ...level.skillChoices().filter(choice => excludeTemporary ? !choice.showOnSheet : true),
                            ...level.loreChoices(),
                        ),
                    )
                    .flat(),
                ...this.inventories()
                    .map(inventory =>
                        inventory.activeEquipment$$()
                            .map(item =>
                                new Array<SkillChoice>(
                                    ...item.propertyRunes()
                                        .map(rune => rune.loreChoices)
                                        .flat(),
                                    ...item.oilsApplied()
                                        .map(oil => oil.runeEffect?.loreChoices ?? [])
                                        .flat(),
                                ),
                            )
                            .flat(),
                    )
                    .flat(),
            );

            // When asking for a specific skill, the skill is only considered trained at all
            // if at least one increase has a minRank of 0 (an initial training).
            // If that is not the case, return no trainings.
            if (
                !skillName
                || choices.some(choice =>
                    choice.minRank === 0
                    && choice.increases.some(increase => increase.name === skillName),
                )
            ) {
                //Get all matching skill increases from the choices
                return choices.map(choice =>
                    choice.increases.filter(increase =>
                        matchStringFilter({ value: increase.name, match: skillName })
                        && matchStringFilter({ value: increase.source, match: source })
                        && matchStringFilter({ value: increase.sourceId, match: sourceId })
                        && matchBooleanFilter({ value: increase.locked, match: locked }),
                    ),
                ).flat();
            }

            return [];
        });
    }

    public classLevelFromNumber$$(number: number): Signal<CharacterClassLevel> {
        return signal(this.class().levels[number] ?? new CharacterClassLevel()).asReadonly();
    }

    public addCustomSkill(skillName: string, type: string, abilityName: string, locked = false, recallKnowledge = false): void {
        this.customSkills.update(value => [...value, new Skill(abilityName, skillName, type, locked, recallKnowledge)]);
    }

    public removeCustomSkill(oldSkill: Skill): void {
        this.customSkills.update(value => value.filter(skill => skill !== oldSkill));
    }

    public addCustomFeat(feat: Feat): void {
        this.customFeats.update(value => [...value, feat]);
    }

    public removeCustomFeat(feat: Feat): void {
        this.customFeats.update(value => value.filter(oldFeat => oldFeat !== feat));
    }

    public markUnneededWeaponFeatsForDeletion(weapon: Weapon): void {
        // Whenever a weapon is removed, determine if there are any weapons left of this name in any inventory.
        const remainingWeapons: Array<Weapon> = new Array<Weapon>(
            ...this.inventories()
                .concat(
                    this.class()
                        .animalCompanion()
                        .inventories(),
                    this.class()
                        .familiar()
                        .inventories(),
                )
                .map(inventory => inventory.weapons())
                .flat(),
        )
            .filter(inventoryWeapon =>
                stringEqualsCaseInsensitive(inventoryWeapon.name, weapon.name)
                && inventoryWeapon !== weapon,
            );

        //If there are no weapons left of this name in any inventory, find any custom feat that has it as its subType.
        //These feats are not useful anymore, but the player may wish to keep them.
        //They are marked with canDelete, and the player can decide whether to delete them.
        if (!remainingWeapons.length) {
            this.customFeats()
                .filter(customFeat => customFeat.generatedWeaponFeat && customFeat.subType === weapon.name)
                .forEach(customFeat => {
                    customFeat.canDelete = true;
                });
        }
    }
}
