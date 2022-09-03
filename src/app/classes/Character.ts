import { Skill } from 'src/app/classes/Skill';
import { ClassLevel } from 'src/app/classes/ClassLevel';
import { Class } from 'src/app/classes/Class';
import { Feat } from 'src/app/character-creation/definitions/models/Feat';
import { SkillChoice } from 'src/app/classes/SkillChoice';
import { Settings } from 'src/app/classes/Settings';
import { Creature } from 'src/app/classes/Creature';
import { AbilityBoost } from 'src/app/classes/AbilityBoost';
import { SkillIncrease } from 'src/app/classes/SkillIncrease';
import { FeatTaken } from 'src/app/character-creation/definitions/models/FeatTaken';
import { ItemCollection } from 'src/app/classes/ItemCollection';
import { Defaults } from 'src/libs/shared/definitions/defaults';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { SpellLevelFromCharLevel } from 'src/libs/shared/util/characterUtils';
import { Weapon } from './Weapon';
import { ItemRestoreFn } from 'src/libs/shared/definitions/Types/itemRestoreFn';

export class Character extends Creature {
    public readonly type = CreatureTypes.Character;
    public readonly typeId = 0;
    public appVersionMajor = 0;
    public appVersion = 0;
    public appVersionMinor = 0;
    public ignoredMessages: Array<{ id: string; ttl: number }> = [];
    public partyName = '';
    public baseValues: Array<{ name: string; baseValue: number }> = [];
    public cash: Array<number> = [0, Defaults.startingGold, 0, 0];
    public class: Class = new Class();
    public customFeats: Array<Feat> = [];
    public heroPoints = 1;
    //Characters get one extra inventory for worn items.
    public inventories: Array<ItemCollection> = [new ItemCollection(), new ItemCollection(Defaults.wornToolsInventoryBulkLimit)];
    public experiencePoints = 0;
    public settings: Settings = new Settings();
    public GMMode = false;
    //yourTurn is only written when saving the character to the database and read when loading.
    public yourTurn = 0;
    public get requiresConForHP(): boolean { return true; }

    public recast(restoreFn: ItemRestoreFn): Character {
        super.recast(restoreFn);
        this.class = Object.assign(new Class(), this.class).recast(restoreFn);
        this.customFeats = this.customFeats.map(obj => Object.assign(new Feat(), obj).recast());
        this.settings = Object.assign(new Settings(), this.settings);

        return this;
    }

    public clone(restoreFn: ItemRestoreFn): Character {
        return Object.assign<Character, Character>(new Character(), JSON.parse(JSON.stringify(this))).recast(restoreFn);
    }

    public isCharacter(): this is Character {
        return true;
    }

    public baseSize(): number {
        return this.class.ancestry.size ? this.class.ancestry.size : 0;
    }

    public baseHP(charLevel: number, conModifier: number): { result: number; explain: string } {
        let explain = '';
        let classHP = 0;
        let ancestryHP = 0;

        if (this.class.hitPoints) {
            if (this.class.ancestry.name) {
                ancestryHP = this.class.ancestry.hitPoints;
                explain = `Ancestry base HP: ${ ancestryHP }`;
            }

            classHP = (this.class.hitPoints + conModifier) * charLevel;
            explain += `\nClass: ${ this.class.hitPoints } + CON: ${ this.class.hitPoints + conModifier } per Level: ${ classHP }`;
        }

        return { result: classHP + ancestryHP, explain: explain.trim() };
    }

    public baseSpeed(speedName: string): { result: number; explain: string } {
        let explain = '';
        let sum = 0;

        if (this.class.ancestry.name) {
            this.class.ancestry.speeds.filter(speed => speed.name === speedName).forEach(speed => {
                sum = speed.value;
                explain = `\n${ this.class.ancestry.name } base speed: ${ sum }`;
            });
        }

        return { result: sum, explain: explain.trim() };
    }

