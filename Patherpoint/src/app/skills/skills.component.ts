import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, Input } from '@angular/core';
import { CharacterService } from '../character.service';
import { SkillsService } from '../skills.service';
import { FeatsService } from '../feats.service';
import { Character } from '../Character';
import { AnimalCompanion } from '../AnimalCompanion';
import { ConditionsService } from '../Conditions.service';
import { Familiar } from '../Familiar';
import { FamiliarsService } from '../familiars.service';

@Component({
    selector: 'app-skills',
    templateUrl: './skills.component.html',
    styleUrls: ['./skills.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class SkillsComponent implements OnInit {

    @Input()
    creature: string = "Character";

    constructor(
        private changeDetector: ChangeDetectorRef,
        public characterService: CharacterService,
        public skillsService: SkillsService,
        private conditionsService: ConditionsService,
        private familiarsService: FamiliarsService,
        public featsService: FeatsService
    ) { }

    minimize() {
        this.characterService.get_Character().settings.skillsMinimized = !this.characterService.get_Character().settings.skillsMinimized;
    }

    set_Span() {
        setTimeout(() => {
            this.characterService.set_Span(this.creature+"-skills");
        })
    }

    get_Skills(name: string = "", type: string = "") {
        return this.characterService.get_Skills(this.get_Creature(), name, type);
    }

    get_Accent() {
        return this.characterService.get_Accent();
    }
    
    get_Creature() {
        return this.characterService.get_Creature(this.creature);
    }

    get_Senses() {
        let creature = this.get_Creature();
        let senses: string[] = [];
        
        let ancestrySenses: string[]
        if (creature.type == "Familiar") {
            ancestrySenses = creature.senses;
        } else {
            ancestrySenses = creature.class.ancestry.senses;
        }
        if (ancestrySenses.length) {
            senses.push(...ancestrySenses)
        }
        if (this.creature == "Character") {
            let character = this.get_Creature() as Character;
            let heritageSenses = character.class.heritage.senses
            if (heritageSenses.length) {
                senses.push(...heritageSenses)
            }
            character.get_FeatsTaken(0, character.level).map(gain => this.characterService.get_FeatsAndFeatures(gain.name)[0]).filter(feat => feat.senses.length).forEach(feat => {
                senses.push(...feat.senses);
            });
            this.characterService.get_AppliedConditions(character).filter(gain => gain.apply)
                .map(gain => this.conditionsService.get_Conditions(gain.name)[0]).filter(condition => condition.senses.length).forEach(condition => {
                    senses.push(...condition.senses)
                });
        }
        if (this.creature == "Familiar") {
            let familiar = this.get_Creature() as Familiar;
            familiar.abilities.feats.map(gain => this.familiarsService.get_FamiliarAbilities(gain.name)[0]).filter(ability => ability.senses.length).forEach(ability => {
                senses.push(...ability.senses);
            })
        }
        this.characterService.get_AppliedConditions(this.get_Creature()).filter(gain => gain.apply)
            .map(gain => this.conditionsService.get_Conditions(gain.name)[0]).filter(condition => condition.senses.length).forEach(condition => {
                senses.push(...condition.senses)
            });
        let uniquesenses: string[] = [];
        senses.forEach(sense => {
            if (!uniquesenses.includes(sense)) {
                uniquesenses.push(sense);
            }
        })
        return senses;
    }

    still_loading() {
        return this.skillsService.still_loading() || this.characterService.still_loading();
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
        this.skillsService.initialize()
        this.finish_Loading();
    }

}