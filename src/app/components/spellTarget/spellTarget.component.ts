import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Activity } from 'src/app/classes/Activity';
import { ActivityGain } from 'src/app/classes/ActivityGain';
import { CreatureService } from 'src/app/services/character.service';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { Feat } from 'src/app/character-creation/definitions/models/Feat';
import { ItemActivity } from 'src/app/classes/ItemActivity';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { SavegamesService } from 'src/libs/shared/saving-loading/services/savegames/savegames.service';
import { Spell } from 'src/app/classes/Spell';
import { SpellCasting } from 'src/app/classes/SpellCasting';
import { SpellGain } from 'src/app/classes/SpellGain';
import { SpellTarget } from 'src/app/classes/SpellTarget';
import { Subscription } from 'rxjs';
import { Character } from 'src/app/classes/Character';
import { AnimalCompanion } from 'src/app/classes/AnimalCompanion';
import { Familiar } from 'src/app/classes/Familiar';
import { SpellCast } from 'src/app/classes/SpellCast';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { Trackers } from 'src/libs/shared/util/trackers';
import { ActivityPropertiesService } from 'src/libs/shared/services/activity-properties/activity-properties.service';
import { ConditionsDataService } from 'src/app/core/services/data/conditions-data.service';
import { DurationsService } from 'src/libs/time/services/durations/durations.service';
import { SettingsService } from 'src/app/core/services/settings/settings.service';
import { CreatureAvailabilityService } from 'src/libs/shared/services/creature-availability/creature-availability.service';

interface ComponentParameters {
    bloodMagicTrigger: string;
    shouldBloodMagicApply: boolean;
    canActivate: boolean;
    canActivateWithoutTarget: boolean;
    targetNumber: number;
    target: string;
    bloodMagicWarningWithTarget: string;
    bloodMagicWarningWithoutTarget: string;
    bloodMagicWarningManualMode: string;
}