    public isBlankCharacter(): boolean {
        // The character is blank if textboxes haven't been used, no class and no basevalues have been chosen,
        // and no items have been added other than the starter items.
        const characterStartingInventoryAmount = 2;

        return (
            !this.class?.name &&
            !this.name &&
            !this.partyName &&
            !this.experiencePoints &&
            this.alignment === 'Neutral' &&
            !this.baseValues.length &&
            this.inventories.length <= characterStartingInventoryAmount &&
            // The character is not blank if any inventory has been touched.
            !this.inventories.some(inv => inv.touched)
        );
    }

    public maxSpellLevel(levelNumber: number = this.level): number {
        return SpellLevelFromCharLevel(levelNumber);
    }

    public abilityBoosts(
        minLevelNumber: number,
        maxLevelNumber: number,
        abilityName = '',
        type = '',
        source = '',
        sourceId = '',
        locked: boolean | undefined = undefined,
    ): Array<AbilityBoost> {
        if (this.class) {
            const boosts: Array<AbilityBoost> = [];
            const levels = this.class.levels.filter(level => level.number >= minLevelNumber && level.number <= maxLevelNumber);

            levels.forEach(level => {
                level.abilityChoices.forEach(choice => {
                    choice.boosts.filter(boost =>
                        (!abilityName || boost.name === abilityName) &&
                        (!type || boost.type === type) &&
                        (!source || boost.source === source) &&
                        (!sourceId || boost.sourceId === sourceId) &&
                        (locked === undefined || boost.locked === locked),
                    ).forEach(boost => {
                        boosts.push(boost);
                    });
                });
            });

            return boosts as Array<AbilityBoost>;
        }

        return [];
    }

    public skillIncreases(
        minLevelNumber: number,
        maxLevelNumber: number,
        skillName = '',
        source = '',
        sourceId = '',
        locked: boolean | undefined = undefined,
        excludeTemporary = false,
    ): Array<SkillIncrease> {
        if (this.class) {
            const increases: Array<SkillIncrease> = [];
            const choices: Array<SkillChoice> = [];
            //Collect all skill choices from spellcasting, level and some item runes as well as oils that emulate those runes.
            const levels = this.class.levels.filter(level => level.number >= minLevelNumber && level.number <= maxLevelNumber);

            levels.forEach(level => {
                choices.push(...level.skillChoices.filter(choice => excludeTemporary ? !choice.showOnSheet : true));
                choices.push(...level.loreChoices);
            });
            this.inventories.forEach(inventory => {
                inventory.allEquipment()
                    .filter(item =>
                        item.propertyRunes
                            .filter(rune => rune.loreChoices && rune.loreChoices.length)
                            .length &&
                        item.investedOrEquipped(),
                    )
                    .forEach(item => {
                        item.propertyRunes.filter(rune => rune.loreChoices && rune.loreChoices.length).forEach(rune => {
                            choices.push(...rune.loreChoices);
                        });
                    });
                inventory.allEquipment()
                    .filter(item =>
                        item.oilsApplied
                            .filter(oil => oil.runeEffect && oil.runeEffect.loreChoices && oil.runeEffect.loreChoices.length)
                            .length &&
                        item.investedOrEquipped(),
                    )
                    .forEach(item => {
                        item.oilsApplied
                            .filter(oil => oil.runeEffect && oil.runeEffect.loreChoices && oil.runeEffect.loreChoices.length)
                            .forEach(oil => {
                                choices.push(...(oil.runeEffect?.loreChoices || []));
                            });
                    });
            });

            // Only return skill increases for a specific skill if at least one increase has a minRank of 0 (an initial training)
            // - if not, we don't consider this skill increased at all.
            if (skillName) {
                if (choices.some(choice => choice.minRank === 0 && choice.increases.some(increase => increase.name === skillName))) {
                    //Get all matching skill increases from the choices
                    choices.forEach(choice => {
                        choice.increases.filter(increase =>
                            (increase.name === skillName) &&
                            (!source || increase.source === source) &&
                            (!sourceId || increase.sourceId === sourceId) &&
                            (locked === undefined || increase.locked === locked),
                        ).forEach(increase => {
                            increases.push(increase);
                        });
                    });
                }
            } else {
                //Get all matching skill increases from the choices
                choices.forEach(choice => {
                    choice.increases.filter(increase =>
                        (!source || increase.source === source) &&
                        (!sourceId || increase.sourceId === sourceId) &&
                        (locked === undefined || increase.locked === locked),
                    ).forEach(increase => {
                        increases.push(increase);
                    });
                });
            }

            return increases;
        } else {
            return [];
        }
    }

