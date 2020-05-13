import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CharacterService } from '../character.service';
import { ClassesService } from '../classes.service';
import { Class } from '../Class';
import { Level } from '../Level';
import { Skill } from '../Skill';
import { AbilitiesService } from '../abilities.service';
import { EffectsService } from '../effects.service';
import { FeatsService } from '../feats.service';
import { Feat } from '../Feat';
import { HistoryService } from '../history.service';
import { Ancestry } from '../Ancestry';
import { Heritage } from '../Heritage';
import { ItemsService } from '../items.service';
import { Background } from '../Background';
import { SkillChoice } from '../SkillChoice';
import { LoreChoice } from '../LoreChoice';
import { Ability } from '../Ability';
import { AbilityChoice } from '../AbilityChoice';
import { FeatChoice } from '../FeatChoice';
import { SortByPipe } from '../sortBy.pipe';
import { SpellCasting } from '../SpellCasting';
import { ActivitiesService } from '../activities.service';
import { Deity } from '../Deity';
import { DeitiesService } from '../deities.service';
import { SpellsService } from '../spells.service';
import { FeatTaken } from '../FeatTaken';
import { AbilityBoost } from '../AbilityBoost';
import { AnimalCompanionAncestry } from '../AnimalCompanionAncestry';
import { ItemGain } from '../ItemGain';
import { AnimalCompanion } from '../AnimalCompanion';
import { AnimalCompanionsService } from '../animalcompanions.service';
import { AnimalCompanionClass } from '../AnimalCompanionClass';
import { ConditionsService } from '../Conditions.service';
import { BloodlinesService } from '../bloodlines.service';
import { Bloodline } from '../Bloodline';
import { AnimalCompanionSpecialization } from '../AnimalCompanionSpecialization';
import { Familiar } from '../Familiar';
import { SpellCast } from '../SpellCast';

