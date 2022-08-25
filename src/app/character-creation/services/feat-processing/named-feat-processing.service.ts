import { Injectable } from '@angular/core';
import { LoreChoice } from 'src/app/classes/LoreChoice';
import { SpellChoice } from 'src/app/classes/SpellChoice';
import { CharacterService } from 'src/app/services/character.service';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { CharacterDeitiesService } from 'src/libs/shared/services/character-deities/character-deities.service';
import { CharacterFeatsService } from 'src/libs/shared/services/character-feats/character-feats.service';
import { CharacterLoreService } from 'src/libs/shared/services/character-lore/character-lore.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { Feat } from '../../definitions/models/Feat';
import { FeatProcessingContext } from './feat-processing.service';

@Injectable({
    providedIn: 'root',
})
export class NamedFeatProcessingService {

    constructor(
        private readonly _characterService: CharacterService,
        private readonly _refreshService: RefreshService,
        private readonly _characterLoreService: CharacterLoreService,
        private readonly _characterDeitiesService: CharacterDeitiesService,
        private readonly _characterFeatsService: CharacterFeatsService,
    ) { }

    public processNamedFeats(
        feat: Feat,
        taken: boolean,
        context: FeatProcessingContext,
    ): void {

        this._processBargainHunter(feat, taken, context);

        this._processDifferentWorlds(feat, taken, context);

        this._processBlessedBlood(feat, taken, context);

        this._processCantripConnection(feat, taken, context);

        this._processSpellBattery(feat, taken, context);

        this._processWizardSchools(feat, taken, context);

        this._processSpellBlending(feat, taken, context);

        this._processInfinitePossibilities(feat, taken, context);

        this._processAdaptedCantrip(feat, taken, context);

        this._processAdaptiveAdept(feat, taken, context);

        this._processGiantInstinct(feat, taken, context);

        this._processBladeAlly(feat, taken, context);

        this._processSpellCombination(feat, taken, context);

        this._processArcaneEvolution(feat, taken, context);

        this._processSpellMastery(feat, taken, context);

        this._processSplinterFaith(feat, taken, context);

        this._processSyncretism(feat, taken, context);
    }

