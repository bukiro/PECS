import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Activity } from 'src/app/classes/Activity';
import { ActivityGain } from 'src/app/classes/ActivityGain';
import { CharacterService } from 'src/app/services/character.service';
import { ConditionGain } from 'src/app/classes/ConditionGain';
import { ConditionsService } from 'src/app/services/conditions.service';
import { Feat } from 'src/app/character-creation/definitions/models/Feat';
import { ItemActivity } from 'src/app/classes/ItemActivity';
import { RefreshService } from 'src/app/services/refresh.service';
import { SavegameService } from 'src/app/services/savegame.service';
import { Spell } from 'src/app/classes/Spell';
import { SpellCasting } from 'src/app/classes/SpellCasting';
import { SpellGain } from 'src/app/classes/SpellGain';
import { SpellTarget } from 'src/app/classes/SpellTarget';
import { TimeService } from 'src/app/services/time.service';
import { Subscription } from 'rxjs';
import { Character } from 'src/app/classes/Character';
import { AnimalCompanion } from 'src/app/classes/AnimalCompanion';
import { Familiar } from 'src/app/classes/Familiar';
import { SpellCast } from 'src/app/classes/SpellCast';

interface ComponentParameters {
    bloodMagicTrigger: string; canActivate: boolean; canActivateWithoutTarget: boolean; targetNumber: number; target: string;
}

