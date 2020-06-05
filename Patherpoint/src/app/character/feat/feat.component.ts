import { Component, OnInit, Input } from '@angular/core';
import { Feat } from 'src/app/Feat';
import { CharacterService } from 'src/app/character.service';
import { FeatChoice } from 'src/app/FeatChoice';
import { SpellsService } from 'src/app/spells.service';
import { ActivitiesService } from 'src/app/activities.service';

@Component({
    selector: 'app-feat',
    templateUrl: './feat.component.html',
    styleUrls: ['./feat.component.css']
})
export class FeatComponent implements OnInit {

    @Input()
    feat: Feat
    @Input()
    choice: FeatChoice
    @Input()
    levelNumber: number

    constructor(
        public characterService: CharacterService,
        private spellsService: SpellsService,
        private activitiesService: ActivitiesService
    ) { }

    trackByIndex(index: number, obj: any): any {
        return index;
    }
    
    get_FeatRequirements(choice: FeatChoice, feat: Feat, compare: Feat = undefined) {
        let levelNumber = parseInt(choice?.id?.split("-")[0]) || this.levelNumber;
        let featLevel = 0;
        if (choice?.level) {
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
    
    get_Activities(name: string = "") {
        return this.activitiesService.get_Activities(name);
    }

    get_Spells(name: string = "") {
        return this.spellsService.get_Spells(name);
    }

    get_SpellLevel(levelNumber: number) {
        return Math.ceil(levelNumber / 2);
    }

    ngOnInit() {
    }

}
