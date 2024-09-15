/* eslint-disable complexity */
import {
    Component,
    OnInit,
    Input,
    Output,
    EventEmitter,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    OnDestroy,
    TemplateRef,
} from '@angular/core';
import { NgbModal, NgbActiveModal, NgbTooltip } from '@ng-bootstrap/ng-bootstrap';
import { Observable, Subscription, combineLatest, map, switchMap, of, noop } from 'rxjs';
import { Activity } from 'src/app/classes/activities/activity';
import { ActivityGain } from 'src/app/classes/activities/activity-gain';
import { ItemActivity } from 'src/app/classes/activities/item-activity';
import { ConditionGain } from 'src/app/classes/conditions/condition-gain';
import { AnimalCompanion } from 'src/app/classes/creatures/animal-companion/animal-companion';
import { Creature } from 'src/app/classes/creatures/creature';
import { Familiar } from 'src/app/classes/creatures/familiar/familiar';
import { Spell } from 'src/app/classes/spells/spell';
import { SpellCast } from 'src/app/classes/spells/spell-cast';
import { SpellCasting } from 'src/app/classes/spells/spell-casting';
import { SpellGain } from 'src/app/classes/spells/spell-gain';
import { SpellTarget } from 'src/app/classes/spells/spell-target';
import { CreatureTypes } from 'src/libs/shared/definitions/creature-types';
import { Feat } from 'src/libs/shared/definitions/models/feat';
import { ActivityPropertiesService } from 'src/libs/shared/services/activity-properties/activity-properties.service';
import { CreatureAvailabilityService } from 'src/libs/shared/services/creature-availability/creature-availability.service';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { ConditionsDataService } from 'src/libs/shared/services/data/conditions-data.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { SavegamesService } from 'src/libs/shared/services/saving-loading/savegames/savegames.service';
import { SettingsService } from 'src/libs/shared/services/settings/settings.service';
import { DurationsService } from 'src/libs/shared/time/services/durations/durations.service';
import { BaseClass } from 'src/libs/shared/util/classes/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { propMap$ } from 'src/libs/shared/util/observable-utils';
import { stringEqualsCaseInsensitive } from 'src/libs/shared/util/string-utils';
import { ActionIconsComponent } from 'src/libs/shared/ui/action-icons/components/action-icons/action-icons.component';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

interface ComponentParameters {
    bloodMagicTrigger: string;
    shouldBloodMagicApply: boolean;
    canActivate: boolean;
    canActivateWithoutTarget: boolean;
    allowedTargetNumber: number;
    target: string;
    bloodMagicWarningWithTarget: string;
    bloodMagicWarningWithoutTarget: string;
    bloodMagicWarningManualMode: string;
}

@Component({
    selector: 'app-spell-target',
    templateUrl: './spell-target.component.html',
    styleUrls: ['./spell-target.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,

        NgbTooltip,

        ActionIconsComponent,
    ],
})
export class SpellTargetComponent extends TrackByMixin(BaseClass) implements OnInit, OnDestroy {

    @Input()
    public creature?: Creature;
    @Input()
    public spell!: Spell;
    @Input()
    public activity!: Activity | ItemActivity;
    @Input()
    public gain!: SpellGain | ActivityGain | ItemActivity;
    @Input()
    public parentActivity?: Activity | ItemActivity;
    @Input()
    public parentActivityGain?: ActivityGain | ItemActivity;
    @Input()
    public spellCast?: SpellCast;
    @Input()
    public casting?: SpellCasting;
    @Input()
    public cannotCast?: string;
    @Input()
    public cannotExpend?: string;
    @Input()
    public showExpend?: boolean;
    @Input()
    public effectiveSpellLevel = 0;
    @Input()
    public bloodMagicFeats: Array<Feat> = [];
    @Input()
    public phrase = 'Cast';
    @Input()
    public showActions?: boolean;
    @Input()
    public showDismiss?: boolean;
    @Input()
    public dismissPhrase?: string;

    @Output()
    public readonly castMessage = new EventEmitter<{
        target: '' | 'self' | 'Selected' | CreatureTypes;
        activated: boolean;
        options: { expend?: boolean };
    }>();

    public character = CreatureService.character;

    public creatureTypes = CreatureTypes;

    public spellTargets$: Observable<Array<SpellTarget>>;
    public isManualMode$: Observable<boolean>;

    private _changeSubscription?: Subscription;
    private _viewChangeSubscription?: Subscription;