@Component({
    selector: 'app-spellTarget',
    templateUrl: './spellTarget.component.html',
    styleUrls: ['./spellTarget.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpellTargetComponent implements OnInit, OnDestroy {

    @Input()
    creature: string;
    @Input()
    spell: Spell;
    @Input()
    activity: Activity | ItemActivity;
    @Input()
    gain: SpellGain | ActivityGain | ItemActivity;
    @Input()
    parentActivity: Activity | ItemActivity;
    @Input()
    parentActivityGain: ActivityGain | ItemActivity = null;
    @Input()
    spellCast: SpellCast = null;
    @Input()
    casting: SpellCasting = null;
    @Input()
    cannotCast = '';
    @Input()
    cannotExpend = '';
    @Input()
    showExpend = false;
    @Input()
    effectiveSpellLevel = 0;
    @Input()
    bloodMagicFeats: Array<Feat> = [];
    @Input()
    phrase = 'Cast';
    @Input()
    showActions = false;
    @Input()
    showDismiss = false;
    @Input()
    dismissPhrase = '';
    @Output()
    castMessage = new EventEmitter<{ target: string; activated: boolean; options: { expend?: boolean } }>();

    constructor(
        private readonly changeDetector: ChangeDetectorRef,
        private readonly characterService: CharacterService,
        private readonly refreshService: RefreshService,
        private readonly conditionsService: ConditionsService,
        private readonly timeService: TimeService,
        private readonly savegameService: SavegameService,
        private readonly modalService: NgbModal,
        public modal: NgbActiveModal,
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

    private get target(): string {
        return (this.spellCast?.target || '') || (this.parentActivityGain instanceof ItemActivity ? this.parentActivityGain.target : '') || this.action.target || 'self';
    }

    trackByIndex(index: number): number {
        return index;
    }

    on_Cast(target: string, activated: boolean, options: { expend?: boolean } = {}) {
        this.castMessage.emit({ target, activated, options });
    }

    public get_Character(): Character {
        return this.characterService.get_Character();
    }

    private get_CompanionAvailable(): boolean {
        return this.characterService.get_CompanionAvailable();
    }

    public get_Companion(): AnimalCompanion {
        return this.characterService.get_Companion();
    }

    private get_FamiliarAvailable(): boolean {
        return this.characterService.get_FamiliarAvailable();
    }

    public get_Familiar(): Familiar {
        return this.characterService.get_Familiar();
    }

    get_ManualMode() {
        return this.characterService.get_ManualMode();
    }

    public get_Parameters(): ComponentParameters {
        const bloodMagicTrigger = this.get_BloodMagicTrigger();
        const canActivate = this.can_Activate();
        const canActivateWithoutTarget = this.can_Activate(true);
        const targetNumber = this.action.targetNumber(this.effectiveSpellLevel, this.characterService);
        const target = this.target;

        return { bloodMagicTrigger, canActivate, canActivateWithoutTarget, targetNumber, target };
    }

    private get_BloodMagicTrigger(): string {
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

    get_IsSpellGain() {
        return this.gain instanceof SpellGain ? this.gain : null;
    }

    private can_Activate(noTarget = false): boolean {
        //Return whether this spell or activity
        // - causes any blood magic effect or
        // - causes any target conditions and has a target or
        // - causes any caster conditions and caster conditions are not disabled in general, or any of the caster conditions are not disabled.
        // - in case of an activity, adds items or onceeffects (which are independent of the target)
        let gainConditions: Array<ConditionGain> = [];

        if (this.spell) {
            gainConditions = this.spell.get_HeightenedConditions(this.effectiveSpellLevel);
        } else if (this.activity) {
            gainConditions = this.activity.gainConditions;
        }

        return (
            !!this.get_BloodMagicTrigger().length ||
            (
                !noTarget &&
                gainConditions.some(gain => gain.targetFilter != 'caster')
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
                gainConditions.some(gain => gain.targetFilter == 'caster') &&
                (
                    (
                        this.action.isHostile() ?
                            !this.get_Character().settings.noHostileCasterConditions :
                            !this.get_Character().settings.noFriendlyCasterConditions
                    ) ||
                    (
                        this.conditionsService.get_Conditions()
                            .filter(condition => gainConditions.some(gain => gain.name == condition.name && gain.targetFilter == 'caster'))
                            .some(condition =>
                                condition.hasEffects() ||
                                condition.isChangeable(),
                            )
                    )
                )
            )
        );
    }

    private get gainActive(): boolean {
        return this.actionGain.active;
    }

    private cannotTargetCaster(): boolean {
        return (
            this.target != 'self' &&
            (
                this.action.cannotTargetCaster ||
                this.parentActivity?.cannotTargetCaster
            )
        );
    }

    private isHostile(ignoreOverride = false): boolean {
        return this.action.isHostile(ignoreOverride);
    }

    private canTarget(list: Array<string>): boolean {
        return list.includes(this.target);
    }

    public can_TargetSelf(): boolean {
        return (
            !this.gainActive &&
            !this.cannotTargetCaster() &&
            this.canTarget(['self', 'ally']) &&
            !this.isHostile(true)
        );
    }

    public can_TargetCharacter(): boolean {
        return (
            !this.gainActive &&
            this.creature != 'Character' &&
            this.canTarget(['ally']) &&
            !this.isHostile(true)
        );
    }

    public can_TargetCompanion(): boolean {
        return (
            !this.gainActive &&
            this.creature != 'Companion' &&
            this.canTarget(['companion']) &&
            this.get_CompanionAvailable() &&
            !this.isHostile(true)
        );
    }

    public can_TargetFamiliar(): boolean {
        return (
            !this.gainActive &&
            this.creature != 'Familiar' &&
            this.canTarget(['familiar']) &&
            this.get_FamiliarAvailable() &&
            !this.isHostile(true)
        );
    }

    public can_TargetAlly(targetNumber: number): boolean {
        return (
            !this.gainActive &&
            targetNumber != 0 &&
            this.canTarget(['ally', 'area', 'familiar', 'companion']) &&
            !this.isHostile(true)
        );
    }

    open_SpellTargetModal(content) {
        this.modalService.open(content, { centered: true, ariaLabelledBy: 'modal-title' }).result.then(result => {
            if (result == 'Cast click') {
                this.on_Cast('Selected', true);
            }
        });
    }

    get_SpellTargets() {
        //Collect all possible targets for a spell/activity (allies only).
        //Hostile spells and activities don't get targets.
        if (this.action.isHostile(true)) {
            return [];
        }

        const newTargets: Array<SpellTarget> = [];
        const character = this.get_Character();

        this.characterService.get_Creatures().forEach(creature => {
            newTargets.push(Object.assign(new SpellTarget(), { name: creature.name || creature.type, id: creature.id, playerId: character.id, type: creature.type, selected: (this.gain.targets.find(target => target.id == creature.id)?.selected || false), isPlayer: creature === character }));
        });

        if (character.partyName) {
            //Only allow selecting other players if you are in a party.
            this.savegameService.getSavegames().filter(savegame => savegame.partyName == character.partyName && savegame.id != character.id)
                .forEach(savegame => {
                    newTargets.push(Object.assign(new SpellTarget(), { name: savegame.name || 'Unnamed', id: savegame.id, playerId: savegame.id, type: 'Character', selected: (this.gain.targets.find(target => target.id == savegame.id)?.selected || false) }));

                    if (savegame.companionId) {
                        newTargets.push(Object.assign(new SpellTarget(), { name: savegame.companionName || 'Companion', id: savegame.companionId, playerId: savegame.id, type: 'Companion', selected: (this.gain.targets.find(target => target.id == savegame.companionId)?.selected || false) }));
                    }

                    if (savegame.familiarId) {
                        newTargets.push(Object.assign(new SpellTarget(), { name: savegame.familiarName || 'Familiar', id: savegame.familiarId, playerId: savegame.id, type: 'Familiar', selected: (this.gain.targets.find(target => target.id == savegame.familiarId)?.selected || false) }));
                    }
                });
        }

        this.gain.targets = newTargets;

        return this.gain.targets;
    }

    on_SelectAllTargets(event: Event) {
        const checked = (<HTMLInputElement>event.target).checked;

        if (checked) {
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

    get_AllTargetsSelected(targetNumber) {
        if (targetNumber == -1) {
            return (this.gain.targets.filter(target => target.selected).length >= this.gain.targets.length - (this.action.cannotTargetCaster ? 1 : 0));
        } else {
            return (this.gain.targets.filter(target => target.selected).length >= Math.min(this.gain.targets.length - (this.action.cannotTargetCaster ? 1 : 0), targetNumber));
        }
    }

    get_DeactivatePhrase() {
        let phrase = this.dismissPhrase || 'Dismiss <span class=\'actionIcon action1A\'></span> or Stop Sustaining';

        if (this.parentActivityGain?.duration) {
            phrase += ` (Duration: ${ this.get_Duration(this.parentActivityGain?.duration) })`;
        } else if (this.gain.duration) {
            phrase += ` (Duration: ${ this.get_Duration(this.gain?.duration) })`;
        }

        return phrase;
    }

    get_Duration(turns: number, includeTurnState = true, inASentence = false) {
        return this.timeService.getDurationDescription(turns, includeTurnState, inASentence);
    }

    finish_Loading() {
        this.changeSubscription = this.refreshService.get_Changed
            .subscribe(target => {
                if (target == 'activities' || target == 'spellbook' || target == 'all' || target.toLowerCase() == this.creature.toLowerCase()) {
                    this.changeDetector.detectChanges();
                }
            });
        this.viewChangeSubscription = this.refreshService.get_ViewChanged
            .subscribe(view => {
                if (view.creature.toLowerCase() == this.creature.toLowerCase() && ['activities', 'spellbook', 'all'].includes(view.target.toLowerCase())) {
                    this.changeDetector.detectChanges();
                }
            });
    }

    public ngOnInit(): void {
        this.finish_Loading();
    }

    private changeSubscription: Subscription;
    private viewChangeSubscription: Subscription;

    ngOnDestroy() {
        this.changeSubscription?.unsubscribe();
        this.viewChangeSubscription?.unsubscribe();
    }

}
