import { ConditionGain } from './ConditionGain';
import { EffectGain } from './EffectGain';
import { ActivityGain } from './ActivityGain';
import { ItemGain } from './ItemGain';
import { AttackRestriction } from './AttackRestriction';
import { SenseGain } from './SenseGain';
import { Hint } from './Hint';
import { Creature } from './Creature';
import { Character } from './Character';
import { ConditionChoice } from './ConditionChoice';
import { CharacterService } from './character.service';
import { Familiar } from './Familiar';
import { Feat } from './Feat';

export class Condition {
    public name: string = "";
    public type: string = "";
    public buff: boolean = false;
    public minLevel: number = 0;
    public hasValue: boolean = false;
    public decreasingValue: boolean = false;
    public value: number = 0;
    public desc: string = "";
    public hints: Hint[] = [];
    public inputRequired: string = "";
    public onceEffects: EffectGain[] = [];
    public endEffects: EffectGain[] = [];
    public effects: EffectGain[] = [];
    public gainActivities: ActivityGain[] = [];
    public gainConditions: ConditionGain[] = [];
    public gainItems: ItemGain[] = [];
    public overrideConditions: string[] = [];
    public endConditions: string[] = [];
    //Remove this condition if any of the endsWithConditions is removed.
    public endsWithConditions: string[] = [];
    public attackRestrictions: AttackRestriction[] = [];
    public source: string = "";
    public senses: SenseGain[] = [];
    public nextCondition: ConditionGain = null;
    public fixedDuration: number = 0;
    public persistent: boolean = false;
    public restricted: boolean = false;
    public radius: number = 0;
    public allowRadiusChange: boolean = false;
    public traits: string[] = [];
    //If a condition has notes (like the HP of a summoned object), they get copied on the conditionGain.
    public notes: string = "";
    //List choices you can make for this condition. The first choice must never have a featreq.
    public choices: ConditionChoice[] = [];
    //$choices is a temporary value that stores the filtered name list produced by get_Choices();
    public $choices: string[] = [];
    //This property is only used to select a default choice before adding the condition. It is not read when evaluating the condition.
    public choice: string = "";
    public unlimited: boolean = false;
    get_Choices(characterService: CharacterService, filtered: boolean = false, spellLevel: number = 0) {
        //If this.choice is not one of the available choices, set it to the first.
        if (this.choices.length && !this.choices.map(choice => choice.name).includes(this.choice)) {
            this.choice == this.choices[0].name;
        }
        if (!filtered) {
            return this.choices.map(choice => choice.name);
        }
        let choices: string[] = [];
        this.choices.forEach(choice => {
            //The default choice is never tested. This ensures a fallback if no choices are available.
            if (choice.name == this.choice) {
                choices.push(choice.name)
            } else {
                let character = characterService.get_Character();
                //If the choice has a featreq, check if you meet that (or a feat that has this supertype).
                //Requirements like "Aggressive Block or Brutish Shove" are split in get_FeatsAndFeatures().
                if (!choice.spelllevelreq || spellLevel >= choice.spelllevelreq) {
                    if (choice.featreq?.length) {
                        let featNotFound: boolean = false;
                        choice.featreq.forEach(featreq => {
                            //Allow to check for the Familiar's feats
                            let requiredFeat: Feat[]
                            let testcreature: Character | Familiar;
                            let testfeat = featreq;
                            if (featreq.includes("Familiar:")) {
                                testcreature = characterService.get_Familiar();
                                testfeat = featreq.split("Familiar:")[1].trim();
                                requiredFeat = characterService.familiarsService.get_FamiliarAbilities(testfeat);
                            } else {
                                testcreature = character;
                                requiredFeat = characterService.get_FeatsAndFeatures(testfeat, "", true);
                            }
                            if (requiredFeat.length) {
                                if (!requiredFeat.find(feat => feat.have(testcreature, characterService, character.level))) {
                                    featNotFound = true;
                                }
                            } else {
                                featNotFound = true;
                            }
                        })
                        if (!featNotFound) {
                            choices.push(choice.name);
                        }
                    } else {
                        choices.push(choice.name);
                    }
                }
            };
        })
        this.$choices = choices;
        return this.$choices;
    }
    get_ChoiceNextStage(choiceName: string) {
        return this.choices.find(choice => choice.name == choiceName)?.nextStage || 0;
    }
    get_HeightenedItems(levelNumber: number) {
        //This descends through the level numbers, starting with levelNumber and returning the first set of ItemGains found with a matching heightenedfilter.
        //It also returns all items that have no heightenedFilter.
        //If there are no ItemGains with a heightenedFilter, return all.
        let items: ItemGain[] = [];
        if (!this.gainItems.length) {
            return this.gainItems;
        }
        items.push(...this.gainItems.filter(gain => !gain.heightenedFilter))
        if (this.gainItems.some(gain => gain.heightenedFilter)) {
            switch (levelNumber) {
                case 10:
                    if (this.gainItems.some(gain => gain.heightenedFilter == 10)) {
                        items.push(...this.gainItems.filter(gain => gain.heightenedFilter == 10));
                        break;
                    }
                case 9:
                    if (this.gainItems.some(gain => gain.heightenedFilter == 9)) {
                        items.push(...this.gainItems.filter(gain => gain.heightenedFilter == 9));
                        break;
                    }
                case 8:
                    if (this.gainItems.some(gain => gain.heightenedFilter == 8)) {
                        items.push(...this.gainItems.filter(gain => gain.heightenedFilter == 8));
                        break;
                    }
                case 7:
                    if (this.gainItems.some(gain => gain.heightenedFilter == 7)) {
                        items.push(...this.gainItems.filter(gain => gain.heightenedFilter == 7));
                        break;
                    }
                case 6:
                    if (this.gainItems.some(gain => gain.heightenedFilter == 6)) {
                        items.push(...this.gainItems.filter(gain => gain.heightenedFilter == 6));
                        break;
                    }
                case 5:
                    if (this.gainItems.some(gain => gain.heightenedFilter == 5)) {
                        items.push(...this.gainItems.filter(gain => gain.heightenedFilter == 5));
                        break;
                    }
                case 4:
                    if (this.gainItems.some(gain => gain.heightenedFilter == 4)) {
                        items.push(...this.gainItems.filter(gain => gain.heightenedFilter == 4));
                        break;
                    }
                case 3:
                    if (this.gainItems.some(gain => gain.heightenedFilter == 3)) {
                        items.push(...this.gainItems.filter(gain => gain.heightenedFilter == 3));
                        break;
                    }
                case 2:
                    if (this.gainItems.some(gain => gain.heightenedFilter == 2)) {
                        items.push(...this.gainItems.filter(gain => gain.heightenedFilter == 2));
                        break;
                    }
                case 1:
                    if (this.gainItems.some(gain => gain.heightenedFilter == 1)) {
                        items.push(...this.gainItems.filter(gain => gain.heightenedFilter == 1));
                        break;
                    }
            }
        }
        return items;
    }
}