@Component({
    selector: 'app-character',
    templateUrl: './character.component.html',
    styleUrls: ['./character.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class CharacterComponent implements OnInit {

    public newClass: Class = new Class();
    private showItem: string = "";
    private showList: string = "";
    
    constructor(
        private changeDetector:ChangeDetectorRef,
        public characterService: CharacterService,
        public classesService: ClassesService,
        public abilitiesService: AbilitiesService,
        public effectsService: EffectsService,
        public featsService: FeatsService,
        public historyService: HistoryService,
        private itemsService: ItemsService,
        private activitiesService: ActivitiesService,
        private deitiesService: DeitiesService,
        private spellsService: SpellsService,
        private animalCompanionsService: AnimalCompanionsService,
        private conditionsService: ConditionsService,
        private bloodlinesService: BloodlinesService,
        private sortByPipe: SortByPipe
    ) { }

    minimize() {
        this.characterService.get_Character().settings.characterMinimized = !this.characterService.get_Character().settings.characterMinimized;
    }

    toggleCharacterMenu() {
        this.characterService.toggleMenu("character");
    }

    toggle_Item(name: string) {
        if (this.showItem == name) {
            this.showItem = "";
        } else {
            this.showItem = name;
        }
    }

    toggle_List(name: string) {
        if (this.showList == name) {
            this.showList = "";
        } else {
            this.showList = name;
        }
    }

    receive_ChoiceMessage(name: string) {
        this.toggle_List(name);
    }

    receive_FeatMessage(name: string) {
        this.toggle_Item(name);
    }

    get_showItem() {
        return this.showItem;
    }

    get_showList() {
        return this.showList;
    }

    get_Accent() {
        return this.characterService.get_Accent();
    }

    //If you don't use trackByIndex on certain inputs, you lose focus everytime the value changes. I don't get that, but I'm using it now.
    trackByIndex(index: number, obj: any): any {
        return index;
    }

    on_NewCharacter() {
        this.characterService.reset_Character();
    }

    change_Name() {
        this.set_Changed("Character");
    }

    load_Character(name: string) {
        this.toggleCharacterMenu();
        this.characterService.reset_Character(name);
    }

    get_Alignments() {
        //Champions and Clerics need to pick an alignment matching their deity
        let deity: Deity = this.get_Deities(this.get_Character().class.deity)[0]
        let alignments = [
            "",
            "Lawful Good",
            "Neutral Good",
            "Chaotic Good",
            "Lawful Neutral",
            "Neutral",
            "Chaotic Neutral",
            "Lawful Evil",
            "Neutral Evil",
            "Chaotic Evil"
        ]
        if (deity && ["Champion", "Cleric"].includes(this.get_Character().class.name)) {
            return alignments.filter(alignment => 
                !deity.followerAlignments ||
                deity.followerAlignments.includes(alignment)
            )
        } else {
            return alignments;
        }
        
    }

    get_Level(number: number) {
        return this.get_Character().class.levels[number];
    }

    onBaseValueChange() {
        let baseValues = this.get_Character().baseValues;
        if (baseValues.length) {
            baseValues.length = 0;
        } else {
            this.get_Abilities().forEach(ability => {
                baseValues.push({name:ability.name, baseValue:10})
            });
            //Remove all Level 1 ability boosts that are now illegal
            if (this.get_Character().class.name) {
                this.get_Character().class.levels[1].abilityChoices.filter(choice => choice.available).forEach(choice => {
                    choice.boosts.length = Math.min(choice.available - choice.baseValuesLost, choice.boosts.length);
                });
            }
        }
        this.characterService.set_Changed();
    }

    set_Changed(target: string = "") {
        this.characterService.set_Changed(target);
    }

    numbersOnly(event): boolean {
        const charCode = (event.which) ? event.which : event.keyCode;
        if (charCode > 31 && (charCode < 48 || charCode > 57)) {
            return false;
        }
        return true;
    }

    on_LevelChange(oldLevel: number) {
        //Despite all precautions, when we change the level, it gets turned into a string. So we turn it right back.
        this.get_Character().level = parseInt(this.get_Character().level.toString());
        let newLevel = this.get_Character().level;
        //If we went up levels, repeat any onceEffects of Feats that apply inbetween, such as recovering Focus Points for a larger Focus Pool
        if (newLevel > oldLevel) {
            this.get_Character().get_FeatsTaken(oldLevel, newLevel).map((gain: FeatTaken) => this.get_FeatsAndFeatures(gain.name)[0])
            .filter((feat: Feat) => feat.onceEffects.length).forEach(feat => {
                feat.onceEffects.forEach(effect => {
                    this.characterService.process_OnceEffect(this.get_Character(), effect);
                })
            })
        }
        if (this.get_Companion()) {
            this.get_Companion().set_Level(this.characterService);
        }
        this.characterService.set_Changed();
    }

    get_LanguagesAvailable(levelNumber: number = 0) {
        let character = this.get_Character()
        if (character.class.ancestry.name) {
            if (levelNumber) {
                //If level is given, check if any new languages have been added on this level. If not, don't get any languages at this point.
                let newLanguages: number = 0;
                newLanguages += this.get_FeatsTaken(levelNumber, levelNumber).filter(gain => this.get_FeatsAndFeatures(gain.name)[0].effects.filter(effect => effect.affected == "Max Languages").length).length;
                newLanguages += character.get_AbilityBoosts(levelNumber, levelNumber, "Intelligence").length;
                if (!newLanguages) {
                    return false;
                }
            }
            //Ensure that the language list is always as long as ancestry languages + INT + any relevant feats
            let ancestry: Ancestry = this.get_Character().class.ancestry;
            let languages: number = ancestry.languages.length;
            let maxLanguages: number = ancestry.baseLanguages;
            let int = this.get_INT(character.level);
            if (int > 0) {
                maxLanguages += int;
            }
            this.effectsService.get_EffectsOnThis(this.get_Character(), "Max Languages").forEach(effect => {
                maxLanguages += parseInt(effect.value);
            })
            if (languages > maxLanguages) {
                ancestry.languages.splice(maxLanguages);
            } else {
                while (languages < maxLanguages) {
                    languages = ancestry.languages.push("");
                }
            }
            return true;
        } else {
            return false;
        }
    }

    get_AvailableLanguages() {
        return this.get_Character().class.ancestry.languages.filter(language => language == "").length
    }

    get_Character() {
        return this.characterService.get_Character();
    }

    get_MaxAvailable(choice: AbilityChoice) {
        return choice.maxAvailable(this.get_Character());
    }

    get_Abilities(name: string = "") {
        return this.characterService.get_Abilities(name)
    }

    get_AvailableAbilities(choice: AbilityChoice) {
        let abilities = this.get_Abilities('');
        if (choice.filter.length) {
            //If there is a filter, we need to find out if any of the filtered Abilities can actually be boosted.
            let cannotBoost = 0;
            if (choice.id.split("-")[0] == "1") {
                choice.filter.forEach(filter => {
                    if (this.cannotBoost(this.get_Abilities(filter)[0], this.get_Level(1), choice).length) {
                        cannotBoost += 1;
                    }
                });
            }
            //If any can be boosted, filter the list by the filter (and show the already selected abilities so you can unselect them if you like).
            //If none can be boosted, the list just does not get filtered.
            if (cannotBoost < choice.filter.length) {
                abilities = abilities.filter(ability => choice.filter.includes(ability.name) || this.abilityBoostedByThis(ability, choice))
            }
        }
        if (abilities.length) {
            return abilities.filter(ability => (
                this.abilityBoostedByThis(ability, choice) || (choice.boosts.length < choice.available - ((this.get_Character().baseValues.length > 0) ? choice.baseValuesLost : 0))
            ));
        }
    }
    
    someAbilitiesIllegal(choice: AbilityChoice) {
        let anytrue = 0;
        choice.boosts.forEach(boost => {
            if (this.abilityIllegal(parseInt(choice.id.split("-")[0]), this.get_Abilities(boost.name)[0])) {
                if (!boost.locked) {
                    this.get_Character().boost_Ability(this.characterService, boost.name, false, choice, boost.locked);
                    this.characterService.set_Changed();
                } else {
                    anytrue += 1;
                }
            }
        });
        return anytrue;
    }

    abilityIllegal(levelNumber: number, ability: Ability) {
        let illegal = false;
        if (levelNumber == 1 && ability.baseValue(this.get_Character(), this.characterService, levelNumber) > 18) {
            illegal = true;
        }
        return illegal;
    }

    cannotBoost(ability: Ability, level: Level, choice: AbilityChoice) {
        //Returns a string of reasons why the abiliyt cannot be boosted, or "". Test the length of the return if you need a boolean.
            let reasons: string[] = [];
            let sameBoostsThisLevel = this.get_AbilityBoosts(level.number, level.number, ability.name, "Boost", choice.source);
            if (sameBoostsThisLevel.length > 0 && sameBoostsThisLevel[0].source == choice.source) {
                //The ability may have been boosted by the same source, but as a fixed rule (e.g. fixed ancestry boosts vs. free ancestry boosts).
                //This does not apply to flaws - you can boost a flawed ability.
                if (sameBoostsThisLevel[0].locked) {
                    let locked = "Fixed boost by "+sameBoostsThisLevel[0].source+".";
                    reasons.push(locked);
                } else
                //If an ability has been raised by a source of the same name, but not the same id, it cannot be raised again.
                //This is the case with backgrounds: You get a choice of two abilities, and then a free one.
                 if (sameBoostsThisLevel[0].sourceId != choice.id) {
                    let exclusive = "Boosted by "+sameBoostsThisLevel[0].source+".";
                    reasons.push(exclusive);
                }
            }
            //On level 1, boosts are not allowed to raise the ability above 18.
            //This is only relevant if you haven't boosted the ability on this level yet.
            //If you have, we don't want to hear that it couldn't be boosted again right away.
            let cannotBoostHigher = "";
            if (level.number == 1 && ability.baseValue(this.get_Character(), this.characterService, level.number) > 16 && sameBoostsThisLevel.length == 0) {
                cannotBoostHigher = "Cannot boost above 18 on level 1.";
                reasons.push(cannotBoostHigher);
            }
            return reasons;
        }

    abilityBoostedByThis(ability: Ability, choice: AbilityChoice) {
            let levelNumber = parseInt(choice.id.split("-")[0]);
            return this.get_AbilityBoosts(levelNumber, levelNumber, ability.name, "Boost", choice.source, choice.id).length > 0;
        }

    get_AbilityBoosts(minLevelNumber: number, maxLevelNumber: number, abilityName: string = "", type: string = "", source: string = "", sourceId: string = "", locked: boolean = undefined) {
        return this.get_Character().get_AbilityBoosts(minLevelNumber, maxLevelNumber, abilityName, type, source, sourceId, locked);
    }

    on_AbilityBoost(abilityName: string, boost: boolean, choice: AbilityChoice, locked: boolean) {
        if (boost && choice.boosts.length == choice.available - ((this.get_Character().baseValues.length > 0) ? choice.baseValuesLost : 0) - 1) { this.showList=""; }
        this.get_Character().boost_Ability(this.characterService, abilityName, boost, choice, locked);
    }

    get_Skills(name: string = "", type: string = "") {
        return this.characterService.get_Skills(this.get_Character(), name, type)
    }

    prof(skillLevel: number) {
        switch (skillLevel) {
            case 2:
                return "T"
            case 4:
                return "E"
            case 6:
                return "M"
            case 8:
                return "L"
        }
    }

    size(size: number) {
        switch (size) {
            case -1:
                return "Small";
            case 0:
                return "Medium";
            case 1:
                return "Large";
        }
    }

    get_SkillINTBonus(choice: SkillChoice|LoreChoice) {
        //Allow INT more skills if any INT boosts have happened on this level, or less if INT is negative on the first level.
        let levelNumber = parseInt(choice.id.split("-")[0]);
        let boosts: AbilityBoost[] = this.characterService.get_Character().get_AbilityBoosts(levelNumber,levelNumber,"Intelligence")
        if (choice.source == "Intelligence") {
            return boosts.filter(boost => boost.type == "Boost").length;
        } else if (choice.source == "Class" && levelNumber == 1 && choice.available) {
            return boosts.filter(boost => boost.type == "Boost").length - boosts.filter(boost => boost.type == "Flaw").length;
        } else {
            return 0;
        }
    }

    get_AvailableSkills(choice: SkillChoice) {
        let skills = this.get_Skills('', choice.type);
        if (choice.filter.length) {
            skills = skills.filter(skill => choice.filter.includes(skill.name))
        }
        if (skills.length) {
            return skills.filter(skill => (
                this.skillIncreasedByThis(skill, choice) || choice.increases.length < choice.available + this.get_SkillINTBonus(choice)
                ));
        }
    }

    someIllegal(choice: SkillChoice) {
        let anytrue = 0;
        choice.increases.forEach(increase => {
            if (!this.get_Skills(increase.name)[0].isLegal(this.get_Character(), this.characterService, parseInt(choice.id.split("-")[0]), choice.maxRank)) {
                if (!increase.locked) {
                    this.get_Character().increase_Skill(this.characterService, increase.name, false, choice, increase.locked);
                    this.characterService.set_Changed();
                } else {
                    anytrue += 1;
                }
            }
        });
        return anytrue;
    }

    cannotIncrease(skill: Skill, level: Level, choice: SkillChoice) {
    //Returns a string of reasons why the skill cannot be increased, or "". Test the length of the return if you need a boolean.
        let maxRank: number = choice.maxRank;
        let reasons: string[] = [];
        //If this skill was raised by a feat on a higher level, it can't be raised on this level.
        //This prevents losing the feat bonus or raising the skill too high - feats never give +2, but always set the level
        //An exception is made for Additional Lore, which can be raised on Level 3, 7 and 15 no matter when you learned it
        let allIncreases = this.get_SkillIncreases(level.number+1, 20, skill.name, '');
        if (allIncreases.length > 0) {
            if (allIncreases[0].locked && allIncreases[0].source.includes("Feat: ") && allIncreases[0].source != "Feat: Additional Lore") {
                let trainedOnHigherLevel = "Trained on a higher level by "+allIncreases[0].source+".";
                reasons.push(trainedOnHigherLevel);
            }
        }
        //Check if this skill cannot be raised higher at this level, or if this method only allows a certain rank
        // (e.g. for Feats that TRAIN a skill)
        //This is only relevant if you haven't raised the skill on this level yet.
        //If you have, we don't want to hear that it couldn't be raised again right away
        let cannotIncreaseHigher = "";
        //You can never raise a skill higher than Legendary (8)
        if (skill.level(this.get_Character(), this.characterService, level.number) == 8 && !this.skillIncreasedByThis(skill, choice)) {
            cannotIncreaseHigher = "Cannot increase any higher.";
            reasons.push(cannotIncreaseHigher);
        } else if (!skill.canIncrease(this.get_Character(), this.characterService, level.number, maxRank) && !this.skillIncreasedByThis(skill, choice)) {
            if (!skill.canIncrease(this.get_Character(), this.characterService, level.number)) {
                cannotIncreaseHigher = "Cannot increase any higher on this level.";
            } else {
                cannotIncreaseHigher = "Cannot increase any higher with this method.";
            }
            reasons.push(cannotIncreaseHigher);
        }
        return reasons;
    }

    skillIncreasedByThis(skill: Skill, choice: SkillChoice|LoreChoice) {
        let levelNumber = parseInt(choice.id.split("-")[0]);
        return this.get_SkillIncreases(levelNumber, levelNumber, skill.name, choice.source, choice.id).length > 0;
    }

    get_SkillIncreases(minLevelNumber: number, maxLevelNumber: number, skillName: string, source: string = "", sourceId: string = "", locked: boolean = undefined) {
        return this.get_Character().get_SkillIncreases(this.characterService, minLevelNumber, maxLevelNumber, skillName, source, sourceId, locked);
    }

    on_SkillIncrease(skillName: string, boost: boolean, choice: SkillChoice|LoreChoice, locked: boolean = false) {
        if (boost && (choice.increases.length == choice.available + this.get_SkillINTBonus(choice) - 1)) { this.showList=""; }
        this.get_Character().increase_Skill(this.characterService, skillName, boost, choice, locked);
        this.characterService.set_Changed();
    }

    get_TraditionChoices(level: Level) {
        if (level.number > 0) {
            return this.get_Character().class.spellCasting.filter(casting => casting.charLevelAvailable == level.number);
        }
    }

    get_AvailableTraditionAbilities(choice: SpellCasting) {
        let abilities = this.get_Abilities();
        if (choice.abilityFilter.length) {
            abilities = abilities.filter(ability => choice.abilityFilter.includes(ability.name))
        }
        if (abilities.length) {
            return abilities.filter(ability => (
                choice.ability == ability.name || !choice.ability
                )).map(ability => ability.name);
        }
    }

    get_AvailableTraditions(choice: SpellCasting) {
        let traditions = ["Arcane", "Divine", "Occult", "Primal"];
        if (choice.traditionFilter.length) {
            traditions = traditions.filter(tradition => choice.traditionFilter.includes(tradition))
        }
        if (traditions.length) {
            return traditions.filter(tradition => (
                choice.tradition == tradition || !choice.tradition
                ));
        }
    }

    on_TraditionChoice(which: "ability"|"tradition", ability: string, tradition: string, boost: boolean, choice: SpellCasting, locked: boolean = false) {
        //Unset first, before the values change
        if (boost && ability && tradition) {
            this.showList="";
            choice.ability = ability;
            choice.tradition = tradition as ""|"Arcane"|"Divine"|"Occult"|"Primal"|"Bloodline";
            choice.set_SpellDC(this.characterService, boost)
            this.characterService.set_Changed();
        } else {
            choice.set_SpellDC(this.characterService, boost)
            choice[which] = "";
            this.characterService.set_Changed();
        }
    }

    on_LoreChange(boost: boolean, choice: LoreChoice) {
        if (boost) {
            if (choice.increases.length == choice.available - 1) { this.showList=""; }
            this.get_Character().add_Lore(this.characterService, choice);
        } else {
            this.get_Character().remove_Lore(this.characterService, choice);
        }
    }

    get_Feats(name: string = "", type: string = "") {
        return this.featsService.get_Feats(this.get_Character().customFeats, name, type);
    }

    get_FeatsAndFeatures(name: string = "", type: string = "") {
        return this.featsService.get_All(this.get_Character().customFeats, name, type);
    }

    get_Activities(name: string = "") {
        return this.activitiesService.get_Activities(name);
    }

    get_Spells(name: string = "") {
        return this.spellsService.get_Spells(name);
    }

    get_SpellLevel(levelNumber: number) {
        return Math.ceil(levelNumber / 2);
    }

    get_DifferentWorldsFeat(levelNumber) {
        if (this.get_Character().get_FeatsTaken(levelNumber, levelNumber, "Different Worlds").length) {
            return this.get_Character().customFeats.filter(feat => feat.name == "Different Worlds");
        }
    }

    onDifferentWorldsBackgroundChange(level: Level, feat: Feat, background: Background, taken: boolean) {
        let character = this.get_Character();
        feat.data["background"] = "";
        let oldChoices: LoreChoice[] = level.loreChoices.filter(choice => choice.source == "Different Worlds");
        if (oldChoices.length) {
            let oldChoice = oldChoices[oldChoices.length - 1];
            if (oldChoice.increases.length) {
                character.remove_Lore(this.characterService, oldChoice);
            }
            level.loreChoices = level.loreChoices.filter(choice => choice.source != "Different Worlds");
        }
        if (taken) {
            this.showList="";
            feat.data["background"] = background.name;
            background.loreChoices.forEach(choice => {
                let newChoice: LoreChoice = character.add_LoreChoice(level, choice);
                newChoice.source = "Different Worlds";
                if (newChoice.loreName) {
                    if (this.characterService.get_Skills(this.get_Character(), 'Lore: '+newChoice.loreName).length) {
                        let increases = character.get_SkillIncreases(this.characterService, 1, 20, 'Lore: '+newChoice.loreName).filter(increase => 
                            increase.sourceId.includes("-Lore-")
                            );
                        if (increases.length) {
                            let oldChoice = character.get_LoreChoice(increases[0].sourceId);
                            if (oldChoice.available == 1) {
                                character.remove_Lore(this.characterService, oldChoice);
                            }
                        }
                    }
                    character.add_Lore(this.characterService, newChoice);
                }
            })
        }
    }

    get_FuseStanceFeat(levelNumber: number) {
        if (this.get_Character().get_FeatsTaken(levelNumber, levelNumber, "Fuse Stance").length) {
            return this.get_Character().customFeats.filter(feat => feat.name == "Fuse Stance");
        }
    }
    
    get_StancesToFuse(levelNumber: number) {
        let unique: string[] = [];
        let stances: {name:string, reason:string}[] = [];
        this.characterService.get_OwnedActivities(this.get_Character(), levelNumber).filter(activity => !unique.includes(activity.name)).forEach(activity => {
            this.activitiesService.get_Activities(activity.name).filter(example => example.traits.includes("Stance")).forEach(example => {
                //Stances that only allow one type of strike cannot be used for Fuse Stance.
                if (!example.desc.includes("only Strikes")) {
                    unique.push(activity.name);
                    stances.push({name:activity.name, reason:""});
                } else {
                    unique.push(activity.name);
                    stances.push({name:activity.name, reason:"This stance has incompatible restrictions."});
                }
            })
        })
        return stances.filter(stance => stance.name != "Fused Stance");
    }

    onFuseStanceStanceChange(feat:Feat, which:string, stance:string, taken:boolean) {
        if (taken) {
            this.showList="";
            feat.data[which] = stance;
        } else {
            feat.data[which] = "";
        }
        this.set_Changed();
    }

    get_FeatsTaken(minLevelNumber: number, maxLevelNumber: number, featName: string = "", source: string = "", sourceId: string = "", locked: boolean = undefined) {
        return this.get_Character().get_FeatsTaken(minLevelNumber, maxLevelNumber, featName, source, sourceId, locked);
    }

    get_Classes(name: string = "") {
        return this.characterService.get_Classes(name);
    }

    onClassChange($class: Class, taken: boolean) {
        if (taken) {
            this.showList="";
            this.characterService.change_Class($class);
        } else {
            this.characterService.change_Class(new Class());
        }
    }

    get_Ancestries(name: string = "") {
        return this.historyService.get_Ancestries(name);
    }

    onAncestryChange(ancestry: Ancestry, taken: boolean) {
        if (taken) {
            this.showList="";
            this.characterService.change_Ancestry(ancestry, this.itemsService);
        } else {
            this.characterService.change_Ancestry(new Ancestry(), this.itemsService);
        }
    }

    get_Deities(name: string = "") {
        //Champions and Clerics need to choose a deity matching their alignment.
        if (!["Champion", "Cleric"].includes(this.get_Character().class.name)) {
            return this.deitiesService.get_Deities(name);
        } else {
            return this.deitiesService.get_Deities(name).filter((deity: Deity) => !this.get_Character().alignment || deity.followerAlignments.includes(this.get_Character().alignment));
        }
    }

    on_DeityChange(deity: Deity, taken: boolean) {
        if (taken) {
            this.showList="";
            this.characterService.change_Deity(deity);
        } else {
            this.characterService.change_Deity(new Deity());
        }
    }

    get_BloodlineAvailable(levelNumber: number) {
        return this.get_Character().class.spellCasting.filter(casting => casting.tradition == "Bloodline" && casting.charLevelAvailable == levelNumber).length
    }

    get_AvailableBloodlines(levelNumber: number) {
        return this.get_Character().class.spellCasting.filter(casting => casting.tradition == "Bloodline" && casting.charLevelAvailable == levelNumber);
    }

    get_Bloodlines() {
        return this.bloodlinesService.get_Bloodlines();
    }

    get_BloodlineSpellLevel(levelNumber: number) {
        switch (levelNumber) {
            case 0: 
                return "initial";
            case 1:
                return "advanced";
            case 2:
                return "greater";
            default:
                return "";
        }
    }

    on_BloodlineChange(casting: SpellCasting, bloodline: Bloodline, taken: boolean) {
        if (taken) {
            this.showList="";
            this.characterService.change_Bloodline(casting, bloodline);
        } else {
            this.characterService.change_Bloodline(casting, null);
        }
    }

    get_Conditions(name: string = "") {
        return this.conditionsService.get_Conditions(name);
    }

    get_Heritages(name: string = "", ancestryName: string = "") {
        return this.historyService.get_Heritages(name, ancestryName);
    }

    onHeritageChange(heritage: Heritage, taken: boolean) {
        if (taken) {
            this.showList="";
            this.characterService.change_Heritage(heritage);
        } else {
            this.characterService.change_Heritage(new Heritage());
        }
    }

    get_Backgrounds(name: string = "") {
        return this.historyService.get_Backgrounds(name);
    }
    
    onBackgroundChange(background: Background, taken: boolean) {
        if (taken) {
            this.showList="";
            this.characterService.change_Background(background);
        } else {
            this.characterService.change_Background(new Background());
        }
    }

    get_INT(levelNumber: number) {
        let intelligence: number = this.get_Abilities("Intelligence")[0].baseValue(this.get_Character(), this.characterService, levelNumber);
        let INT: number = Math.floor((intelligence-10)/2);
        return INT;
    }

    get_AnimalCompanionAvailable(levelNumber: number) {
        //Return the number of feats taken this level that granted you an animal companion
        return this.get_Character().get_FeatsTaken(levelNumber, levelNumber).filter(gain => this.characterService.get_FeatsAndFeatures(gain.name)[0].gainAnimalCompanion == 1).length
    }

    get_Companion() {
        return this.characterService.get_Character().class.animalCompanion;
    }

    on_NewCompanion(level: Level) {
        if (this.characterService.get_Character().class.animalCompanion) {
            let character = this.characterService.get_Character();
            character.class.animalCompanion = new AnimalCompanion();
            character.class.animalCompanion.class = new AnimalCompanionClass();
            this.characterService.initialize_AnimalCompanion();
            character.class.animalCompanion.level = level.number;
            this.set_Changed();
        }
    }

    get_AvailableCompanionTypes() {
        let existingCompanionName: string = this.get_Companion().class.ancestry.name;
        return this.animalCompanionsService.get_CompanionTypes().filter(type => type.name == existingCompanionName || !existingCompanionName);
    }

    on_TypeChange(type: AnimalCompanionAncestry, taken: boolean) {
        if (taken) {
            this.showList="";
            this.get_Companion().class.on_ChangeAncestry(this.characterService);
            this.animalCompanionsService.change_Type(this.get_Companion(), type);
            this.get_Companion().class.on_NewAncestry(this.characterService, this.itemsService);
            this.set_Changed();
        } else {
            this.get_Companion().class.on_ChangeAncestry(this.characterService);
            this.animalCompanionsService.change_Type(this.get_Companion(), new AnimalCompanionAncestry());
            this.set_Changed();
        }
    }

    on_SpecializationChange(spec: AnimalCompanionSpecialization, taken: boolean, levelNumber: number) {
        if (taken) {
            if (this.get_Companion().class.specializations.filter(spec => spec.level == levelNumber).length == this.get_CompanionSpecializationsAvailable(levelNumber) - 1) {
                this.showList="";
            }
            this.animalCompanionsService.add_Specialization(this.get_Companion(), spec, levelNumber);
            this.set_Changed();
        } else {
            this.animalCompanionsService.remove_Specialization(this.get_Companion(), spec);
            this.set_Changed();
        }
    }

    get_CompanionSpecializationsAvailable(levelNumber: number) {
        //Return the number of feats taken this level that granted you an animal companion specialization
        return this.get_Character().get_FeatsTaken(levelNumber, levelNumber).filter(gain => this.characterService.get_FeatsAndFeatures(gain.name)[0].gainAnimalCompanion == 6).length
    }

    get_AvailableCompanionSpecializations(levelNumber: number) {
        let existingCompanionSpecs: AnimalCompanionSpecialization[] = this.get_Companion().class.specializations;
        let available = this.get_CompanionSpecializationsAvailable(levelNumber);
        //Get all specializations that were either taken on this level (so they can be deselected) or that were not yet taken if the choice is not exhausted.
        return this.animalCompanionsService.get_CompanionSpecializations().filter(type => 
            existingCompanionSpecs.find(spec => spec.name == type.name && spec.level == levelNumber) ||
            (existingCompanionSpecs.filter(spec => spec.level == levelNumber).length < available) && 
            !existingCompanionSpecs.find(spec => spec.name == type.name));
    }

    get_TakenCompanionSpecializations(levelNumber: number) {
        return this.get_Companion().class.specializations.filter(spec => spec.level == levelNumber);
    }

    have_CompanionSpecialization(name: string) {
        return this.get_Companion().class.specializations.filter(spec => spec.name == name).length;
    }

    get_FamiliarAvailable(levelNumber: number) {
        //Return the number of feats taken this level that granted you an animal companion
        return this.get_Character().get_FeatsTaken(levelNumber, levelNumber).filter(gain => this.characterService.get_FeatsAndFeatures(gain.name)[0].gainFamiliar == true).length
    }

    get_Familiar() {
        return this.characterService.get_Character().class.familiar;
    }

    on_NewFamiliar() {
        if (this.get_Character().class.familiar) {
            let character = this.characterService.get_Character();
            //Preserve the origin class and set it again after resetting
            let originClass = character.class.familiar.originClass;
            this.characterService.cleanup_Familiar();
            character.class.familiar = new Familiar();
            character.class.familiar.originClass = originClass;
            this.characterService.initialize_Familiar();
            this.set_Changed();
        }
    }

    on_FamiliarSpeedChange(taken: boolean) {
        if (taken) {
            this.get_Familiar().speeds[1].name = "Swim Speed";
        } else {
            this.get_Familiar().speeds[1].name = "Land Speed";
        }
        this.set_Changed("Familiar");
    }

    is_FamiliarSwimmer() {
        return this.get_Familiar().speeds[1].name == "Swim Speed"
    }

    get_ItemFromGain(gain: ItemGain) {
        return this.characterService.get_Items()[gain.type].filter(item => item.name == gain.name);
    }

    get_AnimalCompanionAbilities(type: AnimalCompanionAncestry) {
        let abilities: [{name:string, modifier:string}] = [{name:"", modifier:""}];
        this.characterService.get_Abilities().forEach(ability => {
            let name = ability.name.substr(0,3);
            let modifier = 0;
            let classboosts = this.get_Companion().class.levels[1].abilityChoices[0].boosts.filter(boost => boost.name == ability.name)
            let ancestryboosts = type.abilityChoices[0].boosts.filter(boost => boost.name == ability.name);
            modifier = ancestryboosts.concat(classboosts).filter(boost => boost.type == "Boost").length - ancestryboosts.concat(classboosts).filter(boost => boost.type == "Flaw").length;
            abilities.push({name:name, modifier:(modifier > 0 ? "+" : "")+modifier.toString()})
        })
        abilities.shift();
        return abilities;
    }

    still_loading() {
        return this.characterService.still_loading();
    }

    finish_Loading() {
        if (this.still_loading()) {
            setTimeout(() => this.finish_Loading(), 500)
        } else {
            this.characterService.get_Changed()
            .subscribe((target) => {
                if (target == "character" || target == "all") {
                    this.changeDetector.detectChanges();
                }
            });
            return true;
        }
    }

    ngOnInit() {
        this.finish_Loading();
    }

}
