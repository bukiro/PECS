import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Activity } from 'src/app/classes/Activity';
import { CreatureService } from 'src/libs/shared/services/character/character.service';
import { ConditionSet } from 'src/app/classes/ConditionSet';
import { Feat } from 'src/libs/shared/definitions/models/Feat';
import { Hint } from 'src/app/classes/Hint';
import { Item } from 'src/app/classes/Item';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { Shield } from 'src/app/classes/Shield';
import { TraitsDataService } from 'src/libs/shared/services/data/traits-data.service';
import { WornItem } from 'src/app/classes/WornItem';
import { Character } from 'src/app/classes/Character';
import { ArmorRune } from 'src/app/classes/ArmorRune';
import { Equipment } from 'src/app/classes/Equipment';
import { Material } from 'src/app/classes/Material';
import { Oil } from 'src/app/classes/Oil';
import { WeaponRune } from 'src/app/classes/WeaponRune';
import { Condition } from 'src/app/classes/Condition';
import { Creature } from 'src/app/classes/Creature';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { Trait } from 'src/app/classes/Trait';
import { ActivityPropertiesService } from 'src/libs/shared/services/activity-properties/activity-properties.service';
import { FeatsDataService } from 'src/libs/shared/services/data/feats-data.service';
import { BaseClass } from 'src/libs/shared/util/mixins/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';

type HintObject =
    Feat | Activity | ConditionSet | Equipment | Oil | WornItem | ArmorRune | WeaponRune | Material | { desc?: string; hints: Array<Hint> };

@Component({
    selector: 'app-hint',
    templateUrl: './hint.component.html',
    styleUrls: ['./hint.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HintComponent extends TrackByMixin(BaseClass) {

    @Input()
    public creature: CreatureTypes = CreatureTypes.Character;
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

    private get _currentCreature(): Creature {
        return CreatureService.creatureFromType(this.creature);
    }

    public hints(): Array<Hint> {
        if (this.noFilter) {
            return (this.object instanceof ConditionSet ? this.object.condition.hints : (this.object?.hints || []));
        }

        const isSlottedAeonStone = this.object instanceof WornItem && this.object.isSlottedAeonStone;
        const isEmblazonArmamentShield = (this.object instanceof Shield && this.object.emblazonArmament.length) ? this.object : null;

        return (this.object instanceof ConditionSet ? this.object.condition.hints : (this.object?.hints || []))
            .filter((hint: Hint) =>
                (hint.minLevel ? this.character.level >= hint.minLevel : true) &&
                (
                    this.object instanceof ConditionSet ?
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
                            //Show Emblazon Energy or Emblazon Antimagic Shield Block hint on Shield Block if the shield's blessing applies.
                            isEmblazonArmamentShield &&
                            (
                                (
                                    isEmblazonArmamentShield.$emblazonEnergy &&
                                    this.objectName === 'Shield Block' &&
                                    showon === 'Emblazon Energy Shield Block'
                                ) || (
                                    isEmblazonArmamentShield.$emblazonAntimagic &&
                                    this.objectName === 'Shield Block' &&
                                    showon === 'Emblazon Antimagic Shield Block'
                                )
                            )
                        ),
                    ),
            );
    }

    public hintDescription(hint: Hint): string {
        if (hint.desc) {
            return this._heightenedHintDescription(hint);
        } else {
            if (this.object instanceof ConditionSet) {
                return this.object.condition.heightenedText(this.object.condition.desc, this.object.gain.heightened);
            } else {
                return this.object?.desc || '';
            }
        }
    }

    public hintChoice(hint: Hint): string {
        //Only for condition hints, append the choice if the hint only showed up because of the choice.
        if (this.object instanceof ConditionSet && hint.conditionChoiceFilter.length) {
            return `: ${ this.object.gain.choice }`;
        }

        return '';
    }

    public onActivateEffect(): void {
        this._refreshService.prepareDetailToChange(this.creature, 'effects');
        this._refreshService.processPreparedChanges();
    }

    public traitFromName(traitName: string): Trait {
        return this._traitsDataService.traitFromName(traitName);
    }

    public hintSource(hint: Hint): HintObject | undefined {
        if (hint.replaceSource.length) {
            const replaceSource = hint.replaceSource[0];

            if (replaceSource.source) {
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
            object instanceof ConditionSet ||
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
            object instanceof ConditionSet
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

    public objectAsConditionSet(object: HintObject): ConditionSet | undefined {
        return object instanceof ConditionSet ? object : undefined;
    }

    public objectAsItem(object: HintObject): Item | undefined {
        return object instanceof Item ? object : undefined;
    }

    public objectAsDescOnly(object: HintObject): { desc: string } | undefined {
        if (
            !this.objectAsFeat(object) &&
            !this.objectAsActivity(object) &&
            !this.objectAsConditionSet(object) &&
            !this.objectAsItem(object)
        ) {
            return Object.prototype.hasOwnProperty.call(object, 'desc') ? object as { desc: string } : undefined;
        } else {
            return undefined;
        }
    }

    public activityCooldown(activity: Activity): number {
        this._activityPropertiesService.cacheEffectiveCooldown(activity, { creature: this._currentCreature });

        return activity.$cooldown;
    }

    private _heightenedHintDescription(hint: Hint): string {
        //Spell conditions have their hints heightened to their spell level, everything else is heightened to the character level.
        if (this.object instanceof ConditionSet && this.object.condition.minLevel) {
            return hint.heightenedText(hint.desc, this.object.gain.heightened);
        } else {
            return hint.heightenedText(hint.desc, CreatureService.character.level);
        }
    }

}
