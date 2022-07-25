import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Feat } from 'src/app/character-creation/definitions/models/Feat';
import { FeatChoice } from 'src/app/character-creation/definitions/models/FeatChoice';
import { SpellsService } from 'src/app/services/spells.service';
import { ActivitiesDataService } from 'src/app/core/services/data/activities-data.service';
import { TraitsService } from 'src/app/services/traits.service';
import { FeatRequirementsService } from 'src/app/character-creation/services/feat-requirement/featRequirements.service';
import { Trackers } from 'src/libs/shared/util/trackers';
import { Trait } from 'src/app/classes/Trait';
import { FeatRequirements } from 'src/app/character-creation/definitions/models/featRequirements';
import { SpellLevelFromCharLevel } from 'src/libs/shared/util/characterUtils';
import { Activity } from 'src/app/classes/Activity';
import { Spell } from 'src/app/classes/Spell';

@Component({
    selector: 'app-feat',
    templateUrl: './feat.component.html',
    styleUrls: ['./feat.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatComponent {

    @Input()
    public feat: Feat;
    @Input()
    public choice: FeatChoice;
    @Input()
    public levelNumber: number;
    @Input()
    public featLevel: number;
    public spellLevelFromCharLevel = SpellLevelFromCharLevel;

    constructor(
        private readonly _spellsService: SpellsService,
        private readonly _activitiesDataService: ActivitiesDataService,
        private readonly _traitsService: TraitsService,
        private readonly _featRequirementsService: FeatRequirementsService,
        public trackers: Trackers,
    ) { }

    public featRequirements(choice: FeatChoice, feat: Feat): Array<FeatRequirements.FeatRequirementResult> {
        const ignoreRequirementsList: Array<string> =
            this._featRequirementsService.createIgnoreRequirementList(feat, this.levelNumber, choice);
        const result: Array<FeatRequirements.FeatRequirementResult> = [];

        if (feat.levelreq) {
            result.push(this._featRequirementsService.meetsLevelReq(feat, this.featLevel));
            result[result.length - 1].ignored = ignoreRequirementsList.includes('levelreq');
        }

        if (feat.abilityreq.length) {
            this._featRequirementsService.meetsAbilityReq(feat, this.levelNumber).forEach(req => {
                result.push({ met: true, desc: ', ' });
                result.push(req);
                result[result.length - 1].ignored = ignoreRequirementsList.includes('abilityreq');
            });
        }

        if (feat.skillreq.length) {
            this._featRequirementsService.meetsSkillReq(feat, this.levelNumber).forEach((req, index) => {
                if (index === 0) {
                    result.push({ met: true, desc: ', ' });
                } else {
                    result.push({ met: true, desc: ' or ' });
                }

                result.push(req);
                result[result.length - 1].ignored = ignoreRequirementsList.includes('skillreq');
            });
        }

        if (feat.featreq.length) {
            this._featRequirementsService.meetsFeatReq(feat, this.levelNumber).forEach(req => {
                result.push({ met: true, desc: ', ' });
                result.push(req);
                result[result.length - 1].ignored = ignoreRequirementsList.includes('featreq');
            });
        }

        if (feat.heritagereq) {
            this._featRequirementsService.meetsHeritageReq(feat, this.levelNumber).forEach(req => {
                result.push({ met: true, desc: ', ' });
                result.push(req);
                result[result.length - 1].ignored = ignoreRequirementsList.includes('heritagereq');
            });
        }

        if (feat.complexreqdesc) {
            result.push({ met: true, desc: ', ' });
            result.push(this._featRequirementsService.meetsComplexReq(
                feat.complexreq,
                { feat, desc: feat.complexreqdesc },
                { charLevel: this.levelNumber },
            ));
        }

        if (result.length > 1 && result[0].desc === ', ') {
            result.shift();
        }

        return result;
    }

    public activityFromName(name: string): Activity {
        return this._activitiesDataService.activityFromName(name);
    }

    public spellFromName(name: string): Spell {
        return this._spellsService.spellFromName(name);
    }

    public traitFromName(traitName: string): Trait {
        return this._traitsService.traitFromName(traitName);
    }

}
