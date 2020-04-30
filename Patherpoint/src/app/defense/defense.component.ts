import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, Input } from '@angular/core';
import { DefenseService } from '../defense.service';
import { TraitsService } from '../traits.service';
import { Armor } from '../Armor';
import { EffectsService } from '../effects.service';
import { CharacterService } from '../character.service';
import { AbilitiesService } from '../abilities.service';
import { Character } from '../Character';
import { AnimalCompanion } from '../AnimalCompanion';

@Component({
    selector: 'app-defense',
    templateUrl: './defense.component.html',
    styleUrls: ['./defense.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DefenseComponent implements OnInit {

    @Input()
    creature: string = "Character";

    constructor(
        private changeDetector: ChangeDetectorRef,
        public characterService: CharacterService,
        private defenseService: DefenseService,
        private traitsService: TraitsService,
        public effectsService: EffectsService,
        public abilitiesService: AbilitiesService
    ) { }

    minimize() {
        this.characterService.get_Character().settings.defenseMinimized = !this.characterService.get_Character().settings.defenseMinimized;
    }

    set_Span() {
        setTimeout(() => {
            document.getElementById(this.creature+"-defense").style.gridRow = "span "+this.characterService.get_Span(this.creature+"-defense-height");
        })
    }

    still_loading() {
        return this.characterService.still_loading()
    }

    get_Accent() {
        return this.characterService.get_Accent();
    }
    
    get_Creature() {
        return this.characterService.get_Creature(this.creature);
    }

    get_AC() {
        return this.defenseService.get_AC();
    }

    get_CalculatedAC() {
        this.get_AC().calculate(this.get_Creature(), this.characterService, this.defenseService, this.effectsService);;
        return this.get_AC();
    }

    get_EquippedArmor() {
        return this.defenseService.get_EquippedArmor(this.get_Creature());
    }

    get_EquippedShield() {
        return this.defenseService.get_EquippedShield(this.get_Creature());
    }

    get_ParryWeapons() {
        return this.defenseService.get_ParryWeapons(this.get_Creature());
    }

    get_Skills(name: string = "", type: string = "") {
        return this.characterService.get_Skills(this.get_Creature(), name, type);
    }

    get_Traits(traitName: string = "") {
        return this.traitsService.get_Traits(traitName);
    }

    get_ArmorBonus(armor: Armor) {
        return this.defenseService.get_ArmorBonus(this.get_Creature(), this.characterService, armor);
    }

    set_CharacterChanged() {
        this.characterService.set_Changed();
    }

    finish_Loading() {
        if (this.still_loading()) {
            setTimeout(() => this.finish_Loading(), 500)
        } else {
            this.characterService.get_Changed()
            .subscribe(() => 
            this.changeDetector.detectChanges()
                )
            return true;
        }
    }

    ngOnInit() {
        this.finish_Loading();
    }

}