    constructor(
        private readonly _changeDetector: ChangeDetectorRef,
        private readonly _refreshService: RefreshService,
        private readonly _savegamesService: SavegamesService,
        private readonly _conditionsDataService: ConditionsDataService,
        private readonly _activityPropertiesService: ActivityPropertiesService,
        private readonly _modalService: NgbModal,
        private readonly _durationsService: DurationsService,
        private readonly _creatureService: CreatureService,
        private readonly _creatureAvailabilityService: CreatureAvailabilityService,
        public modal: NgbActiveModal,
    ) {
        super();

        this.spellTargets$ = this._createSpellTargetObservable$();

        this.isManualMode$ = SettingsService.settings.manualMode$;
    }

    public get action(): Activity | Spell {
        return this.activity || this.spell;
    }

    public get actionGain(): SpellGain | ActivityGain | ItemActivity {
        return this.parentActivityGain || this.gain;
    }

    public get active(): boolean {
        return this.parentActivityGain?.active || this.gain.active;
    }

    private get _target(): string {
        return this.spellCast?.target ||
            (this.parentActivityGain instanceof ItemActivity ? this.parentActivityGain.target : false) ||
            this.action.target ||
            'self';
    }

    private get _isGainActive(): boolean {
        return this.actionGain.active;
    }

    public onCast(target: '' | 'self' | 'Selected' | CreatureTypes, activated: boolean, options: { expend?: boolean } = {}): void {
        this.castMessage.emit({ target, activated, options });
    }

    public componentParameters$(): Observable<ComponentParameters> {
        return combineLatest([
            this._canActivate$(),
            this._canActivate$({ withoutTarget: true }),
            this._activityPropertiesService.allowedTargetNumber$(this.action, this.effectiveSpellLevel),
        ])
            .pipe(
                map(([canActivate, canActivateWithoutTarget, allowedTargetNumber]) => {
                    const bloodMagicTrigger = this._bloodMagicTrigger();

                    const target = this._target;
                    const shouldBloodMagicApply = !!bloodMagicTrigger && !this.asSpellGain()?.ignoreBloodMagicTrigger;
                    const bloodMagicWarningWithTarget =
                        shouldBloodMagicApply
                            ? `Casting this spell will trigger ${ bloodMagicTrigger }.`
                            : (
                                canActivate
                                    ? ''
                                    : `The ${ this.spell ? 'spell' : 'activity' } has no automatic effects.`
                            );
                    const bloodMagicWarningWithoutTarget =
                        shouldBloodMagicApply
                            ? `Casting this spell will trigger ${ bloodMagicTrigger }.`
                            : (
                                canActivateWithoutTarget
                                    ? `${ this.spell ? 'Cast' : 'Activate' } with no specific target.`
                                    : `The ${ this.spell ? 'spell' : 'activity' } has no automatic effects.`
                            );
                    const bloodMagicWarningManualMode =
                        shouldBloodMagicApply
                            ? (`Casting this spell will trigger ${ bloodMagicTrigger }.`)
                            : '';

                    return {
                        bloodMagicTrigger,
                        shouldBloodMagicApply,
                        canActivate,
                        canActivateWithoutTarget,
                        allowedTargetNumber,
                        target,
                        bloodMagicWarningWithTarget,
                        bloodMagicWarningWithoutTarget,
                        bloodMagicWarningManualMode,
                    };
                }),
            );
    }

    public asSpellGain(): SpellGain | undefined {
        return this.gain instanceof SpellGain ? this.gain : undefined;
    }

    public canTargetSelf(): boolean {
        return (
            !this._isGainActive &&
            !this._canCasterNotBeTargeted() &&
            this._canTargetList(['self', 'ally']) &&
            !this._isHostile(true)
        );
    }

    public canTargetCharacter(): boolean {
        return (
            !this._isGainActive &&
            !this.creature?.isCharacter() &&
            this._canTargetList(['ally']) &&
            !this._isHostile(true)
        );
    }

    public canTargetCompanion$(): Observable<AnimalCompanion | null> {
        return this._creatureAvailabilityService.isCompanionAvailable$()
            .pipe(
                map(isCompanionAvailable => (
                    !this._isGainActive &&
                    !this.creature?.isAnimalCompanion() &&
                    this._canTargetList(['companion']) &&
                    isCompanionAvailable &&
                    !this._isHostile(true)
                )),
                switchMap(canTarget =>
                    canTarget
                        ? CreatureService.companion$
                        : of(null),
                ),
            );
    }

