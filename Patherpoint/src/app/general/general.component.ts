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
    
    trackByIndex(index: number, obj: any): any {
        return index;
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

    get_Tenets() {
        //Collect tenets from all feats and features you have that include them.
        return [].concat(...this.characterService.get_FeatsAndFeatures()
            .filter(feat => feat.tenets?.length && feat.have(this.get_Character(), this.characterService))
            .map(feat => feat.tenets))
    }

    get_Anathema() {
        //Collect anathema from all feats and features you have that include them.
        return this.get_Character().class.anathema.concat(...this.characterService.get_FeatsAndFeatures()
        .filter(feat => feat.anathema?.length && feat.have(this.get_Character(), this.characterService))
        .map(feat => feat.anathema))
    }

    get_Archetypes() {
        return this.characterService.get_FeatsAndFeatures().filter(feat => feat.traits.includes("Dedication") && feat.have(this.get_Character(), this.characterService));
    }

    get_Muse() {
        return this.get_Character().get_FeatsTaken(1, this.get_Character().level).filter(gain => ["Enigma Muse", "Maestro Muse", "Polymath Muse", "Multifarious Muse: Enigma Muse", "Multifarious Muse: Maestro Muse", "Multifarious Muse: Polymath Muse"].includes(gain.name));
    }

    get_HuntersEdge() {
        return this.get_Character().get_FeatsTaken(1, this.get_Character().level).filter(gain => ["Flurry", "Outwit", "Precision"].includes(gain.name));
    }

    get_Racket() {
        return this.get_Character().get_FeatsTaken(1, this.get_Character().level).filter(gain => ["Ruffian Racket", "Scoundrel Racket", "Thief Racket", "Multifarious Muse: Enigma Muse", "Multifarious Muse: Maestro Muse", "Multifarious Muse: Polymath Muse"].includes(gain.name));
    }

    get_WizardSchool() {
        return this.get_Character().get_FeatsTaken(1, this.get_Character().level)
            .filter(gain => ["Abjuration School", "Conjuration School", "Divination School", "Enchantment School", "Evocation School", "Illusion School", "Necromancy School", "Transmutation School", "Universalist Wizard"].includes(gain.name));
    }

    get_ArcaneThesis() {
        return this.get_Character().get_FeatsTaken(1, this.get_Character().level)
            .filter(gain => ["Improved Familiar Attunement", "Metamagical Experimentation", "Spell Blending", "Spell Substitution"].includes(gain.name));
    }

    get_Languages() {
        return this.get_Character().class.languages.filter(language => language != "").join(', ')
    }

    get_DifferentWorldsFeat() {
        if (this.get_Character().get_FeatsTaken(1, this.get_Character().level, "Different Worlds").length) {
            return this.get_Character().customFeats.filter(feat => feat.name == "Different Worlds");
        }
    }

    get_Bloodlines() {
        return this.get_Character().get_FeatsTaken(1, this.get_Character().level)
        .filter(gain => 
            ["Aberrant Bloodline",
            "Angelic Bloodline",
            "Demonic Bloodline",
            "Diabolic Bloodline",
            "Draconic Bloodline",
            "Elemental Bloodline",
            "Fey Bloodline",
            "Hag Bloodline",
            "Imperial Bloodline",
            "Undead Bloodline"].includes(gain.name))
    }

    get_Traits(name: string = "") {
        return this.traitsService.get_Traits(name);
    }

    finish_Loading() {
        if (this.still_loading()) {
            setTimeout(() => this.finish_Loading(), 500)
        } else {
            this.characterService.get_Changed()
            .subscribe((target) => {
                if (target == "general" || target == "all" || target == this.creature) {
                    this.changeDetector.detectChanges();
                }
            });
            this.characterService.get_ViewChanged()
            .subscribe((view) => {
                if (view.creature == this.creature && ["general", "all"].includes(view.target)) {
                    this.changeDetector.detectChanges();
                }
                if (view.creature == "Character" && view.target == "span") {
                    this.set_Span();
                }
            });
            return true;
        }
    }

    ngOnInit() {
        this.finish_Loading();
    }

}