@Component({
    selector: 'app-spellTarget',
    templateUrl: './spellTarget.component.html',
    styleUrls: ['./spellTarget.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpellTargetComponent implements OnInit, OnDestroy {

    @Input()
    public creature: CreatureTypes;
    @Input()
    public spell: Spell;
    @Input()
    public activity: Activity | ItemActivity;
    @Input()
    public gain: SpellGain | ActivityGain | ItemActivity;
    @Input()
    public parentActivity: Activity | ItemActivity;
    @Input()
    public parentActivityGain: ActivityGain | ItemActivity = null;
    @Input()
    public spellCast: SpellCast = null;
    @Input()
    public casting: SpellCasting = null;
    @Input()
    public cannotCast = '';
    @Input()
    public cannotExpend = '';
    @Input()
    public showExpend = false;
    @Input()
    public effectiveSpellLevel = 0;
    @Input()
    public bloodMagicFeats: Array<Feat> = [];
    @Input()
    public phrase = 'Cast';
    @Input()
    public showActions = false;
    @Input()
    public showDismiss = false;
    @Input()
    public dismissPhrase = '';

    @Output()
    public readonly castMessage = new EventEmitter<{
        target: '' | 'self' | 'Selected' | CreatureTypes;
        activated: boolean;
        options: { expend?: boolean };
    }>();

    public creatureTypesEnum = CreatureTypes;

    private _changeSubscription: Subscription;
    private _viewChangeSubscription: Subscription;

    constructor(
        private readonly _changeDetector: ChangeDetectorRef,
        private readonly _refreshService: RefreshService,
        private readonly _conditionsDataService: ConditionsDataService,
        private readonly _savegamesService: SavegamesService,
        private readonly _activityPropertiesService: ActivityPropertiesService,
        private readonly _modalService: NgbModal,
        private readonly _durationsService: DurationsService,
        private readonly _creatureAvailabilityService: CreatureAvailabilityService,
        public modal: NgbActiveModal,
        public trackers: Trackers,
    ) { }

    public get action(): Activity | Spell {
        return this.activity || this.spell;
    }

    public get actionGain(): SpellGain | ActivityGain | ItemActivity {
        return this.parentActivityGain || this.gain;
    }

    public get active(): boolean {
        return this.parentActivityGain?.active || this.gain.active;
    }

    public get character(): Character {
        return CreatureService.character;
    }

    public get companion(): AnimalCompanion {
        return CreatureService.companion;
    }

    public get familiar(): Familiar {
        return CreatureService.familiar;
    }

    public get isManualMode(): boolean {
        return SettingsService.isManualMode;
    }

    private get _target(): string {
        return this.spellCast?.target ||
            (this.parentActivityGain instanceof ItemActivity ? this.parentActivityGain.target : false) ||
            this.action.target ||
            'self';
    }

    private get _isCompanionAvailable(): boolean {
        return this._creatureAvailabilityService.isCompanionAvailable();
    }

    private get _isFamiliarAvailable(): boolean {
        return this._creatureAvailabilityService.isFamiliarAvailable();
    }

    private get _isGainActive(): boolean {
        return this.actionGain.active;
    }

    public onCast(target: '' | 'self' | 'Selected' | CreatureTypes, activated: boolean, options: { expend?: boolean } = {}): void {
        this.castMessage.emit({ target, activated, options });
    }

    public componentParameters(): ComponentParameters {
        const bloodMagicTrigger = this._bloodMagicTrigger();
        const canActivate = this._canActivate();
        const canActivateWithoutTarget = this._canActivate(true);
        const targetNumber =
            this.action
                ? this._activityPropertiesService.allowedTargetNumber(this.action, this.effectiveSpellLevel)
                : 0;

        const target = this._target;
        const shouldBloodMagicApply = bloodMagicTrigger && !this.asSpellGain()?.ignoreBloodMagicTrigger;
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
                    !canActivateWithoutTarget
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
            targetNumber,
            target,
            bloodMagicWarningWithTarget,
            bloodMagicWarningWithoutTarget,
            bloodMagicWarningManualMode,
        };
    }

    public asSpellGain(): SpellGain {
        return this.gain instanceof SpellGain ? this.gain : null;
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
            this.creature !== CreatureTypes.Character &&
            this._canTargetList(['ally']) &&
            !this._isHostile(true)
        );
    }

    public canTargetCompanion(): boolean {
        return (
            !this._isGainActive &&
            this.creature !== CreatureTypes.AnimalCompanion &&
            this._canTargetList(['companion']) &&
            this._isCompanionAvailable &&
            !this._isHostile(true)
        );
    }

    public canTargetFamiliar(): boolean {
        return (
            !this._isGainActive &&
            this.creature !== CreatureTypes.Familiar &&
            this._canTargetList(['familiar']) &&
            this._isFamiliarAvailable &&
            !this._isHostile(true)
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

    public onOpenSpellTargetModal(content): void {
        this._modalService.open(content, { centered: true, ariaLabelledBy: 'modal-title' }).result.then(result => {
            if (result === 'Cast click') {
                this.onCast('Selected', true);
            }
        });
    }

    public spellTargets(): Array<SpellTarget> {
        //Collect all possible targets for a spell/activity (allies only).
        //Hostile spells and activities don't get targets.
        if (this.action.isHostile(true)) {
            return [];
        }

        const newTargets: Array<SpellTarget> = [];
        const character = this.character;

        this._creatureAvailabilityService.allAvailableCreatures().forEach(creature => {
            newTargets.push(
                Object.assign(
                    new SpellTarget(),
                    {
                        name: creature.name || creature.type,
                        id: creature.id,
                        playerId: character.id,
                        type: creature.type,
                        selected: (this.gain.targets.find(target => target.id === creature.id)?.selected || false),
                        isPlayer: creature === character,
                    }));
        });

        //Make all party members available for selection only if you are in a party.
        if (character.partyName) {
            this._savegamesService.savegames()
                .filter(savegame => savegame.partyName === character.partyName && savegame.id !== character.id)
                .forEach(savegame => {
                    newTargets.push(
                        Object.assign(
                            new SpellTarget(),
                            {
                                name: savegame.name || 'Unnamed',
                                id: savegame.id,
                                playerId: savegame.id,
                                type: CreatureTypes.Character,
                                selected: (this.gain.targets.find(target => target.id === savegame.id)?.selected || false),
                            },
                        ),
                    );

                    if (savegame.companionId) {
                        newTargets.push(
                            Object.assign(
                                new SpellTarget(),
                                {
                                    name: savegame.companionName || 'Companion',
                                    id: savegame.companionId,
                                    playerId: savegame.id,
                                    type: 'Companion',
                                    selected: (this.gain.targets.find(target => target.id === savegame.companionId)?.selected || false),
                                },
                            ),
                        );
                    }

                    if (savegame.familiarId) {
                        newTargets.push(
                            Object.assign(
                                new SpellTarget(),
                                {
                                    name: savegame.familiarName || 'Familiar',
                                    id: savegame.familiarId,
                                    playerId: savegame.id,
                                    type: 'Familiar',
                                    selected: (this.gain.targets.find(target => target.id === savegame.familiarId)?.selected || false),
                                },
                            ),
                        );
                    }
                });
        }

        this.gain.targets = newTargets;

        return this.gain.targets;
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

    public areAllTargetsSelected(targetNumber): boolean {
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
            phrase += ` (Duration: ${ this.durationDescription(this.parentActivityGain?.duration) })`;
        } else if (this.gain.duration) {
            phrase += ` (Duration: ${ this.durationDescription(this.gain?.duration) })`;
        }

        return phrase;
    }

    public durationDescription(turns: number, includeTurnState = true, inASentence = false): string {
        return this._durationsService.durationDescription(turns, includeTurnState, inASentence);
    }

    public ngOnInit(): void {
        this._changeSubscription = this._refreshService.componentChanged$
            .subscribe(target => {
                if (
                    target === 'activities' ||
                    target === 'spellbook' ||
                    target === 'all' ||
                    target.toLowerCase() === this.creature.toLowerCase()
                ) {
                    this._changeDetector.detectChanges();
                }
            });
        this._viewChangeSubscription = this._refreshService.detailChanged$
            .subscribe(view => {
                if (
                    view.creature.toLowerCase() === this.creature.toLowerCase() &&
                    ['activities', 'spellbook', 'all'].includes(view.target.toLowerCase())
                ) {
                    this._changeDetector.detectChanges();
                }
            });
    }

    public ngOnDestroy(): void {
        this._changeSubscription?.unsubscribe();
        this._viewChangeSubscription?.unsubscribe();
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

    private _canActivate(noTarget = false): boolean {
        //Return whether this spell or activity
        // - causes any blood magic effect or
        // - causes any target conditions and has a target or
        // - causes any caster conditions and caster conditions are not disabled in general,
        //   or any of the caster conditions are not disabled.
        // - in case of an activity, adds items or onceeffects (which are independent of the target)
        let gainConditions: Array<ConditionGain> = [];

        if (this.spell) {
            gainConditions = this.spell.heightenedConditions(this.effectiveSpellLevel);
        } else if (this.activity) {
            gainConditions = this.activity.gainConditions;
        }

        return (
            !!this._bloodMagicTrigger().length ||
            (
                !noTarget &&
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
                        this.action.isHostile() ?
                            !this.character.settings.noHostileCasterConditions :
                            !this.character.settings.noFriendlyCasterConditions
                    ) ||
                    (
                        this._conditionsDataService.conditions()
                            .filter(condition =>
                                gainConditions.some(gain => gain.name === condition.name && gain.targetFilter === 'caster'),
                            )
                            .some(condition =>
                                condition.hasEffects() ||
                                condition.isChangeable(),
                            )
                    )
                )
            )
        );
    }

    private _canCasterNotBeTargeted(): boolean {
        return (
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

}
