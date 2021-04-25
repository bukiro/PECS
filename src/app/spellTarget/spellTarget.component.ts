import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CharacterService } from '../character.service';
import { ConditionsService } from '../conditions.service';
import { Feat } from '../Feat';
import { SavegameService } from '../savegame.service';
import { Spell } from '../Spell';
import { SpellCasting } from '../SpellCasting';
import { SpellChoice } from '../SpellChoice';
import { SpellGain } from '../SpellGain';
import { SpellTarget } from '../SpellTarget';
import { TimeService } from '../time.service';

@Component({
    selector: 'app-spellTarget',
    templateUrl: './spellTarget.component.html',
    styleUrls: ['./spellTarget.component.scss']
})
export class SpellTargetComponent implements OnInit {

    @Input()
    spell: Spell;
    @Input()
    gain: SpellGain;
    @Input()
    casting: SpellCasting = null;
    @Input()
    choice: SpellChoice = null;
    @Input()
    cannotCast: string = "";
    @Input()
    effectiveSpellLevel: number = 0;
    @Input()
    bloodMagicFeats: Feat[] = [];
    @Output()
    castMessage = new EventEmitter<{ target: string, activated: boolean }>();

    constructor(
        private characterService: CharacterService,
        private conditionsService: ConditionsService,
        private timeService: TimeService,
        private savegameService: SavegameService,
        private modalService: NgbModal,
        public modal: NgbActiveModal
    ) { }

    trackByIndex(index: number, obj: any): any {
        return index;
    }

    on_Cast(target: string, activated: boolean) {
        this.castMessage.emit({ target: target, activated: activated });
    }

    get_Character() {
        return this.characterService.get_Character();
    }

    get_CompanionAvailable() {
        return this.characterService.get_CompanionAvailable();
    }

    get_Companion() {
        return this.characterService.get_Companion();
    }

    get_FamiliarAvailable() {
        return this.characterService.get_FamiliarAvailable();
    }

    get_Familiar() {
        return this.characterService.get_Familiar();
    }

    get_Parameters() {
        let isBloodMagicTrigger = this.get_IsBloodMagicTrigger();
        let canActivate = this.can_Activate();
        let canActivateWithoutTarget = this.can_Activate(true);
        let targetNumber = this.spell.get_TargetNumber(this.effectiveSpellLevel);
        return { isBloodMagicTrigger: isBloodMagicTrigger, canActivate: canActivate, canActivateWithoutTarget: canActivateWithoutTarget, targetNumber: targetNumber }
    }

    get_IsBloodMagicTrigger() {
        return this.bloodMagicFeats.some(feat => feat.bloodMagic.some(bloodMagic => bloodMagic.trigger.includes(this.spell.name)));
    }

    can_Activate(noTarget: boolean = false) {
        //Return whether this spell
        // - causes any blood magic effect or
        // - causes any target conditions and has a target or
        // - causes any caster conditions and caster conditions are not disabled in general, or any of the caster conditions are not disabled.
        let gainConditions = this.spell.get_HeightenedConditions(this.effectiveSpellLevel);
        return (
            this.get_IsBloodMagicTrigger() ||
            (
                !noTarget &&
                gainConditions.some(gain => gain.targetFilter != "caster")
            )
        ) ||
            (
                gainConditions.some(gain => gain.targetFilter == "caster") &&
                (
                    (
                        this.spell.get_IsHostile() ?
                            !this.get_Character().settings.noHostileCasterConditions :
                            !this.get_Character().settings.noFriendlyCasterConditions
                    ) ||
                    (
                        this.conditionsService.get_Conditions()
                            .filter(condition => gainConditions.some(gain => gain.name == condition.name && gain.targetFilter == "caster"))
                            .some(condition =>
                                condition.get_HasEffects() ||
                                condition.get_IsChangeable()
                            )
                    )
                )
            )
    }

    open_SpellTargetModal(content) {
        this.modalService.open(content, { centered: true, ariaLabelledBy: 'modal-title' }).result.then((result) => {
            if (result == "Cast click") {
                this.on_Cast("Selected", true)
            }
        }, (reason) => {
            //Do nothing if cancelled.
        });
    }

    get_SpellTargets() {
        //Collect all possible targets for a spell (allies only).
        //Hostile spells don't get targets.
        if (this.spell.get_IsHostile()) {
            return [];
        }
        let newTargets: SpellTarget[] = [];
        let character = this.get_Character();
        this.characterService.get_Creatures().forEach(creature => {
            newTargets.push(Object.assign(new SpellTarget(), { name: creature.name || creature.type, id: creature.id, playerId: character.id, type: creature.type, selected: (this.gain.targets.find(target => target.id == creature.id)?.selected || false), isPlayer: creature === character }));
        })
        this.savegameService.get_Savegames().filter(savegame => savegame.partyName == character.partyName && savegame.id != character.id).forEach(savegame => {
            newTargets.push(Object.assign(new SpellTarget(), { name: savegame.name || "Unnamed", id: savegame.id, playerId: savegame.id, type: "Character", selected: (this.gain.targets.find(target => target.id == savegame.id)?.selected || false) }));
            if (savegame.companionId) {
                newTargets.push(Object.assign(new SpellTarget(), { name: savegame.companionName || "Companion", id: savegame.companionId, playerId: savegame.id, type: "Companion", selected: (this.gain.targets.find(target => target.id == savegame.companionId)?.selected || false) }));
            }
            if (savegame.familiarId) {
                newTargets.push(Object.assign(new SpellTarget(), { name: savegame.familiarName || "Familiar", id: savegame.familiarId, playerId: savegame.id, type: "Familiar", selected: (this.gain.targets.find(target => target.id == savegame.familiarId)?.selected || false) }));
            }
        })
        this.gain.targets = newTargets;
        return this.gain.targets;
    }

    on_SelectAllTargets(targetNumber: number, checked: boolean) {
        if (checked) {
            if (targetNumber == -1) {
                this.gain.targets.forEach(target => {
                    if (!target.isPlayer || !this.spell.cannotTargetCaster) {
                        target.selected = true;
                    }
                })
            } else {
                for (let index = 0 + (this.spell.cannotTargetCaster ? 1 : 0); index < Math.min(targetNumber + (this.spell.cannotTargetCaster ? 1 : 0), this.gain.targets.length); index++) {
                    this.gain.targets[index].selected = true;
                }
            }
        } else {
            this.gain.targets.forEach(target => {
                target.selected = false;
            })
        }
    }

    get_AllTargetsSelected(targetNumber) {
        if (targetNumber == -1) {
            return (this.gain.targets.filter(target => target.selected).length >= this.gain.targets.length - (this.spell.cannotTargetCaster ? 1 : 0))
        } else {
            return (this.gain.targets.filter(target => target.selected).length >= Math.min(this.gain.targets.length - (this.spell.cannotTargetCaster ? 1 : 0), targetNumber));
        }
    }

    get_Duration(turns: number, includeTurnState: boolean = true, inASentence: boolean = false) {
        return this.timeService.get_Duration(turns, includeTurnState, inASentence);
    }

    ngOnInit() {
    }

}
