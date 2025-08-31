import { Settings } from 'src/libs/shared/app-status/util/models/settings';
import { Feat } from 'src/libs/shared/feats/util/models/feat';
import { RecastFns } from 'src/libs/shared/serialization/util/models/recast-fns';
import { Serialized, MaybeSerialized, Serializable } from 'src/libs/shared/serialization/util/models/serializable';
import { setupSerializationWithHelpers } from 'src/libs/shared/serialization/util/utils/serialization';
import { Creature } from '../../../creatures/util/models/creature';
import { CreatureTypes } from '../../../creatures/util/models/creature-types';
import { CreatureTypeIds } from '../../../creatures/util/models/creature-type-ids';
import { signal, computed, Signal, WritableSignal } from '@angular/core';
import { AbilityBaseValueSetting } from 'src/libs/shared/abilities/util/models/ability-base-value-setting';
import { stringEqualsCaseInsensitive } from 'src/libs/shared/common/util/utils/string-utils';
import { Weapon } from 'src/libs/shared/items/util/models/weapon';
import { Skill } from 'src/libs/shared/skills/util/models/skill';
import { Defaults } from 'src/libs/shared/common/util/models/defaults';
import { ItemCollection } from 'src/libs/shared/items/util/models/item-collection';
import { CharacterClass } from 'src/libs/shared/character/util/models/character-class';
import { CharacterClassLevel } from 'src/libs/shared/character/util/models/character-class-level';
import { cachedSignal } from 'src/libs/shared/common/util/utils/cache-utils';
import { CharacterFeatsAdapter } from 'src/libs/shared/feats/util/utils/creature-feats-adapter/character-feats-adapter';
import { DefaultCreatureAbilitiesAdapter } from 'src/libs/shared/abilities/util/utils/creature-abilities-adapter/default-creature-abilities-adapter';
import { DefaultCreatureSkillsAdapter } from 'src/libs/shared/skills/util/utils/creature-skills-adapter/default-creature-skills-adapter';
import { CreatureHealthAdapter } from 'src/libs/shared/health/util/utils/creature-health-adapter/creature-health-adapter';
import { CharacterSizeAdapter } from 'src/libs/shared/size/util/utils/creature-size-adapter/character-size-adapter';
import { CreatureActivitiesAdapter } from 'src/libs/shared/activities/util/creature-acitivies-adapter/creature-activities-adapter';
import { CreatureSensesAdapter } from 'src/libs/shared/senses/util/utils/creature-senses-adapter/creature-senses-adapter';
import { CreatureSpeedsAdapter } from 'src/libs/shared/speed/util/utils/creature-speeds-adapter/creature-speeds-adapter';
import { CharacterDeitiesAdapter } from 'src/libs/shared/deities/util/utils/character-deities-adapter/character-deities.adapter';
import { CharacterMagicAdapter } from 'src/libs/shared/spells/util/utils/creature-spell-casting-adapter/character-magic-adapter';
import { CharacterMinionsAdapter } from '../utils/character-minions-adapter/character-minions-adapter';

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
            (recastFns, character) => obj => CharacterClass.from(obj, recastFns, character),
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

    public readonly abilitiesAdapter;
    public readonly activitiesAdapter: CreatureActivitiesAdapter;
    public readonly deitiesAdapter;
    public readonly featsAdapter;
    public readonly healthAdapter;
    public readonly magicAdapter;
    public readonly minionsAdapter: CharacterMinionsAdapter;
    public readonly sensesAdapter;
    public readonly skillsAdapter;
    public readonly sizeAdapter;
    public readonly speedsAdapter;

    public readonly level = signal(1);
    public readonly heroPoints = signal(1);
    public readonly experiencePoints = signal(0);
    public readonly partyName = signal('');
    public readonly baseValues = signal<Array<AbilityBaseValueSetting>>([]);
    public readonly class: WritableSignal<CharacterClass>;
    public readonly settings = signal(new Settings());
    public readonly customFeats = signal<Array<Feat>>([]);

    /**
     * The character is considered blank if texts haven't been changed, no class and no basevalues have been chosen,
     * and no items or inventories have been added.
     * Most other changes are only possible after selecting a class.
     */
    public readonly isBlankCharacter$$ = computed(() =>
        !([
            this.alignment() !== 'Neutral',
            !!this.settings().useIndividualAbilityBaseValues(),
            !!this.class().name,
            this.level() > 1,
            !!this.experiencePoints(),
            !!this.name(),
            !!this.partyName(),
            this._areInventoriesTouched$$(),
        ]).includes(true),
    );

    /**
     * If more than one wayfinder with slotted aeon stones is invested, you do not gain the benefits of any of them.
     */
    public hasTooManySlottedAeonStones$$ = computed(() =>
        this.mainInventory$$().activeWornItems$$()
            .filter(item => item.isWayfinder && item.aeonStones().length)
            .length > Defaults.maxInvestedAeonStones,
    );

    private readonly _cache = {
        classLevelFromNumber: new Map<number, Signal<CharacterClassLevel>>(),
    };

    constructor(recastFns: RecastFns) {
        super();

        //Characters get one main inventory and one extra inventory for worn items.
        this.inventories.set([new ItemCollection(), new ItemCollection(Defaults.wornToolsInventoryBulkLimit)]);

        this.abilitiesAdapter = new DefaultCreatureAbilitiesAdapter(this, recastFns);
        this.activitiesAdapter = new CreatureActivitiesAdapter(this, recastFns);
        this.deitiesAdapter = new CharacterDeitiesAdapter(this, recastFns);
        this.featsAdapter = new CharacterFeatsAdapter(this, recastFns);
        this.healthAdapter = new CreatureHealthAdapter(this);
        this.magicAdapter = new CharacterMagicAdapter(this, recastFns);
        this.minionsAdapter = new CharacterMinionsAdapter(this);
        this.sensesAdapter = new CreatureSensesAdapter(this);
        this.skillsAdapter = new DefaultCreatureSkillsAdapter(this, recastFns);
        this.sizeAdapter = new CharacterSizeAdapter(this);
        this.speedsAdapter = new CreatureSpeedsAdapter(this);

        this.class = signal(new CharacterClass(recastFns, this));
    }

    public get requiresConForHP(): boolean { return true; }

    public static from(values: MaybeSerialized<Character>, recastFns: RecastFns): Character {
        return new Character(recastFns).with(values, recastFns);
    }

    public with(values: MaybeSerialized<Character>, recastFns: RecastFns): this {
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

    public clone(recastFns: RecastFns): this {
        return Character.from(this, recastFns) as this;
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

    public classLevelFromNumber$$(number: number): Signal<CharacterClassLevel> {
        return cachedSignal(
            () => computed(() => this.class().levels()[number] ?? new CharacterClassLevel()),
            { store: this._cache.classLevelFromNumber, key: number },
        );
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

    /**
     * Cleanup any custom weapon feats for the given weapon, provided no weapon of the same name exists anymore.
     *
     * @param weapon A weapon whose weapon feats should be tested.
     */
    public markUnneededWeaponFeatsForDeletion(weapon: Weapon): void {
        // Determine if there are any weapon feats for the given weapon.
        // If so, test if there are any weapons left of this name in any inventory.
        const weaponFeats =
            this.customFeats()
                .filter(customFeat => customFeat.generatedWeaponFeat && customFeat.subType === weapon.name);

        if (!weaponFeats.length) {
            return;
        }

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

        // If there are no weapons left of this name in any inventory, all matching weapon feats become useless.
        // Since the player may wish to keep them (e.g. because they have taken the feat and will get the item back),
        // they are marked with canDelete, and the player can decide whether to delete them.
        if (!remainingWeapons.length) {
            this.customFeats()
                .filter(customFeat => customFeat.generatedWeaponFeat && customFeat.subType === weapon.name)
                .forEach(customFeat => {
                    customFeat.canDelete.set(true);
                });
        }
    }
}
