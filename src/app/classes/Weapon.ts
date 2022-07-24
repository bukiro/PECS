/* eslint-disable complexity */
/* eslint-disable max-lines */
import { CharacterService } from 'src/app/services/character.service';
import { EffectsService } from 'src/app/services/effects.service';
import { WornItem } from 'src/app/classes/WornItem';
import { Equipment } from 'src/app/classes/Equipment';
import { WeaponRune } from 'src/app/classes/WeaponRune';
import { Specialization } from 'src/app/classes/Specialization';
import { Character } from 'src/app/classes/Character';
import { AnimalCompanion } from 'src/app/classes/AnimalCompanion';
import { Oil } from 'src/app/classes/Oil';
import { SpecializationGain } from 'src/app/classes/SpecializationGain';
import { AlchemicalPoison } from 'src/app/classes/AlchemicalPoison';
import { ProficiencyChange } from 'src/app/classes/ProficiencyChange';
import { Effect } from 'src/app/classes/Effect';
import { Creature } from 'src/app/classes/Creature';
import { ItemsService } from 'src/app/services/items.service';
import { TypeService } from 'src/app/services/type.service';
import { WeaponMaterial } from 'src/app/classes/WeaponMaterial';
import { RefreshService } from 'src/app/services/refresh.service';
import { Item } from './Item';
import { DiceSizeBaseStep, DiceSizes } from 'src/libs/shared/definitions/diceSizes';
import { WeaponProficiencies } from 'src/libs/shared/definitions/weaponProficiencies';
import { MaxSkillLevel, skillLevelBaseStep } from 'src/libs/shared/definitions/skillLevels';
import { SignNumber } from 'src/libs/shared/util/numberUtils';
import { SkillLevelName } from 'src/libs/shared/util/skillUtils';
import { BasicRuneLevels } from 'src/libs/shared/definitions/basicRuneLevels';
import { Familiar } from './Familiar';

export interface AttackResult {
    range: string;
    attackResult: number;
    explain: string;
    effects: Array<Effect>;
    penalties: Array<Effect>;
    bonuses: Array<Effect>;
    absolutes: Array<Effect>;
}
export interface DamageResult {
    damageResult: string;
    explain: string;
    penalties: Array<Effect>;
    bonuses: Array<Effect>;
    absolutes: Array<Effect>;
}

interface RuneSourceSet {
    fundamentalRunes: Weapon | WornItem;
    propertyRunes: Weapon | WornItem;
    reason?: Weapon | WornItem;
}
interface EmblazonArmamentSet {
    type: string;
    choice: string;
    deity: string;
    alignment: string;
    emblazonDivinity: boolean;
    source: string;
}
enum ShoddyPenalties {
    NotShoddy = 0,
    Shoddy = -2,
}