    private _processBargainHunter(feat: Feat, taken: boolean, context: FeatProcessingContext): void {
        //Bargain Hunter adds to your starting cash at level 1
        if (feat.name === 'Bargain Hunter') {
            const bargainHunterGoldBonus = 2;

            if (context.level.number === 1) {
                if (taken) {
                    context.character.cash[1] += bargainHunterGoldBonus;
                } else {
                    context.character.cash[1] -= bargainHunterGoldBonus;
                }
            }

            this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'inventory');
        }
    }

    private _processDifferentWorlds(feat: Feat, taken: boolean, context: FeatProcessingContext): void {
        //Remove the lore choice that was customized when processing Different Worlds.
        if (feat.name === 'Different Worlds') {
            if (!taken) {
                const oldChoices: Array<LoreChoice> =
                    context.level.loreChoices.filter(loreChoice => loreChoice.source === 'Different Worlds');
                const oldChoice = oldChoices[oldChoices.length - 1];

                if (oldChoice?.increases.length) {
                    this._characterLoreService.removeLore(context.character, oldChoice);
                }
            }
        }
    }

    private _processBlessedBlood(feat: Feat, taken: boolean, context: FeatProcessingContext): void {
        //Remove spells that were granted by Blessed Blood.
        if (feat.name === 'Blessed Blood') {
            if (!taken) {
                const removeList: Array<{ name: string; levelNumber: number }> =
                    context.character.class.spellList
                        .filter(listSpell => listSpell.source === 'Feat: Blessed Blood')
                        .map(listSpell => ({ name: listSpell.name, levelNumber: listSpell.level }));

                removeList.forEach(spell => {
                    context.character.class.removeSpellListSpell(spell.name, `Feat: ${ feat.name }`, spell.levelNumber);
                });
            }
        }
    }

    private _processCantripConnection(feat: Feat, taken: boolean, context: FeatProcessingContext): void {
        //Cantrip Connection
        if (feat.name === 'Cantrip Connection') {
            const spellCasting = context.character.class.spellCasting
                .find(casting => casting.className === this._characterService.familiar.originClass && casting.castingType !== 'Focus');

            if (taken) {
                if (spellCasting) {
                    const newSpellChoice = new SpellChoice();

                    newSpellChoice.available = 1;
                    newSpellChoice.level = 0;
                    newSpellChoice.className = spellCasting.className;
                    newSpellChoice.castingType = spellCasting.castingType;
                    newSpellChoice.source = `Feat: ${ feat.name }`;

                    const familiarLevel = this._characterFeatsService.characterFeatsAndFeatures()
                        .filter(characterFeat =>
                            characterFeat.gainFamiliar,
                            //TO-DO: Removed characterHasFeat() here, check if it still works.
                        )
                        .map(characterFeat => context.character.class.levels
                            .find(classLevel => classLevel.featChoices
                                .some(featChoice => featChoice.feats
                                    .some(featTaken => featTaken.name === characterFeat.name),
                                ),
                            ),
                        )[0];

                    context.character.class.addSpellChoice(familiarLevel.number, newSpellChoice);
                }
            } else {
                const oldSpellChoice = spellCasting.spellChoices.find(spellChoice => spellChoice.source === `Feat: ${ feat.name }`);

                if (oldSpellChoice) {
                    context.character.class.removeSpellChoice(oldSpellChoice);
                }
            }

            this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'spells');
            this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'spellbook');
        }
    }

    private _processSpellBattery(feat: Feat, taken: boolean, context: FeatProcessingContext): void {
        //Spell Battery
        if (feat.name === 'Spell Battery') {
            const spellCasting = context.character.class.spellCasting
                .find(casting => casting.className === this._characterService.familiar.originClass && casting.castingType !== 'Focus');

            if (taken) {
                if (spellCasting) {
                    const newSpellChoice = new SpellChoice();

                    newSpellChoice.available = 1;
                    newSpellChoice.dynamicLevel = 'highestSpellLevel - 3';
                    newSpellChoice.className = spellCasting.className;
                    newSpellChoice.castingType = spellCasting.castingType;
                    newSpellChoice.source = `Feat: ${ feat.name }`;

                    const familiarLevel = this._characterFeatsService.characterFeatsAndFeatures()
                        .filter(characterFeat =>
                            characterFeat.gainFamiliar,
                            //TO-DO: Removed characterHasFeat() here, check if it still works.
                        )
                        .map(characterFeat => context.character.class.levels
                            .find(classLevel => classLevel.featChoices
                                .some(featChoice => featChoice.feats
                                    .some(featTaken => featTaken.name === characterFeat.name),
                                ),
                            ),
                        )[0];

                    context.character.class.addSpellChoice(familiarLevel.number, newSpellChoice);
                }
            } else {
                const oldSpellChoice = spellCasting.spellChoices.find(spellChoice => spellChoice.source === `Feat: ${ feat.name }`);

                if (oldSpellChoice) {
                    context.character.class.removeSpellChoice(oldSpellChoice);
                }
            }

            this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'spells');
            this._refreshService.prepareDetailToChange(CreatureTypes.Character, 'spellbook');
        }
    }

    private _processWizardSchools(feat: Feat, taken: boolean, context: FeatProcessingContext): void {
        //Reset bonded item charges when selecting or deselecting Wizard schools.
        if (['Abjuration School', 'Conjuration School', 'Divination School', 'Enchantment School', 'Evocation School',
            'Illusion School', 'Necromancy School', 'Transmutation School', 'Universalist Wizard'].includes(feat.name)) {
            if (taken) {
                context.character.class.spellCasting
                    .filter(casting => casting.castingType === 'Prepared' && casting.className === 'Wizard')
                    .forEach(casting => {
                        const superiorBond =
                            this._characterFeatsService.characterHasFeat('Superior Bond') ? 1 : 0;

                        if (feat.name === 'Universalist Wizard') {
                            casting.bondedItemCharges = [superiorBond, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1];
                        } else {
                            casting.bondedItemCharges = [1 + superiorBond, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                        }
                    });
            } else {
                context.character.class.spellCasting
                    .filter(casting => casting.castingType === 'Prepared' && casting.className === 'Wizard')
                    .forEach(casting => {
                        casting.bondedItemCharges = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                    });
                context.character.class.spellBook =
                    context.character.class.spellBook.filter(learned => learned.source !== 'school');
            }
        }
    }

    private _processSpellBlending(feat: Feat, taken: boolean, context: FeatProcessingContext): void {
        //Reset changes made with Spell Blending.
        if (feat.name === 'Spell Blending') {
            context.character.class.spellCasting.forEach(casting => {
                casting.spellChoices.forEach(spellChoice => {
                    spellChoice.spellBlending = [0, 0, 0];
                });
            });
            this._refreshService.prepareDetailToChange(context.creature.type, 'spells');
            this._refreshService.prepareDetailToChange(context.creature.type, 'spellbook');
        }
    }

    private _processInfinitePossibilities(feat: Feat, taken: boolean, context: FeatProcessingContext): void {
        //Reset changes made with Infinite Possibilities.
        if (feat.name === 'Infinite Possibilities') {
            context.character.class.spellCasting.forEach(casting => {
                casting.spellChoices.forEach(spellChoice => {
                    spellChoice.infinitePossibilities = false;
                });
            });
            this._refreshService.prepareDetailToChange(context.creature.type, 'spells');
            this._refreshService.prepareDetailToChange(context.creature.type, 'spellbook');
        }
    }

    private _processAdaptedCantrip(feat: Feat, taken: boolean, context: FeatProcessingContext): void {
        //Reset changes made with Adapted Cantrip.
        if (feat.name === 'Adapted Cantrip') {
            context.character.class.spellCasting.forEach(casting => {
                casting.spellChoices.forEach(spellChoice => {
                    spellChoice.adaptedCantrip = false;
                });
            });
            context.character.class.spellBook =
                context.character.class.spellBook.filter(learned => learned.source !== 'adaptedcantrip');
            this._refreshService.prepareDetailToChange(context.creature.type, 'spells');
            this._refreshService.prepareDetailToChange(context.creature.type, 'spellbook');
        }
    }

    private _processAdaptiveAdept(feat: Feat, taken: boolean, context: FeatProcessingContext): void {
        //Reset changes made with Adaptive Adept.
        if (feat.name.includes('Adaptive Adept')) {
            context.character.class.spellCasting.forEach(casting => {
                casting.spellChoices.forEach(spellChoice => {
                    spellChoice.adaptiveAdept = false;
                });
            });
            context.character.class.spellBook =
                context.character.class.spellBook.filter(learned => learned.source !== 'adaptiveadept');
            this._refreshService.prepareDetailToChange(context.creature.type, 'spells');
            this._refreshService.prepareDetailToChange(context.creature.type, 'spellbook');
        }
    }

    private _processGiantInstinct(feat: Feat, taken: boolean, context: FeatProcessingContext): void {
        //Reset changes made with Giant Instinct.
        if (feat.name === 'Giant Instinct') {
            context.character.inventories.forEach(inv => {
                inv.weapons.forEach(weapon => {
                    weapon.large = false;
                });
            });
            this._refreshService.prepareDetailToChange(context.creature.type, 'inventory');
            this._refreshService.prepareDetailToChange(context.creature.type, 'attacks');
        }
    }

    private _processBladeAlly(feat: Feat, taken: boolean, context: FeatProcessingContext): void {
        //Reset changes made with Blade Ally.
        if (feat.name === 'Divine Ally: Blade Ally') {
            context.character.inventories.forEach(inv => {
                inv.weapons.forEach(weapon => {
                    weapon.bladeAlly = false;
                    weapon.bladeAllyRunes = [];
                });
                inv.wornitems.forEach(wornItem => {
                    wornItem.bladeAlly = false;
                    wornItem.bladeAllyRunes = [];
                });
                this._refreshService.prepareDetailToChange(context.creature.type, 'inventory');
                this._refreshService.prepareDetailToChange(context.creature.type, 'attacks');
            });
        }
    }

    private _processSpellCombination(feat: Feat, taken: boolean, context: FeatProcessingContext): void {
        //Spell Combination changes certain spell choices permanently.
        if (feat.name === 'Spell Combination') {
            if (taken) {
                context.character.class.spellCasting
                    .filter(casting => casting.className === 'Wizard' && casting.castingType === 'Prepared')
                    .forEach(casting => {
                        const firstSpellCombinationLevel = 3;
                        const lastSpellCombinationLevel = 10;

                        for (let spellLevel = firstSpellCombinationLevel; spellLevel <= lastSpellCombinationLevel; spellLevel++) {
                            casting.spellChoices
                                .find(spellChoice => spellChoice.level === spellLevel && spellChoice.available === 1)
                                .spellCombinationAllowed = true;
                        }
                    });
                this._refreshService.prepareDetailToChange(context.creature.type, 'spells');
                this._refreshService.prepareDetailToChange(context.creature.type, 'spellchoices');
                this._refreshService.prepareDetailToChange(context.creature.type, 'spellbook');
            } else {
                context.character.class.spellCasting
                    .filter(casting => casting.className === 'Wizard' && casting.castingType === 'Prepared')
                    .forEach(casting => {
                        casting.spellChoices
                            .filter(spellChoice => spellChoice.spellCombinationAllowed)
                            .forEach(spellChoice => {
                                spellChoice.spellCombinationAllowed = false;
                                spellChoice.spellCombination = false;
                                spellChoice.spells.forEach(spellGain => spellGain.combinationSpellName = '');
                            });
                    });
                this._refreshService.prepareDetailToChange(context.creature.type, 'spells');
                this._refreshService.prepareDetailToChange(context.creature.type, 'spellchoices');
                this._refreshService.prepareDetailToChange(context.creature.type, 'spellbook');
            }
        }
    }

    private _processArcaneEvolution(feat: Feat, taken: boolean, context: FeatProcessingContext): void {
        //Reset changes made with Arcane Evolution.
        if (feat.name.includes('Arcane Evolution')) {
            context.character.class.spellBook =
                context.character.class.spellBook.filter(learned => learned.source !== 'arcaneevolution');
            this._refreshService.prepareDetailToChange(context.creature.type, 'spells');
            this._refreshService.prepareDetailToChange(context.creature.type, 'spellchoices');
            this._refreshService.prepareDetailToChange(context.creature.type, 'spellbook');
        }
    }

    private _processSpellMastery(feat: Feat, taken: boolean, context: FeatProcessingContext): void {
        //Reset changes made with Spell Mastery
        if (feat.name === 'Spell Mastery') {
            context.character.class.spellCasting.forEach(casting => {
                casting.spellChoices = casting.spellChoices.filter(spellChoice => spellChoice.source !== 'Feat: Spell Mastery');
            });
            this._refreshService.prepareDetailToChange(context.creature.type, 'spells');
            this._refreshService.prepareDetailToChange(context.creature.type, 'spellbook');
        }
    }

    private _processSplinterFaith(feat: Feat, taken: boolean, context: FeatProcessingContext): void {
        //Splinter Faith changes your domains and needs to clear out the runtime variables and update general.
        if (feat.name === 'Splinter Faith') {
            this._characterDeitiesService.currentCharacterDeities(context.character).forEach(deity => {
                deity.clearTemporaryDomains();
            });
            this._refreshService.prepareDetailToChange(context.creature.type, 'general');
        }
    }

    private _processSyncretism(feat: Feat, taken: boolean, context: FeatProcessingContext): void {
        //Syncretism changes your deities and needs to clear out the runtime variables and update general.
        if (feat.name === 'Syncretism') {
            this._characterDeitiesService.clearCharacterDeities();
            this._refreshService.prepareDetailToChange(context.creature.type, 'general');
        }
    }

}
