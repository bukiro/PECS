import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { CharacterService } from 'src/app/character.service';
import { FeatsService } from 'src/app/feats.service';
import { Feat } from 'src/app/Feat';
import { FeatChoice } from 'src/app/FeatChoice';
import { SortByPipe } from 'src/app/sortBy.pipe';
import { ActivitiesService } from 'src/app/activities.service';
import { SpellsService } from 'src/app/spells.service';
import { FamiliarsService } from 'src/app/familiars.service';
import { Familiar } from 'src/app/Familiar';
import { Character } from 'src/app/Character';

@Component({
    selector: 'app-featchoice',
    templateUrl: './featchoice.component.html',
    styleUrls: ['./featchoice.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FeatchoiceComponent implements OnInit {

    @Input()
    choice: FeatChoice
    @Input()
    showChoice: string = "";
    @Input()
    showFeat: string = "";
    @Output()
    showChoiceMessage = new EventEmitter<string>();
    @Output()
    showFeatMessage = new EventEmitter<string>();
    @Input()
    levelNumber: number;
    @Input()
    creature: string = "Character"

    constructor(
        private changeDetector: ChangeDetectorRef,
        private characterService: CharacterService,
        private featsService: FeatsService,
        private activitiesService: ActivitiesService,
        private spellsService: SpellsService,
        private familiarsService: FamiliarsService,
        private sortByPipe: SortByPipe
    ) { }

    toggle_Item(name: string) {
        if (this.showFeat == name) {
            this.showFeat = "";
        } else {
            this.showFeat = name;
        }
        this.showFeatMessage.emit(this.showFeat)
    }

    toggle_List(name: string) {
        if (this.showChoice == name) {
            this.showChoice = "";
        } else {
            this.showChoice = name;
        }
        this.showChoiceMessage.emit(this.showChoice)
    }

    get_showFeat() {
        return this.showFeat;
    }

    get_showChoice() {
        return this.showChoice;
    }

    trackByIndex(index: number, obj: any): any {
        return index;
    }
    
    get_Character() {
        return this.characterService.get_Character();
    }

    get_Creature() {
        return this.characterService.get_Creature(this.creature) as Character|Familiar;
    }

    get_Feats(name: string = "", type: string = "") {
        if (this.creature == "Character") {
            return this.featsService.get_Feats(this.get_Character().customFeats, name, type);
        } else if (this.creature == "Familiar") {
            return this.familiarsService.get_FamiliarAbilities(name);
        }
        
    }

    get_FeatsAndFeatures(name: string = "", type: string = "") {
        if (this.creature == "Character") {
            return this.featsService.get_All(this.get_Character().customFeats, name, type);
        } else if (this.creature == "Familiar") {
            return this.familiarsService.get_FamiliarAbilities(name);
        }
        
    }

    get_SubFeats(feat: Feat, choice: FeatChoice, get_unavailable: boolean = false) {
        if (feat.subTypes) {
            let feats: Feat[] = this.get_Feats().filter((subFeat: Feat) => subFeat.superType == feat.name && !subFeat.hide);
            if (choice.filter.length) {
                feats = feats.filter(subFeat => choice.filter.includes(subFeat.name) || choice.filter.includes(subFeat.superType))
            }
            if (get_unavailable && choice.feats.length < choice.available) {
                let unavailableSubfeats = feats.filter(feat => 
                    this.cannotTake(feat, choice).length > 0
                )
                return this.sortByPipe.transform(unavailableSubfeats, "asc", "name");
            } else if (!get_unavailable &&choice.feats.length < choice.available) {
                let availableSubfeats = feats.filter(feat => 
                    this.cannotTake(feat, choice).length == 0 || this.featTakenByThis(feat, choice)
                )
                return this.sortByPipe.transform(availableSubfeats, "asc", "name");
            } else if (!get_unavailable) {
                let availableSubfeats = feats.filter(feat => 
                    this.featTakenByThis(feat, choice)
                )
                return this.sortByPipe.transform(availableSubfeats, "asc", "name");
            }
        } else {
            return [];
        }
    }

    get_AvailableFeats(choice: FeatChoice, get_unavailable: boolean = false) {
        let character = this.get_Character()
        //Get all Feats, but no subtype Feats (those that have the supertype attribute set) - those get built within their supertype
        // If a subtype is in the filter
        let allFeats = this.get_Feats().filter(feat => !feat.superType && !feat.hide);
        if (choice.filter.length) {
            allFeats = allFeats.filter(feat => choice.filter.includes(feat.name) || 
                (feat.subTypes && this.get_Feats().filter(subFeat => !subFeat.hide && subFeat.superType == feat.name && choice.filter.includes(subFeat.name)).length))
        }
        let feats: Feat[] = [];
        if (choice.specialChoice) {
            //For special choices, we don't really use true feats, but make choices that can best be represented by the extensive feat structure.
            //In this case, we don't go looking for feats with a certain trait, but rely completely on the filter.
            feats.push(...allFeats);
        } else {
            switch (choice.type) {
                case "Class":
                    feats.push(...allFeats.filter(feat => feat.traits.includes(character.class.name) || feat.traits.includes("Archetype")));
                    break;
                case "Ancestry":
                    character.class.ancestry.ancestries.forEach(trait => {
                        feats.push(...allFeats.filter(feat => feat.traits.includes(trait)));
                    })
                    break;
                case "Familiar":
                    feats.push(...allFeats.filter(feat => feat.traits.includes("Familiar Ability") || feat.traits.includes("Master Ability")));
                default:
                    let traits: string[] = choice.type.split(",")
                    feats.push(...allFeats.filter((feat: Feat) => traits.filter(trait => feat.traits.includes(trait)).length == traits.length));
                    break;
            }
        }
        if (feats.length) {
            if (get_unavailable && choice.feats.length < choice.available) {
                let unavailableFeats: Feat[] = feats.filter(feat => 
                    (this.cannotTake(feat, choice).length > 0)
                )
                return this.sortByPipe.transform(unavailableFeats, "asc", "name")
            } else if (!get_unavailable && choice.feats.length < choice.available) {
                let availableFeats: Feat[] = feats.filter(feat => 
                    this.cannotTake(feat, choice).length == 0 || this.featTakenByThis(feat, choice) || this.subFeatTakenByThis(feat, choice)
                )
                return this.sortByPipe.transform(availableFeats, "asc", "name")
            } else if (!get_unavailable) {
                let availableFeats: Feat[] = feats.filter(feat => 
                    this.featTakenByThis(feat, choice) || this.subFeatTakenByThis(feat, choice)
                )
                return this.sortByPipe.transform(availableFeats, "asc", "name")
            }
        }
    }

    
    cannotTakeSome(choice: FeatChoice) {
        let anytrue = 0;
        choice.feats.forEach(feat => {
            let template: Feat = this.get_Feats(feat.name)[0];
            if (template?.name) {
                if (this.cannotTake(template, choice).length) {
                    if (!feat.locked) {
                        this.get_Character().take_Feat(this.get_Creature(), this.characterService, feat.name, false, choice, feat.locked);
                    } else {
                        anytrue += 1;
                    }
                }
            }
        });
        this.characterService.process_ToChange();
        return anytrue;
    }

    cannotTake(feat: Feat, choice: FeatChoice) {
        //Don't run the test on a blank feat - does not go well
        if (feat?.name) {
            let levelNumber = parseInt(choice.id.split("-")[0]);
            let featLevel = 0;
            if (choice.level) {
                featLevel = choice.level;
            } else {
                featLevel = levelNumber;
            }
            //Use character level for Familiar Abilities
            if (choice.source == "Familiar") {
                featLevel = this.get_Character().level;
            }
            let reasons: string[] = [];
            let traits: string[] = [];
            switch (choice.type) {
                case "Class":
                    traits.push(this.get_Character().class?.name, "Archetype");
                    break;
                case "Ancestry":
                    traits.push(...this.get_Character().class?.ancestry?.ancestries);
                    break;
                case "Familiar":
                    traits.push("Familiar Ability", "Master Ability");
                    break;
                default:
                    traits.push(...choice.type.split(","));
                    break;
            }
            //Does the type not match a trait? (Unless it's a special choice, where the type doesn't matter and is just the title.)
            if (!choice.specialChoice && !feat.traits.find(trait => traits.includes(trait))) {
                reasons.push("The feat's traits do not match the choice type.")
            }
            //Are the basic requirements (level, ability, feat etc) not met?
            if (!feat.canChoose(this.characterService, featLevel)) {
                reasons.push("The requirements are not met.")
            }
            //Unless the feat can be taken repeatedly:
            if (!feat.unlimited) {
                //Has it already been taken up to this level, and was that not by this FeatChoice?
                if (feat.have(this.get_Character(), this.characterService, levelNumber) && !this.featTakenByThis(feat, choice)) {
                    reasons.push("This feat cannot be taken more than once.");
                }
                //Has it generally been taken more than once, and this is one time?
                if (feat.have(this.get_Character(), this.characterService, levelNumber) > 1 && this.featTakenByThis(feat, choice)) {
                    reasons.push("This feat cannot be taken more than once!");
                }
                //Has it been taken on a higher level (that is, not up to now, but up to Level 20)?
                if (!feat.have(this.get_Character(), this.characterService, levelNumber) && feat.have(this.get_Character(), this.characterService, 20)) {
                    reasons.push("This feat has been taken on a higher level.");
                }
            }
            //Dedication feats
            if (feat.traits.includes("Dedication")) {
                //Get all taken dedication feats that aren't this, then check if you have taken 
                this.get_Character().get_FeatsTaken(1, levelNumber).map(gain => this.get_FeatsAndFeatures(gain.name)[0])
                    .filter(libraryfeat => libraryfeat?.name != feat.name && libraryfeat?.traits.includes("Dedication")).forEach(takenfeat => {
                    let archetypeFeats = this.get_Character().get_FeatsTaken(1, levelNumber).map(gain => this.get_FeatsAndFeatures(gain.name)[0])
                        .filter(libraryfeat => libraryfeat?.name != takenfeat.name && libraryfeat?.traits.includes("Archetype") && libraryfeat.archetype == takenfeat.archetype)
                    if (archetypeFeats.length < 2) {
                        reasons.push("You cannot select another dedication feat until you have gained two other feats from the "+takenfeat.archetype+" archetype.");
                    }
                });
            }
            //If this feat has any subtypes, check if any of them can be taken. If not, this cannot be taken either.
            if (feat.subTypes) {
                let subfeats = this.get_Feats().filter(subfeat => subfeat.superType == feat.name && !subfeat.hide);
                let availableSubfeats = subfeats.filter(feat => 
                    this.cannotTake(feat, choice).length == 0 || this.featTakenByThis(feat, choice)
                );
                if (availableSubfeats.length == 0) {
                    reasons.push("No option has its requirements met.")
                }
            }
            return reasons;
        }
    }

    featTakenByThis(feat: Feat, choice: FeatChoice) {
        return choice.feats.filter(gain => gain.name == feat.name).length > 0;
    }

    subFeatTakenByThis(feat: Feat, choice: FeatChoice) {
        return choice.feats.filter(gain => this.get_Feats(gain.name)[0]?.superType == feat.name).length > 0;
    }

    get_FeatsTaken(minLevelNumber: number, maxLevelNumber: number, featName: string = "", source: string = "", sourceId: string = "", locked: boolean = undefined) {
        return this.get_Character().get_FeatsTaken(minLevelNumber, maxLevelNumber, featName, source, sourceId, locked);
    }

    get_FeatRequirements(choice: FeatChoice, feat: Feat, compare: Feat = undefined) {
        let levelNumber = parseInt(choice.id.split("-")[0]);
        let featLevel = 0;
        if (choice.level) {
            featLevel = choice.level;
        } else {
            featLevel = levelNumber;
        }
        let result: Array<{met?:boolean, desc?:string}> = [];
        //For subtypes, the supertype feat to compare is given. Only those requirements that differ from the supertype will be returned.
        if (compare) {
            if (feat.levelreq != compare.levelreq ||
                JSON.stringify(feat.abilityreq) != JSON.stringify(compare.abilityreq) ||
                JSON.stringify(feat.skillreq) != JSON.stringify(compare.skillreq) ||
                feat.featreq != compare.featreq ||
                feat.specialreqdesc != compare.specialreqdesc
                ) {
                result.push({met:true, desc:"requires "});
                if (feat.levelreq && feat.levelreq != compare.levelreq) {
                    result.push(feat.meetsLevelReq(this.characterService, featLevel));
                }
                if (JSON.stringify(feat.abilityreq) != JSON.stringify(compare.abilityreq)) {
                    feat.meetsAbilityReq(this.characterService, featLevel).forEach(req => {
                        result.push({met:true, desc:", "});
                        result.push(req);
                    })
                }
                if (JSON.stringify(feat.skillreq) != JSON.stringify(compare.skillreq)) {
                    feat.meetsSkillReq(this.characterService, featLevel).forEach(req => {
                        result.push({met:true, desc:", "});
                        result.push(req);
                    })
                }
                if (JSON.stringify(feat.featreq) != JSON.stringify(compare.featreq)) {
                    feat.meetsFeatReq(this.characterService, featLevel).forEach(req => {
                        result.push({met:true, desc:", "});
                        result.push(req);
                    })
                }
                if (feat.specialreqdesc && feat.specialreqdesc != compare.specialreqdesc) {
                    result.push({met:true, desc:", "});                    
                    result.push(feat.meetsSpecialReq(this.characterService, featLevel));
                }
            }
        } else {
            if (feat.levelreq) {
                result.push(feat.meetsLevelReq(this.characterService, featLevel));
            }
            if (feat.abilityreq.length) {
                feat.meetsAbilityReq(this.characterService, featLevel).forEach(req => {
                    result.push({met:true, desc:", "});
                    result.push(req);
                })
            }
            if (feat.skillreq.length) {
                feat.meetsSkillReq(this.characterService, featLevel).forEach(req => {
                    result.push({met:true, desc:", "});
                    result.push(req);
                })
            }
            if (feat.featreq.length) {
                feat.meetsFeatReq(this.characterService, featLevel).forEach(req => {
                    result.push({met:true, desc:", "});
                    result.push(req);
                })
            }
            if (feat.specialreqdesc) {
                result.push({met:true, desc:", "});
                result.push(feat.meetsSpecialReq(this.characterService, featLevel));
            }
        }
        if (result.length > 1) {
            if (result[0].desc == ", ") {
                result.shift();
            }
            if (result[0].desc == "requires " && result[1].desc == ", ") {
                result.splice(1,1);
            }
        } else if (result.length == 1 && result[0].desc == "requires ") {
            result.length = 0;
        }
        return result;
    }

    on_FeatTaken(featName: string, taken: boolean, choice: FeatChoice, locked: boolean) {
        if (taken && (choice.feats.length == choice.available - 1)) { this.showChoice=""; }
        this.get_Character().take_Feat(this.get_Creature(), this.characterService, featName, taken, choice, locked);
        this.characterService.process_ToChange();
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

    still_loading() {
        return this.characterService.still_loading();
    }

    finish_Loading() {
        if (this.still_loading()) {
            setTimeout(() => this.finish_Loading(), 500)
        } else {
            this.characterService.get_Changed()
            .subscribe((target) => {
                if (target == "featchoices" || target == "all" || target == this.creature) {
                    this.changeDetector.detectChanges();
                }
            });
            this.characterService.get_ViewChanged()
            .subscribe((view) => {
                if (view.creature == this.creature && ["featchoices", "all"].includes(view.target)) {
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
