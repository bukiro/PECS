/* eslint-disable complexity */
import { Component, ChangeDetectionStrategy, Input } from '@angular/core';
import { Observable, of, map } from 'rxjs';
import { Activity } from 'src/app/classes/activities/activity';
import { Condition } from 'src/app/classes/conditions/condition';
import { ConditionGainSet } from 'src/app/classes/conditions/condition-gain-set';
import { Character } from 'src/app/classes/creatures/character/character';
import { Creature } from 'src/app/classes/creatures/creature';
import { Hint } from 'src/app/classes/hints/hint';
import { Trait } from 'src/app/classes/hints/trait';
import { ArmorRune } from 'src/app/classes/items/armor-rune';
import { Equipment } from 'src/app/classes/items/equipment';
import { Item } from 'src/app/classes/items/item';
import { Material } from 'src/app/classes/items/material';
import { Oil } from 'src/app/classes/items/oil';
import { Shield } from 'src/app/classes/items/shield';
import { WeaponRune } from 'src/app/classes/items/weapon-rune';
import { WornItem } from 'src/app/classes/items/worn-item';
import { EmblazonArmamentTypes } from 'src/libs/shared/definitions/emblazon-armament-types';
import { EmblazonArmamentSet } from 'src/libs/shared/definitions/interfaces/emblazon-armament-set';
import { Feat } from 'src/libs/shared/definitions/models/feat';
import { ActivityPropertiesService } from 'src/libs/shared/services/activity-properties/activity-properties.service';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { FeatsDataService } from 'src/libs/shared/services/data/feats-data.service';
import { TraitsDataService } from 'src/libs/shared/services/data/traits-data.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { BaseClass } from 'src/libs/shared/util/classes/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { NgbPopover, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { HintItemComponent } from '../hint-item/hint-item.component';
import { ActivityContentComponent } from '../../../activity-content/components/activity-content/activity-content.component';
import { TraitComponent } from 'src/libs/shared/ui/trait/components/trait/trait.component';
import { HintConditionComponent } from '../hint-condition/hint-condition.component';
import { FeatComponent } from '../../../feat/components/feat/feat.component';
import { FormsModule } from '@angular/forms';
import { DescriptionComponent } from 'src/libs/shared/ui/description/components/description/description.component';
import { CommonModule } from '@angular/common';

type HintObject =
    Feat
    | Activity
    | ConditionGainSet
    | Equipment
    | Oil
    | WornItem
    | ArmorRune
    | WeaponRune
    | Material
    | { desc?: string; hints: Array<Hint> };

@Component({
    selector: 'app-hint',
    templateUrl: './hint.component.html',
    styleUrls: ['./hint.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,

        NgbPopover,
        NgbTooltip,

        DescriptionComponent,
        FeatComponent,
        HintConditionComponent,
        TraitComponent,
        ActivityContentComponent,
        HintItemComponent,
    ],
})
export class HintComponent extends TrackByMixin(BaseClass) {

    @Input()
    public creature: Creature = CreatureService.character;
    @Input()
    public object?: HintObject;
    @Input()
    public objectName = '';
    @Input()
    public sourceBook = '';
    @Input()
    public description = '';
    @Input()
    public noFilter = false;
    @Input()
    public color = '';

    constructor(
        private readonly _refreshService: RefreshService,
        private readonly _traitsDataService: TraitsDataService,
        private readonly _activityPropertiesService: ActivityPropertiesService,
        private readonly _featsDataService: FeatsDataService,
    ) {
        super();
    }

    public get character(): Character {
        return CreatureService.character;
    }

    public hints$(): Observable<Array<Hint>> {
        if (this.noFilter) {
            return of(this.object instanceof ConditionGainSet ? this.object.condition.hints : (this.object?.hints || []));
        }

        const isSlottedAeonStone = this.object instanceof WornItem && this.object.isSlottedAeonStone;

        return (
            (this.object instanceof Shield)
                ? this.object.effectiveEmblazonArmament$
                : of<EmblazonArmamentSet | undefined>(undefined)
        )
            .pipe(
                map(emblazonArmament =>
                    (this.object instanceof ConditionGainSet ? this.object.condition.hints : (this.object?.hints || []))
                        .filter((hint: Hint) =>
                            (hint.minLevel ? this.character.level >= hint.minLevel : true) &&
                            (
                                this.object instanceof ConditionGainSet ?
                                    (
                                        (
                                            hint.conditionChoiceFilter.length ?
                                                (!this.object.gain.choice && hint.conditionChoiceFilter.includes('-')) ||
                                                (hint.conditionChoiceFilter.includes(this.object.gain.choice)) :
                                                true
                                        )
                                    ) :
                                    true
                            ) &&
                            (hint.resonant ? isSlottedAeonStone : true),
                        )
                        .filter((hint: Hint) =>
                            hint.showon.split(',')
                                .some(showon =>
                                    showon.trim().toLowerCase() === this.objectName.toLowerCase() ||
                                    showon.trim().toLowerCase() === (`${ this.creature }:${ this.objectName }`).toLowerCase() ||
                                    (
                                        this.objectName.toLowerCase().includes('lore') &&
                                        showon.trim().toLowerCase() === 'lore'
                                    ) ||
                                    (
                                        // Show Emblazon Energy or Emblazon Antimagic Shield Block hint on Shield Block
                                        // if the shield's blessing applies.
                                        (this.object instanceof Shield) &&
                                        (
                                            (
                                                emblazonArmament?.type === EmblazonArmamentTypes.EmblazonEnergy &&
                                                this.objectName === 'Shield Block' &&
                                                showon === 'Emblazon Energy Shield Block'
                                            ) || (
                                                emblazonArmament?.type === EmblazonArmamentTypes.EmblazonAntimagic &&
                                                this.objectName === 'Shield Block' &&
                                                showon === 'Emblazon Antimagic Shield Block'
                                            )
                                        )
                                    ),
                                ),
                        )),
            );
    }

    public hintDescription(hint: Hint): string {
        if (hint.desc) {
            return this._heightenedHintDescription(hint);
        } else {
            if (this.object instanceof ConditionGainSet) {
                return this.object.condition.heightenedText(this.object.condition.desc, this.object.gain.heightened);
            } else {
                return this.object?.desc || '';
            }
        }
    }

    public hintChoice(hint: Hint): string {
        //Only for condition hints, append the choice if the hint only showed up because of the choice.
        if (this.object instanceof ConditionGainSet && hint.conditionChoiceFilter.length) {
            return `: ${ this.object.gain.choice }`;
        }

        return '';
    }

    public onActivateEffect(): void {
        this._refreshService.prepareDetailToChange(this.creature.type, 'effects');
        this._refreshService.processPreparedChanges();
    }

    public traitFromName(traitName: string): Trait {
        return this._traitsDataService.traitFromName(traitName);
    }

    public hintSource(hint: Hint): HintObject | undefined {
        if (hint.replaceSource.length) {
            const replaceSource = hint.replaceSource[0];

            if (replaceSource?.source) {
                switch (replaceSource.type) {
                    case 'feat':
                        return this._featsDataService.featOrFeatureFromName(this.character.customFeats, replaceSource.source)
                            || this.object;
                    default: break;
                }
            }
        }

        return this.object;
    }

    public objectHasType(object: HintObject): boolean {
        return (
            object instanceof Feat ||
            object instanceof Activity ||
            object instanceof ConditionGainSet ||
            object instanceof Item ||
            !!object.desc
        );
    }

    public objectAsNamedObject(object: HintObject): Feat | Activity | Item | Condition | undefined {
        if (
            object instanceof Feat ||
            object instanceof Activity ||
            object instanceof Item
        ) {
            return object;
        }

        if (
            object instanceof ConditionGainSet
        ) {
            return object.condition;
        }

        return undefined;
    }

    public objectAsFeat(object: HintObject): Feat | undefined {
        return object instanceof Feat ? object : undefined;
    }

    public objectAsActivity(object: HintObject): Activity | undefined {
        return object instanceof Activity ? object : undefined;
    }

    public objectAsConditionGainSet(object: HintObject): ConditionGainSet | undefined {
        return object instanceof ConditionGainSet ? object : undefined;
    }

    public objectAsItem(object: HintObject): Item | undefined {
        return object instanceof Item ? object : undefined;
    }

    public objectAsDescOnly(object: HintObject): { desc: string } | undefined {
        if (
            !this.objectAsFeat(object) &&
            !this.objectAsActivity(object) &&
            !this.objectAsConditionGainSet(object) &&
            !this.objectAsItem(object)
        ) {
            return Object.prototype.hasOwnProperty.call(object, 'desc') ? object as { desc: string } : undefined;
        } else {
            return undefined;
        }
    }

    public activityCooldown$(activity: Activity): Observable<number> {
        return this._activityPropertiesService.effectiveCooldown$(activity, { creature: this.creature });
    }

    private _heightenedHintDescription(hint: Hint): string {
        //Spell conditions have their hints heightened to their spell level, everything else is heightened to the character level.
        if (this.object instanceof ConditionGainSet && this.object.condition.minLevel) {
            return hint.heightenedText(hint.desc, this.object.gain.heightened);
        } else {
            return hint.heightenedText(hint.desc, CreatureService.character.level);
        }
    }

}
