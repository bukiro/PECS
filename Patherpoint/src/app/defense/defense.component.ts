import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy } from '@angular/core';
import { DefenseService } from '../defense.service';
import { TraitsService } from '../traits.service';
import { Armor } from '../Armor';
import { EffectsService } from '../effects.service';
import { CharacterService } from '../character.service';
import { AbilitiesService } from '../abilities.service';

@Component({
    selector: 'app-defense',
    templateUrl: './defense.component.html',
    styleUrls: ['./defense.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class DefenseComponent implements OnInit {

    constructor(
        private changeDetector: ChangeDetectorRef,
        public characterService: CharacterService,
        private defenseService: DefenseService,
        private traitsService: TraitsService,
        public effectsService: EffectsService,
        public abilitiesService: AbilitiesService
    ) { }

    still_loading() {
        return this.characterService.still_loading()
    }

    get_AC() {
        return this.defenseService.get_AC();
    }

    get_EffectiveAC() {
        return this.defenseService.get_EffectiveAC();
    }

    get_EquippedArmor() {
        return this.defenseService.get_EquippedArmor();
    }

    get_EquippedShield() {
        return this.defenseService.get_EquippedShield();
    }

    get_ParryWeapons() {
        return this.defenseService.get_ParryWeapons();
    }

    get_Skills(name: string = "", type: string = "") {
        return this.characterService.get_Skills(name, type);
    }

    get_Traits(traitName: string = "") {
        return this.traitsService.get_Traits(traitName);
    }

    get_TraitsForThis(name: string) {
        return this.traitsService.get_TraitsForThis(this.characterService, name);
    }

    get_ArmorBonus(armor: Armor) {
        return this.defenseService.get_ArmorBonus(armor);
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