    public canTargetFamiliar$(): Observable<Familiar | null> {
        return this._creatureAvailabilityService.isFamiliarAvailable$()
            .pipe(
                map(isFamiliarAvailable => (
                    !this._isGainActive &&
                    !this.creature?.isFamiliar() &&
                    this._canTargetList(['familiar']) &&
                    isFamiliarAvailable &&
                    !this._isHostile(true)
                )),
                switchMap(canTarget =>
                    canTarget
                        ? CreatureService.familiar$
                        : of(null),
                ),
            );
    }

    public canTargetAlly(targetNumber: number): boolean {
        return (
            !this._isGainActive &&
            targetNumber !== 0 &&
            this._canTargetList(['ally', 'area', 'familiar', 'companion']) &&
            !this._isHostile(true)
        );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public onOpenSpellTargetModal(content: TemplateRef<any>): void {
        this._modalService.open(content, { centered: true, ariaLabelledBy: 'modal-title' })
            .result
            .then(
                result => {
                    if (result === 'Cast click') {
                        this.onCast('Selected', true);
                    }
                },
                () => noop,
            );
    }

    public onSelectAllTargets(event: Event): void {
        const shouldSelectAll = (event.target as HTMLInputElement).checked;

        if (shouldSelectAll) {
            this.gain.targets.forEach(target => {
                if (!target.isPlayer || !this.action.cannotTargetCaster) {
                    target.selected = true;
                }
            });
        } else {
            this.gain.targets.forEach(target => {
                target.selected = false;
            });
        }
    }

    public areAllTargetsSelected(targetNumber: number): boolean {
        if (targetNumber === -1) {
            return (
                this.gain.targets.filter(target => target.selected).length >=
                this.gain.targets.length - (this.action.cannotTargetCaster ? 1 : 0)
            );
        } else {
            return (
                this.gain.targets.filter(target => target.selected).length >=
                Math.min(this.gain.targets.length - (this.action.cannotTargetCaster ? 1 : 0), targetNumber)
            );
        }
    }

    public deactivatePhrase(): string {
        let phrase = this.dismissPhrase || 'Dismiss <span class=\'actionIcon action1A\'></span> or Stop Sustaining';

        if (this.parentActivityGain?.duration) {
            phrase += ` (Duration: ${ this.durationDescription$(this.parentActivityGain?.duration) })`;
        } else if (this.gain.duration) {
            phrase += ` (Duration: ${ this.durationDescription$(this.gain?.duration) })`;
        }

        return phrase;
    }

    public durationDescription$(turns: number, includeTurnState = true, inASentence = false): Observable<string> {
        return this._durationsService.durationDescription$(turns, includeTurnState, inASentence);
    }

    public ngOnInit(): void {
        this._changeSubscription = this._refreshService.componentChanged$
            .subscribe(target => {
                if (
                    target === 'activities' ||
                    target === 'spellbook' ||
                    target === 'all' ||
                    stringEqualsCaseInsensitive(target, this.creature?.type)
                ) {
                    this._changeDetector.detectChanges();
                }
            });
        this._viewChangeSubscription = this._refreshService.detailChanged$
            .subscribe(view => {
                if (
                    stringEqualsCaseInsensitive(view.creature, this.creature?.type)
                    && ['activities', 'spellbook', 'all'].includes(view.target.toLowerCase())
                ) {
                    this._changeDetector.detectChanges();
                }
            });
    }

    public ngOnDestroy(): void {
        this._changeSubscription?.unsubscribe();
        this._viewChangeSubscription?.unsubscribe();
    }

    private _createSpellTargetObservable$(): Observable<Array<SpellTarget>> {
        return combineLatest([
            this._creatureAvailabilityService.allAvailableCreatures$(),
            this._savegamesService.savegames$,
        ])
            .pipe(
                map(([creatures, savegames]) => {
                    //Collect all possible targets for a spell/activity (allies only).
                    //Hostile spells and activities don't get targets.
                    if (this.action.isHostile(true)) {
                        return [];
                    }

                    const newTargets = new Array<SpellTarget>();
                    const character = CreatureService.character;

                    creatures.forEach(creature => {
                        newTargets.push(
                            SpellTarget.from({
                                name: creature.name || creature.type,
                                id: creature.id,
                                playerId: character.id,
                                type: creature.type,
                                selected: (this.gain.targets.find(target => target.id === creature.id)?.selected || false),
                                isPlayer: creature === character,
                            }),
                        );
                    });

                    if (!character.partyName) {
                        this.gain.targets = newTargets;

                        return this.gain.targets;
                    }

                    savegames
                        .filter(savegame => savegame.partyName === character.partyName && savegame.id !== character.id)
                        .forEach(savegame => {
                            newTargets.push(
                                SpellTarget.from({
                                    name: savegame.name || 'Unnamed',
                                    id: savegame.id,
                                    playerId: savegame.id,
                                    type: CreatureTypes.Character,
                                    selected: this._isTargetSelected(savegame.id),
                                }),
                            );

                            if (savegame.companionId) {
                                newTargets.push(
                                    SpellTarget.from({
                                        name: savegame.companionName || 'Companion',
                                        id: savegame.companionId,
                                        playerId: savegame.id,
                                        type: CreatureTypes.AnimalCompanion,
                                        selected: this._isTargetSelected(savegame.companionId),
                                    }),
                                );
                            }

                            if (savegame.familiarId) {
                                newTargets.push(
                                    SpellTarget.from({
                                        name: savegame.familiarName || 'Familiar',
                                        id: savegame.familiarId,
                                        playerId: savegame.id,
                                        type: CreatureTypes.Familiar,
                                        selected: this._isTargetSelected(savegame.familiarId),
                                    }),
                                );
                            }
                        });

                    this.gain.targets = newTargets;

                    return this.gain.targets;
                }),
            );
    }

    private _bloodMagicTrigger(): string {
        if (this.spell) {
            let bloodMagicTrigger = '';

            this.bloodMagicFeats.forEach(feat => {
                feat.bloodMagic.forEach(bloodMagic => {
                    if (
                        bloodMagic.trigger.includes(this.spell.name) ||
                        bloodMagic.sourceTrigger.some(sourceTrigger =>
                            [
                                this.casting?.source.toLowerCase() || '',
                                this.parentActivityGain?.source.toLowerCase() || '',
                                this.gain?.source.toLowerCase() || '',
                            ].includes(sourceTrigger.toLowerCase()),
                        )
                    ) {
                        if (bloodMagic.neutralPhrase && !bloodMagicTrigger) {
                            bloodMagicTrigger = 'additional effects';
                        } else if (!bloodMagic.neutralPhrase) {
                            bloodMagicTrigger = 'your blood magic power';
                        }
                    }
                });
            });

            return bloodMagicTrigger;
        } else {
            return '';
        }
    }

    private _canActivate$(options?: { withoutTarget?: boolean }): Observable<boolean> {
        //Return whether this spell or activity
        // - causes any blood magic effect or
        // - causes any target conditions and has a target or
        // - causes any caster conditions and caster conditions are not disabled in general,
        //   or any of the caster conditions are not disabled.
        // - in case of an activity, adds items or onceeffects (which are independent of the target)
        return combineLatest([
            propMap$(SettingsService.settings$, 'noHostileCasterConditions$'),
            propMap$(SettingsService.settings$, 'noFriendlyCasterConditions$'),
        ])
            .pipe(
                map(([noHostileCasterConditions, noFriendlyCasterConditions]) => {
                    let gainConditions: Array<ConditionGain> = [];

                    if (this.spell) {
                        gainConditions = this.spell.heightenedConditions(this.effectiveSpellLevel);
                    } else if (this.activity) {
                        gainConditions = this.activity.gainConditions;
                    }

                    return (
                        !!this._bloodMagicTrigger().length ||
                        (
                            !options?.withoutTarget &&
                            gainConditions.some(gain => gain.targetFilter !== 'caster')
                        ) ||
                        (
                            this.activity &&
                            (
                                this.activity.traits.includes('Stance') ||
                                !!this.activity.gainItems.length ||
                                !!this.activity.onceEffects.length
                            )
                        ) ||
                        (
                            gainConditions.some(gain => gain.targetFilter === 'caster') &&
                            (
                                (
                                    this.action.isHostile()
                                        ? !noHostileCasterConditions
                                        : !noFriendlyCasterConditions
                                ) ||
                                (
                                    this._conditionsDataService.conditions()
                                        .filter(condition =>
                                            gainConditions.some(gain => gain.name === condition.name && gain.targetFilter === 'caster'),
                                        )
                                        .some(condition =>
                                            condition.hasEffects ||
                                            condition.isChangeable,
                                        )
                                )
                            )
                        )
                    );
                }),
            );
    }

    private _canCasterNotBeTargeted(): boolean {
        return !!(
            this._target !== 'self' &&
            (
                this.action.cannotTargetCaster ||
                this.parentActivity?.cannotTargetCaster
            )
        );
    }

    private _isHostile(ignoreOverride = false): boolean {
        return this.action.isHostile(ignoreOverride);
    }

    private _canTargetList(list: Array<string>): boolean {
        return list.includes(this._target);
    }

    private _isTargetSelected(id: string): boolean {
        return this.gain.targets.find(target => target.id === id)?.selected ?? false;
    }

}
