import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Feat } from 'src/libs/shared/definitions/models/Feat';
import { FeatChoice } from 'src/libs/shared/definitions/models/FeatChoice';
import { ActivitiesDataService } from 'src/libs/shared/services/data/activities-data.service';
import { TraitsDataService } from 'src/libs/shared/services/data/traits-data.service';
import { Trait } from 'src/app/classes/Trait';
import { SpellLevelFromCharLevel } from 'src/libs/shared/util/characterUtils';
import { Activity } from 'src/app/classes/Activity';
import { Spell } from 'src/app/classes/Spell';
import { SpellsDataService } from 'src/libs/shared/services/data/spells-data.service';
import { SpellChoice } from 'src/app/classes/SpellChoice';
import { FeatRequirementsService } from 'src/libs/character-creation/services/feat-requirement/featRequirements.service';
import { FeatRequirements } from 'src/libs/shared/definitions/models/featRequirements';
import { BaseClass } from 'src/libs/shared/util/mixins/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/trackers-mixin';

@Component({
    selector: 'app-feat',
    templateUrl: './feat.component.html',
    styleUrls: ['./feat.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatComponent extends TrackByMixin(BaseClass) {

    @Input()
    public feat!: Feat;
    @Input()
    public choice?: FeatChoice;
    @Input()
    public levelNumber!: number;
    @Input()
    public featLevel?: number;
    public spellLevelFromCharLevel = SpellLevelFromCharLevel;

    constructor(
        private readonly _spellsDataService: SpellsDataService,
        private readonly _activitiesDataService: ActivitiesDataService,
        private readonly _traitsDataService: TraitsDataService,
        private readonly _featRequirementsService: FeatRequirementsService,
    ) {
        super();
    }

    public featRequirements(choice: FeatChoice | undefined, feat: Feat): Array<FeatRequirements.FeatRequirementResult> {
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
        return this._spellsDataService.spellFromName(name);
    }

    public traitFromName(traitName: string): Trait {
        return this._traitsDataService.traitFromName(traitName);
    }

    public spellLevelFromSpell(spell: Spell, choice?: SpellChoice): number {
        if (!choice) {
            return spell.levelreq;
        } else if (!choice.level || choice.level < 1) {
            return Math.max(this.spellLevelFromCharLevel(this.levelNumber), spell.levelreq);
        } else {
            return Math.max(choice.level, spell.levelreq);
        }
    }

}