export class Weapon extends Equipment {
    //Weapons should be type "weapons" to be found in the database
    public type = 'weapons';
    //Weapons are usually moddable.
    public moddable = true;
    /** What type of ammo is used? (Bolts, arrows...) */
    public ammunition = '';
    /** What happens on a critical hit with this weapon? */
    public criticalHint = '';
    /** Number of dice for Damage: usually 1 for an unmodified weapon. Use 0 to notate exactly <dicesize> damage (e.g. 1 damage = 0d1). */
    public dicenum = 1;
    /** Size of the damage dice: usually 4-12, but can be 0, 1, etc. */
    public dicesize = DiceSizes.D6;
    /** What is the damage type? Usually S, B or P, but may include combinations". */
    public dmgType = '';
    /** Some weapons add additional damage like +1d4F. Use get_ExtraDamage() to read. */
    public readonly extraDamage = '';
    /** The weapon group, needed for critical specialization effects. */
    public group = '';
    /** How many hands are needed to wield this weapon? */
    public hands = '';
    /** Melee range in ft: 5 or 10 for weapons with Reach trait. */
    public melee = 0;
    /** Store any poisons applied to this item. There should be only one poison at a time. */
    public poisonsApplied: Array<AlchemicalPoison> = [];
    /**
     * What proficiency is used? "Simple Weapons", "Unarmed Attacks", etc.?
     * Use get_Proficiency() to get the proficiency for numbers and effects.
     */
    public prof: WeaponProficiencies = WeaponProficiencies.Simple;
    /**
     * Ranged range in ft - also add for thrown weapons.
     * Weapons can have a melee and a ranged value, e.g. Daggers that can thrown.
     */
    public ranged = 0;
    /** How many actions to reload this ranged weapon? */
    public reload = '';
    /** What kind of weapon is this based on? Needed for weapon proficiencies for specific magical items. */
    public weaponBase = '';
    /** Giant Instinct Barbarians can wield larger weapons. */
    public large = false;
    /** A Champion with the Divine Ally: Blade Ally Feat can designate one weapon or handwraps as his blade ally. */
    public bladeAlly = false;
    /** A Dwarf with the Battleforger feat can sharpen a weapon to grant the effect of a +1 potency rune. */
    public battleforged = false;
    /**
     * A Cleric with the Emblazon Armament feat can give a bonus to a shield or weapon that only works for followers of the same deity.
     * Subsequent feats can change options and restrictions of the functionality.
     */
    public emblazonArmament: Array<EmblazonArmamentSet> = [];
    public $emblazonArmament = false;
    public $emblazonEnergy = false;
    public $emblazonAntimagic = false;
    /** Dexterity-based melee attacks force you to use dexterity for your attack modifier. */
    public dexterityBased = false;
    /** If useHighestAttackProficiency is true, the proficiency level will be copied from your highest unarmed or weapon proficiency. */
    public useHighestAttackProficiency = false;
    public $traits: Array<string> = [];
    /** Shoddy weapons take a -2 penalty to attacks. */
    public $shoddy: ShoddyPenalties = ShoddyPenalties.NotShoddy;
    public get secondaryRune(): BasicRuneLevels {
        return this.strikingRune;
    }
    public set secondaryRune(value: BasicRuneLevels) {
        this.strikingRune = value;
    }
    public recast(typeService: TypeService, itemsService: ItemsService): Weapon {
        super.recast(typeService, itemsService);
        this.poisonsApplied =
            this.poisonsApplied.map(obj =>
                Object.assign<AlchemicalPoison, Item>(
                    new AlchemicalPoison(),
                    typeService.restoreItem(obj, itemsService),
                ).recast(typeService, itemsService));
        this.material = this.material.map(obj => Object.assign(new WeaponMaterial(), obj).recast());
        this.propertyRunes =
            this.propertyRunes.map(obj => Object.assign<WeaponRune, Item>(
                new WeaponRune(),
                typeService.restoreItem(obj, itemsService),
            ).recast(typeService, itemsService));

        return this;
    }
    public title(options: { itemStore?: boolean; preparedProficiency?: string } = {}): string {
        const proficiency = (options.itemStore || !options.preparedProficiency) ? this.prof : options.preparedProficiency;

        return [
            proficiency.split(' ')[0],
            this.group,
        ].filter(part => part)
            .join(' ');
    }
    public effectivePrice(itemsService: ItemsService): number {
        let price = this.price;

        if (this.moddable) {
            if (this.potencyRune) {
                price += itemsService.cleanItems().weaponrunes.find(rune => rune.potency === this.potencyRune).price;
            }

            if (this.strikingRune) {
                price += itemsService.cleanItems().weaponrunes.find(rune => rune.striking === this.strikingRune).price;
            }

            this.propertyRunes.forEach(rune => {
                if (rune) {
                    // Due to orichalcum's temporal properties,
                    // etching the speed weapon property rune onto an orichalcum weapon costs half the normal Price.
                    const half = .5;

                    if (rune.name === 'Speed' && this.material?.[0]?.name.includes('Orichalcum')) {
                        price += Math.floor(rune.price * half);
                    } else {
                        price += rune.price;
                    }
                }
            });

            this.material.forEach(mat => {
                price += mat.price;

                if (parseInt(this.bulk, 10)) {
                    price += (mat.bulkPrice * parseInt(this.bulk, 10));
                }
            });
        }

        price += this.talismans.reduce((prev, next) => prev + next.price, 0);

        return price;
    }
    public updateModifiers(creature: Creature, services: { characterService: CharacterService; refreshService: RefreshService }): void {
        //Initialize shoddy values and shield ally/emblazon armament for all shields and weapons.
        //Set components to update if these values have changed from before.
        const oldValues = [this.$shoddy, this.$emblazonArmament, this.$emblazonEnergy, this.$emblazonAntimagic];

        this._effectiveShoddy((creature as AnimalCompanion | Character), services.characterService);
        this._emblazonArmamentActive((creature as AnimalCompanion | Character), services.characterService);

        const newValues = [this.$shoddy, this.$emblazonArmament, this.$emblazonEnergy, this.$emblazonAntimagic];

        if (oldValues.some((previous, index) => previous !== newValues[index])) {
            services.refreshService.prepareDetailToChange(creature.type, this.id);
            services.refreshService.prepareDetailToChange(creature.type, 'attacks');
            services.refreshService.prepareDetailToChange(creature.type, 'inventory');
        }
    }
    public runeSource(creature: Creature, range: string): RuneSourceSet {
        // Under certain circumstances, other items' runes are applied when calculating attack bonus or damage.
        // Fundamental runes and property runes can come from different items,
        // and the item that causes this change will be noted as the reason.
        let runeSource: RuneSourceSet = { fundamentalRunes: this, propertyRunes: this };

        //For unarmed attacks, return Handwraps of Mighty Blows if invested.
        if (this.prof === WeaponProficiencies.Unarmed) {
            const handwraps = creature.inventories[0].wornitems.find(item => item.isHandwrapsOfMightyBlows && item.investedOrEquipped());

            if (handwraps) {
                runeSource = { fundamentalRunes: handwraps, propertyRunes: handwraps, reason: handwraps };
            }
        }

        //Apply doubling rings to return a different item's runes if needed.
        if (range === 'melee') {
            const goldRingIndex = 0;
            const ironRingIndex = 1;
            const propertyRunesIndex = 2;
            const doublingRings =
                creature.inventories[0].wornitems
                    .find(item => item.isDoublingRings && item.data[ironRingIndex].value === this.id && item.investedOrEquipped());

            if (doublingRings) {
                if (doublingRings.data[goldRingIndex].value) {
                    const goldItem = creature.inventories[0].weapons.find(weapon => weapon.id === doublingRings.data[goldRingIndex].value);

                    if (goldItem?.investedOrEquipped()) {
                        if (doublingRings.isDoublingRings === 'Doubling Rings (Greater)' && doublingRings.data[propertyRunesIndex]) {
                            runeSource = { fundamentalRunes: goldItem, propertyRunes: goldItem, reason: doublingRings };
                        } else {
                            runeSource = { fundamentalRunes: goldItem, propertyRunes: this, reason: doublingRings };
                        }
                    }
                }
            }
        }

        return runeSource;
    }
    public effectiveTraits(characterService: CharacterService, creature: Creature): Array<string> {
        //Test for certain feats that give traits to unarmed attacks.
        let traits: Array<string> = JSON.parse(JSON.stringify(this.traits));

        if (this.melee) {
            //Find and apply effects that give this weapon reach.
            const effectsService = characterService.effectsService;
            const noReach = 5;
            const typicalReach = 10;
            let reach = noReach;
            const reachTrait = traits.find(trait => trait.includes('Reach'));

            if (reachTrait) {
                reach = reachTrait.includes(' ') ? parseInt(reachTrait.split(' ')[1], 10) : typicalReach;
            }

            let newReach = reach;
            const list = [
                'Reach',
                `${ this.name } Reach`,
                `${ this.weaponBase } Reach`,
                //"Unarmed Attacks Reach", "Simple Weapon Reach"
                `${ this.prof } Reach`,
            ];

            effectsService.absoluteEffectsOnThese(creature, list)
                .forEach(effect => {
                    newReach = parseInt(effect.setValue, 10);
                });
            effectsService.relativeEffectsOnThese(creature, list)
                .forEach(effect => {
                    newReach += parseInt(effect.value, 10);
                });

            if (newReach !== reach) {
                if (newReach === noReach || newReach === 0) {
                    traits = traits.filter(trait => !trait.includes('Reach'));
                } else {
                    const reachString: string = traits.find(trait => trait.includes('Reach'));

                    if (reachString) {
                        traits[traits.indexOf(reachString)] = `Reach ${ newReach } feet`;
                    } else {
                        traits.push(`Reach ${ newReach } feet`);
                    }
                }
            }
        }

        //Create names list for effects, checking both Gain Trait and Lose Trait
        const namesList = [
            `${ this.name } Gain Trait`,
            //"Sword Gain Trait", "Club Gain Trait"
            `${ this.group } Gain Trait`,
            //"Unarmed Attacks Gain Trait", "Simple Weapons Gain Trait"
            `${ this.prof } Gain Trait`,
            //"Unarmed Gain Trait", "Simple Gain Trait"
            `${ this.prof.split(' ')[0] } Gain Trait`,
            //"Weapons Gain Trait", also "Attacks Gain Trait", but that's unlikely to be needed
            `${ this.prof.split(' ')[1] } Gain Trait`,
        ];

        if (this.melee) {
            namesList.push(...[
                'Melee Gain Trait',
                `Melee ${ this.prof.split(' ')[1] } Gain Trait`,
            ]);
        }

        if (this.ranged) {
            namesList.push(...[
                'Ranged Gain Trait',
                `Ranged ${ this.prof.split(' ')[1] } Gain Trait`,
            ]);
        }

        namesList.push(...namesList.map(name => name.replace('Gain Trait', 'Lose Trait')));
        characterService.effectsService.toggledEffectsOnThese(creature, namesList).filter(effect => effect.title)
            .forEach(effect => {
                if (effect.target.toLowerCase().includes('gain trait')) {
                    traits.push(effect.title);
                } else if (effect.target.toLowerCase().includes('lose trait')) {
                    traits = traits.filter(trait => trait !== effect.title);
                }
            });
        traits = traits.filter(trait => !this.material.some(material => material.removeTraits.includes(trait)));
        traits = Array.from(new Set(traits)).sort();

        if (JSON.stringify(this.$traits) !== JSON.stringify(traits)) {
            // If any traits have changed, we need to update elements that these traits show on.
            // First we save the traits, so we don't start a loop if anything wants to update attacks again.
            const changed: Array<string> =
                this.$traits.filter(trait => !traits.includes(trait)).concat(traits.filter(trait => !this.$traits.includes(trait)));

            this.$traits = traits;
            changed.forEach(changedTrait => {
                characterService.traitsService.traits(changedTrait).forEach(trait => {
                    characterService.refreshService.prepareChangesByHints(creature, trait.hints, { characterService });
                });
            });
            characterService.refreshService.processPreparedChanges();
        }

        return traits;
    }
    public effectiveProficiency(
        creature: Creature,
        characterService: CharacterService,
        charLevel: number = characterService.character.level,
    ): string {
        let proficiency = this.prof;
        // Some feats allow you to apply another proficiency to certain weapons, e.g.:
        // "For the purpose of determining your proficiency,
        // martial goblin weapons are simple weapons and advanced goblin weapons are martial weapons."
        const proficiencyChanges: Array<ProficiencyChange> = [];

        if (creature instanceof Familiar) {
            return '';
        }

        if (creature instanceof Character) {
            characterService.characterFeatsAndFeatures()
                .filter(feat => feat.changeProficiency.length && feat.have({ creature }, { characterService }, { charLevel }))
                .forEach(feat => {
                    proficiencyChanges.push(...feat.changeProficiency.filter(change =>
                        (!change.name || this.name.toLowerCase() === change.name.toLowerCase()) &&
                        (!change.trait || this.traits.some(trait => change.trait.includes(trait))) &&
                        (!change.proficiency || (this.prof && change.proficiency === this.prof)) &&
                        (!change.group || (this.group && change.group === this.group)),
                    ));
                });

            const proficiencies: Array<string> = proficiencyChanges.map(change => change.result);

            //Set the resulting proficiency to the best result by setting it in order of worst to best.
            if (proficiencies.includes(WeaponProficiencies.Advanced)) {
                proficiency = WeaponProficiencies.Advanced;
            }

            if (proficiencies.includes(WeaponProficiencies.Martial)) {
                proficiency = WeaponProficiencies.Martial;
            }

            if (proficiencies.includes(WeaponProficiencies.Simple)) {
                proficiency = WeaponProficiencies.Simple;
            }

            if (proficiencies.includes(WeaponProficiencies.Unarmed)) {
                proficiency = WeaponProficiencies.Unarmed;
            }
        }

        return proficiency;
    }
    public hasProficiencyChanged(currentProficiency: string): boolean {
        return currentProficiency !== this.prof;
    }
    public profLevel(
        creature: Creature,
        characterService: CharacterService,
        runeSource: Weapon | WornItem,
        charLevel: number = characterService.character.level,
        options: { preparedProficiency?: string } = {},
    ): number {
        if (characterService.stillLoading || creature instanceof Familiar) { return 0; }

        let skillLevel = 0;
        const prof = options.preparedProficiency || this.effectiveProficiency(creature, characterService, charLevel);
        //There are a lot of ways to be trained with a weapon.
        //To determine the skill level, we have to find skills for the item's proficiency, its name, its weapon base and any of its traits.
        const levels: Array<number> = [];

        //If useHighestAttackProficiency is true, the proficiency level will be copied from your highest unarmed or weapon proficiency.
        if (this.useHighestAttackProficiency) {
            const highestProficiencySkill =
                characterService.skills(creature, 'Highest Attack Proficiency', { type: 'Specific Weapon Proficiency' });

            levels.push(
                (
                    characterService.skills(creature, this.name)[0] ||
                    highestProficiencySkill[0]
                ).level(creature, characterService, charLevel) ||
                0,
            );
        }

        //Weapon name, e.g. Demon Sword.
        levels.push(
            characterService.skills(creature, this.name, { type: 'Specific Weapon Proficiency' })[0]
                .level(creature, characterService, charLevel) ||
            0,
        );
        //Weapon base, e.g. Longsword.
        levels.push(
            this.weaponBase
                ? characterService.skills(creature, this.weaponBase, { type: 'Specific Weapon Proficiency' })[0]
                    .level(creature, characterService, charLevel)
                : 0,
        );

        //Proficiency and Group, e.g. Martial Sword.
        //There are proficiencies for "Simple Sword" or "Advanced Bow" that we need to consider, so we build that phrase here.
        const profAndGroup = `${ prof.split(' ')[0] } ${ this.group }`;

        levels.push(
            characterService.skills(creature, profAndGroup, { type: 'Specific Weapon Proficiency' })[0]
                .level(creature, characterService, charLevel) ||
            0,
        );
        //Proficiency, e.g. Martial Weapons.
        levels.push(characterService.skills(creature, prof)[0]?.level(creature, characterService, charLevel) || 0);
        //Any traits, e.g. Monk. Will include, for instance, "Thrown 20 ft", so we also test the first word of any multi-word trait.
        levels.push(
            ...this.traits
                .map(trait =>
                    characterService.skills(creature, trait, { type: 'Specific Weapon Proficiency' })[0]
                        .level(creature, characterService, charLevel) ||
                    0,
                ),
        );
        levels.push(
            ...this.traits
                .filter(trait => trait.includes(' '))
                .map(trait => characterService.skills(creature, trait.split(' ')[0], { type: 'Specific Weapon Proficiency' })[0]
                    .level(creature, characterService, charLevel) ||
                    0,
                ),
        );
        // Favored Weapon.
        levels.push(
            this.isFavoredWeapon(creature, characterService)
                ? characterService.skills(creature, 'Favored Weapon', { type: 'Favored Weapon' })[0]
                    .level(creature, characterService, charLevel)
                : 0,
        );
        // Get the skill level by applying the result with the most increases, but no higher than 8.
        skillLevel = Math.min(Math.max(...levels.filter(level => level !== undefined)), MaxSkillLevel);

        // If you have an Ancestral Echoing rune on this weapon, you get to raise the item's proficiency by one level,
        // up to the highest proficiency you have.
        let bestSkillLevel: number = skillLevel;

        if (runeSource.propertyRunes.some(rune => rune.name === 'Ancestral Echoing')) {
            // First, we get all the weapon proficiencies...
            const skills: Array<number> =
                characterService.skills(creature, '', { type: 'Weapon Proficiency' })
                    .map(skill => skill.level(creature, characterService, charLevel));

            skills.push(
                ...characterService.skills(creature, '', { type: 'Specific Weapon Proficiency' })
                    .map(skill => skill.level(creature, characterService, charLevel)),
            );
            //Then we set this skill level to either this level +2 or the highest of the found proficiencies - whichever is lower.
            bestSkillLevel = Math.min(skillLevel + skillLevelBaseStep, Math.max(...skills));
        }

        // If you have an oil applied that emulates an Ancestral Echoing rune,
        // apply the same rule (there is no such oil, but things can change)
        if (this.oilsApplied.some(oil => oil.runeEffect && oil.runeEffect.name === 'Ancestral Echoing')) {
            // First, we get all the weapon proficiencies...
            const skills: Array<number> =
                characterService.skills(creature, '', { type: 'Weapon Proficiency' })
                    .map(skill => skill.level(creature, characterService, charLevel));

            skills.push(
                ...characterService.skills(creature, '', { type: 'Specific Weapon Proficiency' })
                    .map(skill => skill.level(creature, characterService, charLevel)));
            // Then we set this skill level to either this level +2 or the highest of the found proficiencies - whichever is lower.
            bestSkillLevel = Math.min(skillLevel + skillLevelBaseStep, Math.max(...skills));
        }

        return bestSkillLevel;
    }
    public attack(
        creature: Character | AnimalCompanion,
        characterService: CharacterService,
        effectsService: EffectsService,
        range: string,
    ): AttackResult {
        //Calculates the attack bonus for a melee or ranged attack with this weapon.
        let explain = '';
        const charLevel = characterService.character.level;
        const str = characterService.abilities('Strength')[0].mod(creature, characterService, effectsService).result;
        const dex = characterService.abilities('Dexterity')[0].mod(creature, characterService, effectsService).result;
        const runeSource = this.runeSource(creature, range);
        const traits = this.effectiveTraits(characterService, creature);
        const skillLevel = this.profLevel(creature, characterService, runeSource.propertyRunes);

        if (skillLevel) {
            explain += `\nProficiency: ${ skillLevel }`;
        }

        //Add character level if the character is trained or better with either the weapon category or the weapon itself
        const charLevelBonus = ((skillLevel > 0) ? charLevel : 0);

        if (charLevelBonus) {
            explain += `\nCharacter Level: +${ charLevelBonus }`;
        }

        const penalties: Array<Effect> = [];
        const bonuses: Array<Effect> = [];
        const absolutes: Array<Effect> = [];
        //Calculate dexterity and strength penalties for the decision on which to use. They are not immediately applied.
        //The Clumsy condition affects all Dexterity attacks.
        const dexEffects =
            effectsService.relativeEffectsOnThese(creature, ['Dexterity-based Checks and DCs', 'Dexterity-based Attack Rolls']);
        const dexPenalty: Array<Effect> = [];
        let dexPenaltySum = 0;

        dexEffects.forEach(effect => {
            dexPenalty.push(
                Object.assign(
                    new Effect(),
                    { value: parseInt(effect.value, 10), setValue: '', source: effect.source, penalty: true },
                ),
            );
            dexPenaltySum += parseInt(effect.value, 10);
        });

        //The Enfeebled condition affects all Strength attacks
        const strEffects =
            effectsService.relativeEffectsOnThese(creature, ['Strength-based Checks and DCs', 'Strength-based Attack Rolls']);
        const strPenalty: Array<Effect> = [];
        let strPenaltySum = 0;

        strEffects.forEach(effect => {
            strPenalty.push(
                Object.assign(
                    new Effect(),
                    { value: parseInt(effect.value, 10), setValue: '', source: effect.source, penalty: true },
                ),
            );
            strPenaltySum += parseInt(effect.value, 10);
        });

        let isDexUsed = false;
        let isStrUsed = false;
        //Check if the weapon has any traits that affect its Ability bonus to attack, such as Finesse or Brutal, and run those calculations.
        let abilityMod = 0;

        if (range === 'ranged') {
            if (traits.includes('Brutal')) {
                abilityMod = str;
                explain += `\nStrength Modifier (Brutal): ${ SignNumber(abilityMod) }`;
                isStrUsed = true;

            } else {
                abilityMod = dex;
                explain += `\nDexterity Modifier: ${ SignNumber(abilityMod) }`;
                isDexUsed = true;
            }
        } else {
            if (traits.includes('Finesse') && dex + dexPenaltySum > str + strPenaltySum) {
                abilityMod = dex;
                explain += `\nDexterity Modifier (Finesse): ${ SignNumber(abilityMod) }`;
                isDexUsed = true;
            } else if (this.dexterityBased) {
                abilityMod = dex;
                explain += `\nDexterity Modifier (Dexterity-based): ${ SignNumber(abilityMod) }`;
                isDexUsed = true;
            } else {
                abilityMod = str;
                explain += `\nStrength Modifier: ${ SignNumber(abilityMod) }`;
                isStrUsed = true;
            }
        }

        //Add up all modifiers before effects and item bonus
        let attackResult = charLevelBonus + skillLevel + abilityMod;
        let abilityName = '';

        if (isStrUsed) {
            abilityName = 'Strength';
        }

        if (isDexUsed) {
            abilityName = 'Dexterity';
        }

        const prof = this.effectiveProficiency(creature, characterService, charLevel);
        //Create names list for effects
        const effectsListAttackRolls =
            this._effectPhrases('Attack Rolls', prof, range, traits, this.isFavoredWeapon(creature, characterService))
                .concat([
                    this.name,
                    'Attack Rolls',
                    'All Checks and DCs',
                    //"Strength-based Checks and DCs", "Dexterity-based Checks and DCs"
                    `${ abilityName }-based Checks and DCs`,
                    //"Strength-based Attack Rolls", "Dexterity-based Attack Rolls"
                    `${ abilityName }-based Attack Rolls`,
                    //"Untrained Attack Rolls", "Expert Attack Rolls"
                    `${ SkillLevelName(skillLevel) } Attack Rolls`,
                ]);
        //For any activated traits of this weapon, check if any effects on Attack apply. These need to be evaluated in the Trait class.
        const traitEffects: Array<Effect> = [];

        this.activatedTraitsActivations().forEach(activation => {
            const realTrait = characterService.traitsService.traits(activation.trait)[0];

            traitEffects.push(...realTrait.objectBoundEffects(activation, ['Attack']));
        });
        //Add absolute effects
        effectsService.reduceEffectsByType(
            traitEffects
                .filter(effect => effect.setValue)
                .concat(effectsService.absoluteEffectsOnThese(creature, effectsListAttackRolls)),
            { absolutes: true },
        )
            .forEach(effect => {
                if (effect.show) {
                    absolutes.push(
                        Object.assign(
                            new Effect(),
                            { value: 0, setValue: effect.setValue, source: effect.source, penalty: false, type: effect.type },
                        ),
                    );
                }

                attackResult = parseInt(effect.setValue, 10);
                explain = `${ effect.source }: ${ effect.setValue }`;
            });

        let effectsSum = 0;
        //Add relative effects, including potency bonus and shoddy penalty
        //Generate potency bonus
        const potencyRune: number = runeSource.fundamentalRunes.effectivePotency();
        const calculatedEffects: Array<Effect> = [];

        if (potencyRune) {
            let source = 'Potency';

            //If you're getting the potency because of another item (like Doubling Rings), name it here
            if (runeSource.reason) {
                source = `Potency (${ runeSource.reason.effectiveName() })`;
            }

            calculatedEffects.push(
                Object.assign(
                    new Effect(potencyRune.toString()),
                    { creature: creature.type, type: 'item', target: this.name, source, apply: true, show: false },
                ),
            );
        }

        if (runeSource.fundamentalRunes.battleforged) {
            let source = 'Battleforged';

            //If you're getting the battleforged bonus because of another item (like Handwraps of Mighty Blows), name it here
            if (runeSource.reason) {
                source = `Battleforged (${ runeSource.reason.effectiveName() })`;
            }

            calculatedEffects.push(
                Object.assign(
                    new Effect('+1'),
                    { creature: creature.type, type: 'item', target: this.name, source, apply: true, show: false },
                ),
            );
        }

        //Powerful Fist ignores the nonlethal penalty on unarmed attacks.
        let hasPowerfulFist = false;

        if (this.prof === WeaponProficiencies.Unarmed) {
            const character = characterService.character;

            if (characterService.characterFeatsTaken(0, character.level, { featName: 'Powerful Fist' }).length) {
                hasPowerfulFist = true;
            }
        }

        //Shoddy items have a -2 item penalty to attacks, unless you have the Junk Tinker feat and have crafted the item yourself.
        if ((this.$shoddy === ShoddyPenalties.NotShoddy) && this.shoddy) {
            explain += '\nShoddy (canceled by Junk Tinker): -0';
        } else if (this.$shoddy) {
            calculatedEffects.push(
                Object.assign(
                    new Effect(`${ ShoddyPenalties.Shoddy }`),
                    { creature: creature.type, type: 'item', target: this.name, source: 'Shoddy', penalty: true, apply: true, show: false },
                ),
            );
        }

        // Because of the Potency and Shoddy Effects, we need to filter the types a second time,
        // even though get_RelativesOnThese comes pre-filtered.
        effectsService.reduceEffectsByType(
            calculatedEffects
                .concat(
                    traitEffects.filter(effect => effect.value !== '0'),
                    effectsService.relativeEffectsOnThese(creature, effectsListAttackRolls),
                ),
        )
            .forEach(effect => {
                //Powerful Fist ignores the nonlethal penalty on unarmed attacks.
                if (hasPowerfulFist && effect.source === 'conditional, Nonlethal') {
                    explain += '\nNonlethal (cancelled by Powerful Fist)';
                } else {
                    if (effect.show) {
                        if (parseInt(effect.value, 10) < 0) {
                            penalties.push(
                                Object.assign(
                                    new Effect(effect.value),
                                    {
                                        target: effect.target,
                                        source: effect.source,
                                        penalty: true,
                                        type: effect.type,
                                        apply: false,
                                        show: false,
                                    },
                                ),
                            );
                        } else {
                            bonuses.push(
                                Object.assign(
                                    new Effect(effect.value),
                                    {
                                        target: effect.target,
                                        source: effect.source,
                                        penalty: false,
                                        type: effect.type,
                                        apply: true,
                                        show: false,
                                    },
                                ),
                            );
                        }
                    }

                    effectsSum += parseInt(effect.value, 10);
                    explain += `\n${ effect.source }: ${ parseInt(effect.value, 10) >= 0 ? '+' : '' }${ parseInt(effect.value, 10) }`;
                }
            });
        //Add up all modifiers and return the attack bonus for this attack
        attackResult += effectsSum;
        explain = explain.trim();

        return { range, attackResult, explain, effects: penalties.concat(bonuses).concat(absolutes), penalties, bonuses, absolutes };
    }
    public isFavoredWeapon(creature: Creature, characterService: CharacterService): boolean {
        if (creature instanceof Familiar) {
            return false;
        }

        if (creature instanceof Character && creature.class.deity) {
            if (characterService.currentCharacterDeities(creature)[0]?.favoredWeapon
                .some(favoredWeapon =>
                    [
                        this.name.toLowerCase(),
                        this.weaponBase.toLowerCase(),
                        this.displayName.toLowerCase(),
                    ].includes(favoredWeapon.toLowerCase()),
                )
            ) {
                return true;
            }
        }

        if (
            creature instanceof Character &&
            characterService.characterFeatsTaken(0, creature.level, { featName: 'Favored Weapon (Syncretism)' }).length
        ) {
            if (characterService.currentCharacterDeities(creature, 'syncretism')[0]?.favoredWeapon
                .some(favoredWeapon =>
                    [
                        this.name.toLowerCase(),
                        this.weaponBase.toLowerCase(),
                        this.displayName.toLowerCase(),
                    ].includes(favoredWeapon.toLowerCase()),
                )) {
                return true;
            }
        }

        return false;
    }
    public damage(
        creature: Character | AnimalCompanion,
        characterService: CharacterService,
        effectsService: EffectsService,
        range: string,
    ): DamageResult {
        //Lists the damage dice and damage bonuses for a ranged or melee attack with this weapon.
        //Returns a string in the form of "1d6+5 B\n+1d6 Fire"
        //A weapon with no dice and no extra damage returns a damage of "0".
        if (!this.dicenum && !this.dicesize && !this.extraDamage) {
            return { damageResult: '0', explain: '', penalties: [], bonuses: [], absolutes: [] };
        }

        let diceExplain = `Base dice: ${ this.dicenum ? `${ this.dicenum }d` : '' }${ this.dicesize }`;
        let bonusExplain = '';
        const str = characterService.abilities('Strength')[0].mod(creature, characterService, effectsService).result;
        const dex = characterService.abilities('Dexterity')[0].mod(creature, characterService, effectsService).result;
        const penalties: Array<Effect> = [];
        const bonuses: Array<Effect> = [];
        const absolutes: Array<Effect> = [];
        const prof = this.effectiveProficiency(creature, characterService);
        const traits = this.$traits;
        //Apply any mechanism that copy runes from another item, like Handwraps of Mighty Blows or Doubling Rings.
        //We set runeSource to the respective item and use it whenever runes are concerned.
        const runeSource = this.runeSource(creature, range);
        const isFavoredWeapon = this.isFavoredWeapon(creature, characterService);
        const effectPhrases = (phrase: string): Array<string> => this._effectPhrases(phrase, prof, range, traits, isFavoredWeapon)
            .concat([
                `Damage ${ phrase }`,
            ]);
        //Determine the dice Number - Dice Number Multiplier first, then Dice Number (Striking included)
        let dicenum = this.dicenum;

        if (dicenum) {
            let dicenumMultiplier = 1;
            const effectPhrasesDiceNumberMult = effectPhrases('Dice Number Multiplier');

            effectsService.absoluteEffectsOnThese(creature, effectPhrasesDiceNumberMult).forEach(effect => {
                dicenumMultiplier = parseInt(effect.setValue, 10);
                diceExplain += `\n${ effect.source }: Dice number multiplier ${ dicenumMultiplier }`;
            });
            effectsService.relativeEffectsOnThese(creature, effectPhrasesDiceNumberMult).forEach(effect => {
                dicenumMultiplier += parseInt(effect.value, 10);
                diceExplain +=
                    `\n${ effect.source }: Dice number multiplier ${ parseInt(effect.value, 10) >= 0 ? '+' : '' }`
                    + `${ parseInt(effect.value, 10) }`;
            });
            dicenum *= dicenumMultiplier;

            const calculatedAbsoluteDiceNumEffects: Array<Effect> = [];
            const effectPhrasesDiceNumber = effectPhrases('Dice Number');

            //Add the striking rune or oil of potency effect of the runeSource.
            //Only apply and explain Striking if it's actually better than your multiplied dice number.
            if (runeSource.fundamentalRunes.effectiveStriking() + 1 > dicenum) {
                let source = runeSource.fundamentalRunes.strikingTitle(runeSource.fundamentalRunes.effectiveStriking());

                //If you're getting the striking effect because of another item (like Doubling Rings), name it here
                if (runeSource.reason) {
                    source += ` (${ runeSource.reason.effectiveName() })`;
                }

                calculatedAbsoluteDiceNumEffects.push(
                    Object.assign(
                        new Effect(),
                        {
                            creature: creature.type,
                            type: 'untyped',
                            target: `${ this.name } Dice Number`,
                            setValue: (1 + runeSource.fundamentalRunes.effectiveStriking()).toString(),
                            source,
                            apply: true,
                            show: false,
                        },
                    ),
                );
            }

            // For any activated traits of this weapon, check if any effects on Dice Number apply.
            // These need to be calculated in the effects service.
            const traitEffects = [];

            this.activatedTraitsActivations().forEach(activation => {
                const realTrait = characterService.traitsService.traits(activation.trait)[0];

                traitEffects.push(...realTrait.objectBoundEffects(activation, ['Dice Number']));
            });
            effectsService.reduceEffectsByType(
                calculatedAbsoluteDiceNumEffects
                    .concat(
                        traitEffects.filter(effect => effect.setValue),
                        effectsService.absoluteEffectsOnThese(creature, effectPhrasesDiceNumber),
                    ),
                { absolutes: true },
            )
                .forEach(effect => {
                    dicenum = parseInt(effect.setValue, 10);
                    diceExplain += `\n${ effect.source }: Dice number ${ dicenum }`;
                });

            const calculatedRelativeDiceNumEffects: Array<Effect> = [];

            //Diamond Fists adds the forceful trait to your unarmed attacks, but if one already has the trait, it gains one damage die.
            if (this.prof === WeaponProficiencies.Unarmed) {
                const character = characterService.character;

                if (
                    characterService.characterFeatsTaken(0, character.level, { featName: 'Diamond Fists' }).length &&
                    this.traits.includes('Forceful')
                ) {
                    calculatedRelativeDiceNumEffects.push(
                        Object.assign(
                            new Effect('+1'),
                            {
                                creature: creature.type,
                                type: 'untyped',
                                target: `${ this.name } Dice Number`,
                                source: 'Diamond Fists',
                                apply: true,
                                show: false,
                            },
                        ),
                    );
                }
            }

            effectsService.reduceEffectsByType(
                calculatedRelativeDiceNumEffects
                    .concat(traitEffects.filter(effect => effect.value !== '0'))
                    .concat(effectsService.relativeEffectsOnThese(creature, effectPhrasesDiceNumber)),
            )
                .forEach(effect => {
                    dicenum += parseInt(effect.value, 10);
                    diceExplain +=
                        `\n${ effect.source }: Dice number ${ parseInt(effect.value, 10) >= 0 ? '+' : '' }${ parseInt(effect.value, 10) }`;
                });
        }

        //Determine the dice size.
        let dicesize = this.dicesize;

        if (dicesize) {
            const calculatedAbsoluteDiceSizeEffects: Array<Effect> = [];

            // Champions get increased dice size via Deific Weapon for unarmed attacks with d4 damage
            // or simple weapons as long as they are their deity's favored weapon.
            if (((dicesize === DiceSizes.D4 && this.prof === WeaponProficiencies.Unarmed) || this.prof === WeaponProficiencies.Simple) &&
                characterService.characterFeatsAndFeatures('Deific Weapon')[0]?.have({ creature }, { characterService })) {
                if (this.isFavoredWeapon(creature, characterService)) {
                    const newDicesize = Math.max(Math.min(dicesize + DiceSizeBaseStep, DiceSizes.D12), DiceSizes.D6);

                    if (newDicesize > dicesize) {
                        calculatedAbsoluteDiceSizeEffects.push(
                            Object.assign(
                                new Effect(),
                                {
                                    creature: creature.type,
                                    type: 'untyped',
                                    target: `${ this.name } Dice Size`,
                                    setValue: newDicesize.toString(),
                                    source: 'Deific Weapon',
                                    apply: true,
                                    show: false,
                                },
                            ),
                        );
                    }
                }
            }

            // Clerics get increased dice size via Deadly Simplicity for unarmed attacks with less than d6 damage
            // or simple weapons as long as they are their deity's favored weapon.
            if (((dicesize < DiceSizes.D6 && this.prof === WeaponProficiencies.Unarmed) || this.prof === WeaponProficiencies.Simple) &&
                characterService.feats('Deadly Simplicity')[0]?.have({ creature }, { characterService })) {
                if (this.isFavoredWeapon(creature, characterService)) {
                    let newDicesize = Math.max(Math.min(dicesize + DiceSizeBaseStep, DiceSizes.D12), DiceSizes.D6);

                    if (dicesize < DiceSizes.D6 && this.prof === WeaponProficiencies.Unarmed) {
                        newDicesize = DiceSizes.D6;
                    }

                    if (newDicesize > dicesize) {
                        calculatedAbsoluteDiceSizeEffects.push(
                            Object.assign(
                                new Effect(),
                                {
                                    creature: creature.type,
                                    type: 'untyped',
                                    target: `${ this.name } Dice Size`,
                                    setValue: newDicesize.toString(),
                                    source: 'Deadly Simplicity',
                                    apply: true,
                                    show: false,
                                },
                            ),
                        );
                    }
                }
            }

            // For any activated traits of this weapon, check if any effects on Dice Size apply.
            // These need to be calculated in the effects service.
            const traitEffects = [];

            this.activatedTraitsActivations().forEach(activation => {
                const realTrait = characterService.traitsService.traits(activation.trait)[0];

                traitEffects.push(...realTrait.objectBoundEffects(activation, ['Dice Size']));
            });

            //Apply dice size effects.
            const effectPhrasesDiceSize = effectPhrases('Dice Size');

            effectsService.reduceEffectsByType(
                calculatedAbsoluteDiceSizeEffects
                    .concat(traitEffects.filter(effect => effect.setValue))
                    .concat(effectsService.absoluteEffectsOnThese(creature, effectPhrasesDiceSize)),
                { absolutes: true })
                .forEach(effect => {
                    dicesize = parseInt(effect.setValue, 10);
                    diceExplain += `\n${ effect.source }: Dice size d${ dicesize }`;
                });
            effectsService.reduceEffectsByType(
                traitEffects.filter(effect => effect.value !== '0')
                    .concat(effectsService.relativeEffectsOnThese(creature, effectPhrasesDiceSize)),
            )
                .forEach(effect => {
                    dicesize += parseInt(effect.value, 10);
                    //Don't raise dice size over 12.
                    dicesize = Math.min(DiceSizes.D12, dicesize);
                    diceExplain += `\n${ effect.source }: Dice size d${ dicesize }`;
                });
        }

        // Get the basic "#d#" string from the weapon's dice values,
        // unless dicenum is 0 or null (for instance some weapons deal exactly 1 base damage, which is represented by 0d1).
        // In that case, add the damage to the damage bonus and ignore the #d# string.
        let baseDice = '';
        let dmgBonus = 0;

        if (dicenum) {
            baseDice = `${ dicenum }d${ dicesize }`;
        } else {
            if (dicesize) {
                dmgBonus += dicesize;
            }
        }

        //Decide whether this weapon uses strength or dexterity (modifier, bonuses and penalties).
        const calculatedDamageEffects: Array<Effect> = [];
        let isStrUsed = false;
        let isDexUsed = false;
        let abilityReason = '';

        //Weapons with the Splash trait do not add your Strength modifier (and presumably not your Dexterity modifier, either).
        if (!traits.includes('Splash')) {
            let abilityMod = 0;

            //First, calculate dexterity and strength penalties to see which would be more beneficial. They are not immediately applied.
            //Check if the Weapon has any traits that affect its damage Bonus, such as Thrown or Propulsive, and run those calculations.
            if (range === 'ranged') {
                if (traits.includes('Propulsive')) {
                    const half = .5;

                    if (str > 0) {
                        abilityMod = Math.floor(str * half);
                        abilityReason = 'Propulsive';
                        isStrUsed = true;
                    } else if (str < 0) {
                        abilityMod = str;
                        abilityReason = 'Propulsive';
                        isStrUsed = true;
                    }
                } else if (traits.some(trait => trait.includes('Thrown'))) {
                    abilityMod = str;
                    abilityReason += 'Thrown';
                    isStrUsed = true;
                }
            } else {
                //If the weapon is Finesse and you have the Thief Racket, you apply your Dexterity modifier to damage if it is higher.
                if (traits.includes('Finesse') &&
                    creature instanceof Character &&
                    characterService.characterFeatsTaken(1, creature.level, { featName: 'Thief Racket' }).length) {
                    //Check if dex or str would give you more damage by comparing your modifiers and any penalties and bonuses.
                    //The Enfeebled condition affects all Strength damage
                    const strEffects = effectsService.relativeEffectsOnThis(creature, 'Strength-based Checks and DCs');
                    let strPenaltySum = 0;

                    strEffects.forEach(effect => {
                        strPenaltySum += parseInt(effect.value, 10);
                    });

                    //The Clumsy condition affects all Dexterity damage
                    const dexEffects = effectsService.relativeEffectsOnThis(creature, 'Dexterity-based Checks and DCs');
                    let dexPenaltySum = 0;

                    dexEffects.forEach(effect => {
                        dexPenaltySum += parseInt(effect.value, 10);
                    });

                    if ((dex + dexPenaltySum) > (str + strPenaltySum)) {
                        abilityMod = dex;
                        abilityReason += 'Thief';
                        isDexUsed = true;
                    } else {
                        abilityMod = str;
                        isStrUsed = true;
                    }
                } else {
                    abilityMod = str;
                    isStrUsed = true;
                }
            }

            if (abilityMod) {
                let abilitySource = '';

                if (isStrUsed) {
                    abilitySource = 'Strength Modifier';
                }

                if (isDexUsed) {
                    abilitySource = 'Dexterity Modifier';
                }

                if (abilityReason) {
                    abilitySource += ` (${ abilityReason })`;
                }

                calculatedDamageEffects.push(
                    Object.assign(
                        new Effect(abilityMod.toString()),
                        {
                            creature: creature.type,
                            type: 'untyped',
                            target: `${ this.name } Damage`,
                            source: abilitySource,
                            apply: true,
                            show: false,
                        },
                    ),
                );
            }
        }

        //Mature and Specialized Companions add extra Damage to their attacks.
        if (creature instanceof AnimalCompanion) {
            creature.class.levels.filter(level => level.number <= creature.level).forEach(level => {
                if (level.extraDamage) {
                    let companionSource = '';
                    let companionMod: number = level.extraDamage;

                    companionSource = `${ level.name } Animal Companion`;

                    if (creature.class.specializations.length) {
                        const double = 2;

                        companionMod *= double;
                        companionSource = 'Specialized Animal Companion';
                    }

                    calculatedDamageEffects.push(
                        Object.assign(
                            new Effect(companionMod.toString()),
                            {
                                creature: creature.type,
                                type: 'untyped',
                                target: `${ this.name } Damage`,
                                source: companionSource,
                                apply: true,
                                show: false,
                            },
                        ),
                    );
                }
            });
        }

        //Emblazon Armament on a weapon adds a +1 status bonus to damage rolls if the deity matches.
        if (creature instanceof Character) {
            if (this.$emblazonArmament) {
                this.emblazonArmament
                    .filter(ea => ea.type === 'emblazonArmament')
                    .forEach(() => {
                        calculatedDamageEffects.push(
                            Object.assign(
                                new Effect('+1'),
                                {
                                    creature: creature.type,
                                    type: 'status',
                                    target: `${ this.name } Damage`,
                                    source: 'Emblazon Armament',
                                    apply: true,
                                    show: false,
                                },
                            ),
                        );
                    });
            }
        }

        const profLevel = this.profLevel(creature, characterService, runeSource.propertyRunes);
        const effectPhrasesDamage =
            effectPhrases('Damage')
                .concat(effectPhrases('Damage Rolls'));
        const agile = traits.includes('Agile') ? 'Agile' : 'Non-Agile';

        //"Agile/Non-Agile Large Melee Weapon Damage"
        if (this.large) {
            effectPhrasesDamage.push(
                `${ agile } Large ${ range } Weapon Damage`,
                `${ agile } Large ${ range } Weapon Damage Rolls`,
            );
        }

        //"Agile/Non-Agile Melee Damage"
        effectPhrasesDamage.push(
            `${ agile } ${ range } Damage`,
            `${ agile } ${ range } Damage Rolls`,
        );

        if ((range === 'ranged') && this.traits.some(trait => trait.includes('Thrown'))) {
            //"Agile/Non-Agile Thrown Large Weapon Damage"
            if (this.large) {
                effectPhrasesDamage.push(
                    `${ agile } Thrown Large Weapon Damage`,
                    `${ agile } Thrown Large Weapon Damage Rolls`,
                );
            }

            //"Agile/Non-Agile Thrown Weapon Damage"
            effectPhrasesDamage.push(
                `${ agile } Thrown Weapon Damage`,
                `${ agile } Thrown Weapon Damage Rolls`,
            );
        }

        effectsService.absoluteEffectsOnThese(creature, effectPhrasesDamage)
            .forEach(effect => {
                if (effect.show) {
                    absolutes.push(
                        Object.assign(
                            new Effect(),
                            { value: 0, setValue: effect.setValue, source: effect.source, penalty: false },
                        ),
                    );
                }

                dmgBonus = parseInt(effect.setValue, 10);
                bonusExplain = `\n${ effect.source }: Bonus damage ${ parseInt(effect.setValue, 10) }`;
            });

        if (!effectsService.effectsOnThis(creature, `Ignore Bonus Damage on ${ this.name }`).length) {
            let effectBonus = 0;
            let abilityName = '';

            if (isStrUsed) {
                abilityName = 'Strength';
            }

            if (isDexUsed) {
                abilityName = 'Dexterity';
            }

            //"Strength-based Checks and DCs"
            effectPhrasesDamage.push(`${ abilityName }-based Checks and DCs`);

            //Proficiency-based damage
            const profLevelName = SkillLevelName(profLevel) || '';

            if (profLevelName) {
                effectPhrasesDamage.push(
                    `${ profLevelName } Proficiency Attack Damage`,
                    `${ profLevelName } Proficiency Attack Damage Rolls`,
                    `Trained Proficiency ${ this.name } Damage`,
                    `Trained Proficiency ${ this.name } Damage Rolls`,
                );
            }

            // Pre-create Effects based on "Damage per Die" effects.
            // For any activated traits of this weapon, check if any effects on Dice Size apply.
            // These need to be calculated in the effects service.
            const traitEffects = [];

            this.activatedTraitsActivations().forEach(activation => {
                const realTrait = characterService.traitsService.traits(activation.trait)[0];

                traitEffects.push(...realTrait.objectBoundEffects(activation, ['Damage per Die']));
            });

            const perDieList: Array<string> = [];

            if (this.prof === 'Unarmed Attacks') {
                perDieList.push('Unarmed Damage per Die');
            } else {
                perDieList.push('Weapon Damage per Die');
            }

            traits.forEach(trait => {
                if (trait.includes(' ft')) {
                    perDieList.push(`${ trait.split(' ')[0] } Damage per Die`);
                } else {
                    perDieList.push(`${ trait } Damage per Die`);
                }
            });
            // All "...Damage per Die" effects are converted to just "...Damage" (by multiplying with the dice number)
            // and then re-processed with the rest of the damage effects.
            traitEffects.filter(effect => effect.value !== '0')
                .concat(effectsService.relativeEffectsOnThese(creature, perDieList))
                .forEach(effect => {
                    const effectValue = parseInt(effect.value, 10) * dicenum;
                    const newEffect = Object.assign<Effect, Effect>(new Effect(), JSON.parse(JSON.stringify(effect))).recast();

                    newEffect.target = newEffect.target.replace(' per Die', '');
                    newEffect.value = effectValue.toString();
                    calculatedDamageEffects.push(newEffect);
                });
            //Now collect and apply the type-filtered effects on this weapon's damage, including the pregenerated ones.
            effectsService.reduceEffectsByType(
                calculatedDamageEffects
                    .concat(effectsService.relativeEffectsOnThese(creature, effectPhrasesDamage)),
            )
                .forEach(effect => {
                    if (effect.show) {
                        if (parseInt(effect.value, 10) < 0) {
                            penalties.push(
                                Object.assign(
                                    new Effect(),
                                    { value: parseInt(effect.value, 10), setValue: '', source: effect.source, penalty: true },
                                ),
                            );
                        } else {
                            bonuses.push(
                                Object.assign(
                                    new Effect(),
                                    { value: parseInt(effect.value, 10), setValue: '', source: effect.source, penalty: false },
                                ),
                            );
                        }
                    }

                    effectBonus += parseInt(effect.value, 10);
                    bonusExplain +=
                        `\n${ effect.source }: Damage ${ parseInt(effect.value, 10) >= 0 ? '+' : '' }${ parseInt(effect.value, 10) }`;
                });
            dmgBonus += effectBonus;
        }

        //Concatenate the strings for a readable damage output
        let dmgResult = baseDice;

        if (dmgBonus > 0) {
            if (baseDice) {
                dmgResult += ' + ';
            }

            dmgResult += dmgBonus;
        } else if (dmgBonus < 0) {
            if (baseDice) {
                dmgResult += ' - ';
            }

            dmgResult += (dmgBonus * -1);
        }

        let dmgType = this.dmgType;

        if (dmgType) {
            // If any versatile traits have been added to the weapon's original traits,
            // also add the additional damage type to its damage type.
            traits.filter(trait => trait.toLowerCase().includes('versatile') && !this.traits.includes(trait)).forEach(trait => {
                const type = trait.split(' ')[1];

                if (type) {
                    dmgType += `/${ type }`;
                }
            });
            dmgResult += ` ${ dmgType }`;
        }

        dmgResult += ` ${ this._effectiveExtraDamage(creature, characterService, effectsService, range, prof, traits) }`;

        const explain = (`${ diceExplain.trim() }\n${ bonusExplain.trim() }`).trim();

        return { damageResult: dmgResult, explain, penalties, bonuses, absolutes };
    }
    public critSpecialization(creature: Creature, characterService: CharacterService, range: string): Array<Specialization> {
        const SpecializationGains: Array<SpecializationGain> = [];
        const specializations: Array<Specialization> = [];
        const prof = this.effectiveProficiency((creature as AnimalCompanion | Character), characterService);

        if (creature instanceof Character && this.group) {
            const character = creature as Character;
            const runeSource = this.runeSource(creature, range);
            const skillLevel = this.profLevel(creature, characterService, runeSource.propertyRunes);

            characterService.characterFeatsAndFeatures()
                .filter(feat => feat.gainSpecialization.length && feat.have({ creature: character }, { characterService }))
                .forEach(feat => {
                    SpecializationGains.push(...feat.gainSpecialization.filter(spec =>
                        (!spec.minLevel || creature.level >= spec.minLevel) &&
                        (!spec.bladeAlly || (this.bladeAlly || runeSource.propertyRunes.bladeAlly)) &&
                        (!spec.favoredWeapon || this.isFavoredWeapon(creature, characterService)) &&
                        (!spec.group || (this.group && spec.group.includes(this.group))) &&
                        (!spec.range || (range && spec.range.includes(range))) &&
                        (
                            !spec.name ||
                            ((this.name && spec.name.includes(this.name)) || (this.weaponBase && spec.name.includes(this.weaponBase)))
                        ) &&
                        (!spec.trait || this.traits.some(trait => spec.trait.includes(trait))) &&
                        (!spec.proficiency || (prof && spec.proficiency.includes(prof))) &&
                        (!spec.skillLevel || skillLevel >= spec.skillLevel) &&
                        (
                            !spec.featreq ||
                            characterService.characterFeatsAndFeatures(spec.featreq)[0]
                                ?.have({ creature: character }, { characterService }, { charLevel: character.level })
                        ),
                    ));
                });
            SpecializationGains.forEach(critSpec => {
                const specs: Array<Specialization> =
                    characterService.itemGroupSpecializations(this.group).map(spec => Object.assign(new Specialization(), spec).recast());

                specs.forEach(spec => {
                    if (critSpec.condition) {
                        spec.desc = `(${ critSpec.condition }) ${ spec.desc }`;
                    }

                    if (!specializations.some(existingspec => JSON.stringify(existingspec) === JSON.stringify(spec))) {
                        specializations.push(spec);
                    }
                });
            });
        }

        return specializations;
    }
    public secondaryRuneTitle(secondary: number): string {
        return this.strikingTitle(secondary);
    }
    protected _secondaryRuneName(): string {
        return this.strikingTitle(this.effectiveStriking());
    }
    protected _bladeAllyName(): Array<string> {
        const words: Array<string> = [];

        if (this.bladeAlly) {
            this.bladeAllyRunes.forEach(rune => {
                let name: string = rune.name;

                if (rune.name.includes('(Greater)')) {
                    name = `Greater ${ rune.name.substring(0, rune.name.indexOf('(Greater)')) }`;
                } else if (rune.name.includes(', Greater)')) {
                    name = `Greater ${ rune.name.substring(0, rune.name.indexOf(', Greater)')) })`;
                }

                words.push(name);
            });
        }

        return words;
    }
    private _effectPhrases(phrase: string, prof: string, range: string, traits: Array<string>, favoredWeapon: boolean): Array<string> {
        return [
            phrase,
            `${ this.name } ${ phrase }`,
            //"Longsword ", "Fist " etc.
            `${ this.weaponBase } ${ phrase }`,
            //"Sword ", "Club "
            `${ this.group } ${ phrase }`,
            //"Unarmed Attacks ", "Simple Weapons " etc.
            `${ prof } ${ phrase }`,
            //"Unarmed ", "Simple " etc.
            `${ prof.split(' ')[0] } ${ phrase }`,
            //"Weapons " (also "Attacks ", but that's unlikely to be needed)
            `${ prof.split(' ')[1] } ${ phrase }`,
            //"Simple Sword ", "Martial Club " etc.
            `${ prof.split(' ')[0] } ${ this.group } ${ phrase }`,
            //"Simple Longsword ", "Unarmed Fist " etc.
            `${ prof.split(' ')[0] } ${ this.weaponBase } ${ phrase }`,
            //"Melee ", "Ranged "
            `${ range } ${ phrase }`,
        ].concat(traits.map(trait => {
            //Add any traits, i.e. "Monk ", "Gnome ", but don't include any added ranges.
            if (trait.includes(' ft')) {
                return `${ trait.split(' ')[0] } ${ phrase }`;
            } else {
                return `${ trait } ${ phrase }`;
            }
        })).concat(
            traits.includes('Agile') ? [] : [
                `Non-Agile ${ phrase }`,
            ],
        )
            .concat(
                favoredWeapon ? [
                    `Favored Weapon ${ phrase }`,
                    //"Simple Favored Weapon ", "Unarmed Favored Weapon " etc.
                    `${ prof.split(' ')[0] } Favored Weapon ${ phrase }`,
                    //"Melee Favored Weapon ", "Ranged Favored Weapon " etc.
                    `${ range } Favored Weapon ${ phrase }`,
                ] : [],
            );
    }
    private _effectiveShoddy(creature: Creature, characterService: CharacterService): number {
        //Shoddy items have a -2 penalty to Attack, unless you have the Junk Tinker feat and have crafted the item yourself.
        if (this.shoddy && characterService.feats('Junk Tinker')[0]?.have({ creature }, { characterService }) && this.crafted) {
            this.$shoddy = ShoddyPenalties.NotShoddy;

            return this.$shoddy;
        } else if (this.shoddy) {
            this.$shoddy = ShoddyPenalties.Shoddy;

            return this.$shoddy;
        } else {
            this.$shoddy = ShoddyPenalties.NotShoddy;

            return this.$shoddy;
        }
    }
    private _emblazonArmamentActive(creature: Creature, characterService: CharacterService): boolean {
        this.$emblazonArmament = false;
        this.$emblazonEnergy = false;
        this.emblazonArmament.forEach(ea => {
            if (
                ea.emblazonDivinity ||
                (
                    creature instanceof Character &&
                    characterService.currentCharacterDeities(creature).some(deity => deity.name.toLowerCase() === ea.deity.toLowerCase())
                )
            ) {
                switch (ea.type) {
                    case 'emblazonArmament':
                        this.$emblazonArmament = true;
                        break;
                    case 'emblazonEnergy':
                        this.$emblazonEnergy = true;
                        break;
                    case 'emblazonAntimagic':
                        this.$emblazonAntimagic = true;
                        break;
                    default: break;
                }
            }
        });

        return this.$emblazonArmament || this.$emblazonEnergy || this.$emblazonAntimagic;
    }
    private _effectiveExtraDamage(
        creature: Character | AnimalCompanion,
        characterService: CharacterService,
        effectsService: EffectsService,
        range: string,
        prof: string,
        traits: Array<string>,
    ): string {
        let extraDamage = '';

        if (this.extraDamage) {
            extraDamage += `\n${ this.extraDamage }`;
        }

        const runeSource = this.runeSource(creature, range);

        runeSource.propertyRunes.propertyRunes
            .filter((weaponRune: WeaponRune) => weaponRune.extraDamage)
            .forEach((weaponRune: WeaponRune) => {
                extraDamage += `\n${ weaponRune.extraDamage }`;
            });
        this.oilsApplied
            .filter((oil: Oil) => oil.runeEffect && oil.runeEffect.extraDamage)
            .forEach((oil: Oil) => {
                extraDamage += `\n${ oil.runeEffect.extraDamage }`;
            });

        if (runeSource.propertyRunes.bladeAlly) {
            runeSource.propertyRunes.bladeAllyRunes
                .filter((weaponRune: WeaponRune) => weaponRune.extraDamage)
                .forEach((weaponRune: WeaponRune) => {
                    extraDamage += `\n${ weaponRune.extraDamage }`;
                });
        }

        //Emblazon Energy on a weapon adds 1d4 damage of the chosen type if the deity matches.
        if (creature instanceof Character) {
            if (this.$emblazonEnergy) {
                this.emblazonArmament.filter(ea => ea.type === 'emblazonEnergy').forEach(ea => {
                    let eaDmg = '+1d4 ';
                    const type = ea.choice;

                    creature.class.spellCasting.find(casting => casting.source === 'Domain Spells')?.spellChoices.forEach(choice => {
                        choice.spells.forEach(spell => {
                            if (characterService.spellsService.spellFromName(spell.name)?.traits.includes(type)) {
                                eaDmg = '+1d6 ';
                            }
                        });
                    });
                    extraDamage += `\n${ eaDmg }${ type }`;
                });
            }
        }

        //Add any damage from effects. These effects must be toggle and have the damage as a string in their title.
        const effectPhrasesExtraDamage =
            this._effectPhrases('Extra Damage', prof, range, traits, this.isFavoredWeapon(creature, characterService));
        const agile = traits.includes('Agile') ? 'Agile' : 'Non-Agile';

        //"Agile/Non-Agile Large Melee Weapon Extra Damage"
        if (this.large) {
            effectPhrasesExtraDamage.push(`${ agile } Large ${ range } Weapon Extra Damage`);
        }

        //"Agile/Non-Agile Melee Extra Damage"
        effectPhrasesExtraDamage.push(`${ agile } ${ range } Extra Damage`);

        if ((range === 'ranged') && this.traits.some(trait => trait.includes('Thrown'))) {
            //"Agile/Non-Agile Thrown Large Weapon ExtraDamage"
            if (this.large) {
                effectPhrasesExtraDamage.push(
                    `${ agile } Thrown Large Weapon Extra Damage`,
                );
            }

            //"Agile/Non-Agile Thrown Weapon Damage"
            effectPhrasesExtraDamage.push(`${ agile } Thrown Weapon Extra Damage`);
        }

        effectsService.toggledEffectsOnThese(creature, effectPhrasesExtraDamage).filter(effect => effect.title)
            .forEach(effect => {
                extraDamage += `\n${ !['+', '-'].includes(effect.title.substr(0, 1)) ? '+' : '' }${ effect.title }`;
            });
        extraDamage = extraDamage.split('+').map(part => part.trim())
            .join(' + ');
        extraDamage = extraDamage.split('-').map(part => part.trim())
            .join(' - ');

        return extraDamage;
    }
}
