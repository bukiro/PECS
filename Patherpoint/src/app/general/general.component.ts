import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, Input } from '@angular/core';
import { CharacterService } from '../character.service';
import { EffectsService } from '../effects.service';
import { TraitsService } from '../traits.service';
import { Speed } from '../Speed';
import { Character } from '../Character';
import { AnimalCompanion } from '../AnimalCompanion';
import { FamiliarsService } from '../familiars.service';

@Component({
    selector: 'app-general',
    templateUrl: './general.component.html',
    styleUrls: ['./general.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GeneralComponent implements OnInit {

    @Input()
    creature: string = "Character";

    constructor(
        private changeDetector:ChangeDetectorRef,
        public characterService: CharacterService,
        public effectsService: EffectsService,
        public traitsService: TraitsService,
        private familiarsService: FamiliarsService
    ) { }

    minimize() {
        this.characterService.get_Character().settings.generalMinimized = !this.characterService.get_Character().settings.generalMinimized;
    }

    set_Span() {
        setTimeout(() => {
            this.characterService.set_Span(this.creature+"-general");
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

    get_Character() {
        return this.characterService.get_Character();
    }

    get_Companion() {
        return this.characterService.get_Companion();
    }

    get_Familiar() {
        return this.characterService.get_Familiar();
    }

    get_FamiliarAbilities(name: string) {
        return this.familiarsService.get_FamiliarAbilities(name);
    }

    get_CompanionSpecies() {
        let companion: AnimalCompanion = this.get_Companion();
        if (companion.level && companion.class.levels.length) {
            let species: string = companion.class.levels[companion.level].name;
            if (companion.species) {
                species += " " + companion.species;
            } else if (companion.class.ancestry && companion.class.ancestry.name) {
                species += " " + companion.class.ancestry.name;
            }
            return species;
        }
    }

    get_CompanionSpecializations() {
        let companion: AnimalCompanion = this.get_Companion();
        if (companion.level && companion.class.specializations.length) {
            return companion.class.specializations.filter(spec => spec.level <= this.get_Character().level).map(spec => spec.name).join(", ");
        }
    }

    add_HeroPoints(amount: number) {
        this.get_Character().heroPoints += amount;
    }

    get_Size() {
        return this.get_Creature().get_Size(this.effectsService);
    }

    get_HuntersEdge() {
        return this.get_Character().get_FeatsTaken(1, this.get_Character().level).filter(gain => ["Flurry", "Outwit", "Precision"].includes(gain.name)).map(gain => gain.name);
    }

    get_Languages() {
        return this.get_Character().class.ancestry.languages.filter(language => language != "").join(', ')
    }

    get_DifferentWorldsFeat() {
        if (this.get_Character().get_FeatsTaken(1, this.get_Character().level, "Different Worlds").length) {
            return this.get_Character().customFeats.filter(feat => feat.name == "Different Worlds");
        }
    }

    get_ClassDCs() {
        return this.characterService.get_Skills(this.get_Creature(), "", "Class DC").filter(skill => skill.level(this.get_Creature() as Character|AnimalCompanion, this.characterService) > 0);
    }

    get_SpellDCs() {
        return this.characterService.get_Skills(this.get_Creature(), "", "Spell DC").filter(skill => skill.level(this.get_Creature() as Character|AnimalCompanion, this.characterService) > 0);
    }

    get_Traits(name: string = "") {
        return this.traitsService.get_Traits(name);
    }

    get_Speeds() {
        let speeds: Speed[] = this.characterService.get_Speeds(this.get_Creature());
        let speedEffects = this.effectsService.get_Effects().all.filter(effect => effect.creature == this.get_Creature().id && effect.apply && (effect.target.includes("Speed")));
        speedEffects.forEach(effect => {
            if (!speeds.filter(speed => speed.name == effect.target).length) {
                speeds.push(new Speed(effect.target))
            }
        });
        return speeds.filter(speed => speed.value(this.get_Creature(), this.characterService, this.effectsService)[0] != 0);
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