    public takenFeats(
        minLevelNumber = 0,
        maxLevelNumber = 0,
        featName = '',
        source = '',
        sourceId = '',
        locked: boolean | undefined = undefined,
        excludeTemporary = false,
        includeCountAs = false,
        automatic: boolean | undefined = undefined,
    ): Array<FeatTaken> {
        if (this.class) {
            const featsTaken: Array<FeatTaken> = [];
            const levels =
                this.class.levels
                    .filter(level =>
                        (
                            !minLevelNumber ||
                            level.number >= minLevelNumber
                        ) &&
                        (!maxLevelNumber || level.number <= maxLevelNumber),
                    );

            levels.forEach(level => {
                level.featChoices.forEach(choice => {
                    choice.feats.filter((taken: FeatTaken) =>
                        (excludeTemporary ? !choice.showOnSheet : true) &&
                        (
                            !featName ||
                            (includeCountAs && (taken.countAsFeat?.toLowerCase() === featName.toLowerCase() || false)) ||
                            (taken.name.toLowerCase() === featName.toLowerCase())
                        ) &&
                        (!source || (taken.source.toLowerCase() === source.toLowerCase())) &&
                        (!sourceId || (taken.sourceId === sourceId)) &&
                        ((locked === undefined && automatic === undefined) || (taken.locked === locked) || (taken.automatic === automatic)),
                    ).forEach(taken => {
                        featsTaken.push(taken);
                    });
                });
            });

            return featsTaken;
        } else {
            return [];
        }
    }

    public addCustomSkill(skillName: string, type: string, abilityName: string, locked = false, recallKnowledge = false): void {
        this.customSkills.push(new Skill(abilityName, skillName, type, locked, recallKnowledge));
    }

    public removeCustomSkill(oldSkill: Skill): void {
        this.customSkills = this.customSkills.filter(skill => skill !== oldSkill);
    }

    public addCustomFeat(feat: Feat): void {
        this.customFeats.push(feat);
    }

    public removeCustomFeat(feat: Feat): void {
        this.customFeats = this.customFeats.filter(oldFeat => oldFeat !== feat);
    }

    public markUnneededWeaponFeatsForDeletion(weapon: Weapon): void {
        //If there are no weapons left of this name in any inventory, find any custom feat that has it as its subType.
        //These feats are not useful anymore, but the player may wish to keep them.
        //They are marked with canDelete, and the player can decide whether to delete them.
        const remainingWeapons: Array<Weapon> = ([] as Array<Weapon>)
            .concat(
                ...this.inventories
                    .concat(
                        this.class?.animalCompanion?.inventories || [],
                        this.class?.familiar?.inventories || [],
                    )
                    .map(inventory => inventory.weapons))
            .filter(inventoryWeapon =>
                inventoryWeapon.name.toLowerCase() === weapon.name.toLowerCase() &&
                inventoryWeapon !== weapon,
            );

        if (!remainingWeapons.length) {
            this.customFeats
                .filter(customFeat => customFeat.generatedWeaponFeat && customFeat.subType === weapon.name)
                .forEach(customFeat => {
                    customFeat.canDelete = true;
                });
        }
    }

    public classLevelFromNumber(number: number): ClassLevel {
        return this.class.levels[number];
    }
}
