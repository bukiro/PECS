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
    public previousCondition: ConditionGain = null;
    public nextStage: number = 0;
    public onset: boolean = false;
    public fixedDuration: number = 0;
    public persistent: boolean = false;
    public restricted: boolean = false;
    public traits: string[] = [];
    //If a condition has notes (like the HP of a summoned object), they get copied on the conditionGain.
    public notes: string = "";
    //List choices you can make for this condition. The first choice must never have a featreq.
    public choices: ConditionChoice[] = [];
    //$choices is a temporary value that stores the filtered result of get_Choices();
    public $choices: string[] = [];
    //This property is only used to select a default choice before adding the condition. It is not read when evaluating the condition.
    public choice: string = "";
    public unlimited: boolean = false;
    get_Choices(characterService: CharacterService, filtered: boolean = false) {
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
                let result: Array<{ met?: boolean, desc?: string }> = [];
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
            };
        })
        this.$choices = choices;
        return this.$choices;
    }
}