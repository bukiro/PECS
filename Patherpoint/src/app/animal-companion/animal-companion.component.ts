import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CharacterService } from '../character.service';
import { AnimalCompanionsService } from '../animalcompanions.service';
import { AnimalCompanion } from '../AnimalCompanion';
import { AnimalCompanionAncestry } from '../AnimalCompanionAncestry';
import { ItemGain } from '../ItemGain';
import { ActivitiesService } from '../activities.service';

@Component({
    selector: 'app-animal-companion',
    templateUrl: './animal-companion.component.html',
    styleUrls: ['./animal-companion.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AnimalCompanionComponent implements OnInit {

    private showItem: string = "";
    private showList: string = "";
    public hover: string = '';

    constructor(
        private changeDetector:ChangeDetectorRef,
        private characterService: CharacterService,
        private animalCompanionsService: AnimalCompanionsService,
        private activitiesService: ActivitiesService
    ) { }

    minimize() {
        this.characterService.get_Character().settings.companionMinimized = !this.characterService.get_Character().settings.companionMinimized;
        this.set_Changed();
    }

    still_loading() {
        return (this.characterService.still_loading() || this.animalCompanionsService.still_loading());
    }

    toggleCompanionMenu() {
        this.characterService.toggleMenu("companion");
    }

    toggle_Item(name: string) {
        if (this.showItem == name) {
            this.showItem = "";
        } else {
            this.showItem = name;
        }
    }

    toggle_List(name: string) {
        if (this.showList == name) {
            this.showList = "";
        } else {
            this.showList = name;
        }
    }

    get_showItem() {
        return this.showItem;
    }

    get_showList() {
        return this.showList;
    }

    get_Accent() {
        return this.characterService.get_Accent();
    }

    set_Changed() {
        this.characterService.set_Changed();
    }

    //If you don't use trackByIndex on certain inputs, you lose focus everytime the value changes. I don't get that, but I'm using it now.
    trackByIndex(index: number, obj: any): any {
        return index;
    }

    get_Character() {
        return this.characterService.get_Character();
    }

    get_Companion() {
        if (this.characterService.get_Character().class.animalCompanion) {
            return this.characterService.get_Character().class.animalCompanion.companion;
        }
    }

    on_NewCompanion() {
        if (this.characterService.get_Character().class.animalCompanion) {
            this.characterService.get_Character().class.animalCompanion.companion = new AnimalCompanion();
            this.set_Changed();
        }
    }

    get_CompanionTypes() {
        return this.animalCompanionsService.get_CompanionTypes();
    }

    on_TypeChange(type: AnimalCompanionAncestry, taken: boolean) {
        if (taken) {
            this.showList="";
            this.animalCompanionsService.change_Type(this.characterService, this.get_Companion(), type);
        } else {
            this.animalCompanionsService.change_Type(this.characterService, this.get_Companion(), new AnimalCompanionAncestry());
        }
    }

    get_Item(gain: ItemGain) {
        return this.characterService.get_Items()[gain.type].filter(item => item.name == gain.name);
    }

    get_Abilities(type: AnimalCompanionAncestry) {
        let abilities: [{name:string, modifier:string}] = [{name:"", modifier:""}];
        this.characterService.get_Abilities().forEach(ability => {
            let name = ability.name.substr(0,3);
            let modifier = 0;
            let classboosts = this.get_Companion().class.levels[1].abilityChoices[0].boosts.filter(boost => boost.name == ability.name)
            let ancestryboosts = type.abilityChoices[0].boosts.filter(boost => boost.name == ability.name);
            modifier = ancestryboosts.concat(classboosts).filter(boost => boost.type == "Boost").length - ancestryboosts.concat(classboosts).filter(boost => boost.type == "Flaw").length;
            abilities.push({name:name, modifier:(modifier > 0 ? "+" : "")+modifier.toString()})
        })
        abilities.shift();
        return abilities;
    }

    get_Activities(name: string = "") {
        return this.activitiesService.get_Activities(name);
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