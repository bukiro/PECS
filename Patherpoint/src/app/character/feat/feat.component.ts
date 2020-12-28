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
    @Input()
    featLevel: number

    constructor(
        public characterService: CharacterService,
        private spellsService: SpellsService,
        private activitiesService: ActivitiesService
    ) { }

    trackByIndex(index: number, obj: any): any {
        return index;
    }

    create_IgnoreRequirementList(feat: Feat, choice: FeatChoice) {
        //Prepare character and characterService for eval.
        let character = this.characterService.get_Character();
        let characterService = this.characterService;
        //Build the ignoreRequirements list from both the feat and the choice.
        let ignoreRequirementsList: string[] = [];
        feat.ignoreRequirements.concat((choice?.ignoreRequirements || [])).forEach(ignoreReq => {
            try {
                ignoreRequirementsList.push(eval(ignoreReq));
            } catch (error) {
                console.log("Failed evaluating feat requirement ignore list item (" + ignoreReq + "): " + error)
            }
        })
        return ignoreRequirementsList;
    }

    get_FeatRequirements(choice: FeatChoice, feat: Feat) {
        let ignoreRequirementsList: string[] = this.create_IgnoreRequirementList(feat, choice);
        let result: Array<{met?:boolean, ignored?:boolean, desc?:string}> = [];
        if (feat.levelreq) {
            result.push(feat.meetsLevelReq(this.characterService, this.featLevel));
            result[result.length-1].ignored = ignoreRequirementsList.includes('levelreq');
        }
        if (feat.abilityreq.length) {
            feat.meetsAbilityReq(this.characterService, this.levelNumber).forEach(req => {
                result.push({ met: true, desc: ", " });
                result.push(req);
                result[result.length-1].ignored = ignoreRequirementsList.includes('abilityreq');
            });
        }
        if (feat.skillreq.length) {
            feat.meetsSkillReq(this.characterService, this.levelNumber).forEach((req, index) => {
                if (index == 0) {
                    result.push({ met: true, desc: ", " });
                } else {
                    result.push({ met: true, desc: " or " });
                }
                result.push(req);
                result[result.length-1].ignored = ignoreRequirementsList.includes('skillreq');
            });
        }
        if (feat.featreq.length) {
            feat.meetsFeatReq(this.characterService, this.levelNumber).forEach(req => {
                result.push({ met: true, desc: ", " });
                result.push(req);
                result[result.length-1].ignored = ignoreRequirementsList.includes('featreq');
            });
        }
        if (feat.heritagereq) {
            feat.meetsHeritageReq(this.characterService, this.levelNumber).forEach(req => {
                result.push({ met: true, desc: ", " });
                result.push(req);
                result[result.length-1].ignored = ignoreRequirementsList.includes('heritagereq');
            });
        }
        if (feat.specialreqdesc) {
            result.push({ met: true, desc: ", " });
            result.push(feat.meetsSpecialReq(this.characterService, this.levelNumber));
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
