import { Component, Input } from '@angular/core';
import { Feat } from 'src/app/classes/Feat';
import { CharacterService } from 'src/app/services/character.service';
import { FeatChoice } from 'src/app/classes/FeatChoice';
import { SpellsService } from 'src/app/services/spells.service';
import { ActivitiesService } from 'src/app/services/activities.service';
import { TraitsService } from 'src/app/services/traits.service';
import { FeatRequirementsService } from 'src/app/character-creation/services/feat-requirement/featRequirements.service';

@Component({
    selector: 'app-feat',
    templateUrl: './feat.component.html',
    styleUrls: ['./feat.component.css']
})
export class FeatComponent {

    @Input()
    feat: Feat;
    @Input()
    choice: FeatChoice;
    @Input()
    levelNumber: number;
    @Input()
    featLevel: number;

    constructor(
        public characterService: CharacterService,
        private spellsService: SpellsService,
        private activitiesService: ActivitiesService,
        private traitsService: TraitsService,
        private featRequirementsService: FeatRequirementsService
    ) { }

    trackByIndex(index: number): number {
        return index;
    }

    get_Traits(traitName = '') {
        return this.traitsService.get_Traits(traitName);
    }

    create_IgnoreRequirementList(feat: Feat, choice: FeatChoice) {
        //Prepare character and characterService for eval.
        /* eslint-disable @typescript-eslint/no-unused-vars */
        const character = this.characterService.get_Character();
        const characterService = this.characterService;
        /* eslint-enable @typescript-eslint/no-unused-vars */
        //Build the ignoreRequirements list from both the feat and the choice.
        const ignoreRequirementsList: string[] = [];
        feat.ignoreRequirements.concat((choice?.ignoreRequirements || [])).forEach(ignoreReq => {
            try {
                ignoreRequirementsList.push(eval(ignoreReq));
            } catch (error) {
                console.log(`Failed evaluating feat requirement ignore list item (${ ignoreReq }): ${ error }`);
            }
        });
        return ignoreRequirementsList;
    }

    get_FeatRequirements(choice: FeatChoice, feat: Feat) {
        const ignoreRequirementsList: string[] = this.create_IgnoreRequirementList(feat, choice);
        const result: Array<{ met?: boolean, ignored?: boolean, desc?: string }> = [];
        if (feat.levelreq) {
            result.push(this.featRequirementsService.meetsLevelReq(feat, this.featLevel));
            result[result.length - 1].ignored = ignoreRequirementsList.includes('levelreq');
        }
        if (feat.abilityreq.length) {
            this.featRequirementsService.meetsAbilityReq(feat, this.levelNumber).forEach(req => {
                result.push({ met: true, desc: ', ' });
                result.push(req);
                result[result.length - 1].ignored = ignoreRequirementsList.includes('abilityreq');
            });
        }
        if (feat.skillreq.length) {
            this.featRequirementsService.meetsSkillReq(feat, this.levelNumber).forEach((req, index) => {
                if (index == 0) {
                    result.push({ met: true, desc: ', ' });
                } else {
                    result.push({ met: true, desc: ' or ' });
                }
                result.push(req);
                result[result.length - 1].ignored = ignoreRequirementsList.includes('skillreq');
            });
        }
        if (feat.featreq.length) {
            this.featRequirementsService.meetsFeatReq(feat, this.levelNumber).forEach(req => {
                result.push({ met: true, desc: ', ' });
                result.push(req);
                result[result.length - 1].ignored = ignoreRequirementsList.includes('featreq');
            });
        }
        if (feat.heritagereq) {
            this.featRequirementsService.meetsHeritageReq(feat, this.levelNumber).forEach(req => {
                result.push({ met: true, desc: ', ' });
                result.push(req);
                result[result.length - 1].ignored = ignoreRequirementsList.includes('heritagereq');
            });
        }
        if (feat.specialreqdesc) {
            result.push({ met: true, desc: ', ' });
            result.push(this.featRequirementsService.meetsSpecialReq(feat, this.levelNumber));
        }
        if (feat.complexreqdesc) {
            result.push({ met: true, desc: ', ' });
            result.push(this.featRequirementsService.meetsComplexReq(feat, this.levelNumber));
        }
        if (result.length > 1) {
            if (result[0].desc == ', ') {
                result.shift();
            }
            if (result[0].desc == 'requires ' && result[1].desc == ', ') {
                result.splice(1, 1);
            }
        } else if (result.length == 1 && result[0].desc == 'requires ') {
            result.length = 0;
        }
        return result;
    }

    get_Activities(name = '') {
        return this.activitiesService.get_Activities(name);
    }

    get_Spells(name = '') {
        return this.spellsService.get_Spells(name);
    }

    get_SpellLevel(levelNumber: number) {
        return Math.ceil(levelNumber / 2);
    }

}
