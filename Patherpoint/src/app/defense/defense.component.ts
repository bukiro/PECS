import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, Input } from '@angular/core';
import { DefenseService } from '../defense.service';
import { TraitsService } from '../traits.service';
import { Armor } from '../Armor';
import { EffectsService } from '../effects.service';
import { CharacterService } from '../character.service';
import { AbilitiesService } from '../abilities.service';
import { Character } from '../Character';
import { AnimalCompanion } from '../AnimalCompanion';
import { Talisman } from '../Talisman';
import { Shield } from '../Shield';

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
            this.characterService.set_Span(this.creature+"-defense");
        })
    }

    still_loading() {
        return this.characterService.still_loading()
    }

    get_Accent() {
        return this.characterService.get_Accent();
    }
    
    trackByIndex(index: number, obj: any): any {
        return index;
    }
    
    get_ArmorSpecialization(armor: Armor) {
        return armor.get_ArmorSpecialization(this.get_Creature(), this.characterService);
    }

    get_Creature() {
        return this.characterService.get_Creature(this.creature);
    }

    get_AC() {
        return this.defenseService.get_AC();
    }

    get_CalculatedIndex() {
        switch (this.creature) {
            case "Character":
                return 0;
            case "Companion":
                return 1;
            case "Familiar":
                return 2;
        }
    }

    get_CalculatedAC() {
        this.get_AC().calculate(this.get_Creature(), this.characterService, this.defenseService, this.effectsService);;
        return this.get_AC();
    }

    get_Cover() {
        return this.get_AC().cover(this.get_Creature());
    }

    set_Cover(cover: number) {
        this.get_AC().set_Cover(this.get_Creature(), cover);
    }

    get_EquippedArmor() {
        return this.defenseService.get_EquippedArmor(this.get_Creature() as Character|AnimalCompanion);
    }

    get_EquippedShield() {
        return this.defenseService.get_EquippedShield(this.get_Creature() as Character|AnimalCompanion);
    }

    get_ParryWeapons() {
        return this.defenseService.get_ParryWeapons(this.get_Creature() as Character|AnimalCompanion);
    }

    get_Skills(name: string = "", type: string = "") {
        return this.characterService.get_Skills(this.get_Creature(), name, type);
    }

    get_Traits(traitName: string = "") {
        return this.traitsService.get_Traits(traitName);
    }

    get_ArmorBonus(armor: Armor) {
        return this.defenseService.get_ArmorBonus(this.get_Creature() as Character|AnimalCompanion, this.characterService, armor);
    }

    get_TalismanTitle(talisman: Talisman) {
        return (talisman.trigger ? "Trigger: " + talisman.trigger + "\n\n" : "") + talisman.desc;
    }

    on_TalismanUse(item: Armor|Shield, talisman: Talisman, index: number) {
        this.characterService.set_ToChange(this.creature, "defense");
        this.characterService.on_ConsumableUse(this.get_Creature() as Character|AnimalCompanion, talisman);
        item.talismans.splice(index, 1)
        this.characterService.process_ToChange();
    }

    set_CharacterChanged() {
        this.characterService.set_Changed();
    }

    finish_Loading() {
        if (this.still_loading()) {
            setTimeout(() => this.finish_Loading(), 500)
        } else {
            this.characterService.get_Changed()
            .subscribe((target) => {
                if (["defense", "all", this.creature].includes(target)) {
                    this.changeDetector.detectChanges();
                }
            });
            this.characterService.get_ViewChanged()
            .subscribe((view) => {
                if (view.creature == this.creature && ["defense", "all"].includes(view.target)) {
                    this.changeDetector.detectChanges();
                }
            });
            return true;
        }
    }

    ngOnInit() {
        this.finish_Loading();
    }

}
