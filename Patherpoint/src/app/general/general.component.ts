import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, Input } from '@angular/core';
import { CharacterService } from '../character.service';
import { EffectsService } from '../effects.service';
import { TraitsService } from '../traits.service';
import { AnimalCompanion } from '../AnimalCompanion';
import { FamiliarsService } from '../familiars.service';
import { FeatChoice } from '../FeatChoice';

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
        private changeDetector: ChangeDetectorRef,
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
            this.characterService.set_Span(this.creature + "-general");
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

    get_Languages() {
        return this.get_Character().class.languages.filter(language => language.name != "").map(language => language.name).join(', ')
    }

    get_DifferentWorldsFeat() {
        if (this.get_Character().get_FeatsTaken(1, this.get_Character().level, "Different Worlds").length) {
            return this.get_Character().customFeats.filter(feat => feat.name == "Different Worlds");
        }
    }

    get_ClassChoices() {
        //Get the basic decisions for your class and all archetypes.
        // These decisions are feat choices identified by being .specialChoice, having exactly one feat, and having the class name (or the dedication feat name) as its type.
        let results: { name: string, choice: string }[] = [];
        let character = this.get_Character();
        let featChoices: FeatChoice[] = [];
        let className = character.class?.name || "";
        if (className) {
            results.push({ name: "Class", choice: className });
            character.class.levels.forEach(level => {
                featChoices.push(...level.featChoices.filter(choice => choice.specialChoice && choice.feats.length == 1 && choice.available == 1));
            })
            featChoices.filter(choice => choice.source == className).forEach(choice => {
                let choiceName = choice.feats[0].name;
                if (choiceName.includes(choice.type)) {
                    choiceName = choiceName.split(" " + choice.type).join("");
                }
                results.push({ name: className + " " + choice.type, choice: choiceName })
            })
            let archetypes = this.characterService.get_FeatsAndFeatures().filter(feat => feat.traits.includes("Dedication") && feat.have(this.get_Character(), this.characterService));
            archetypes.forEach(archetype => {
                results.push({ name: "Archetype", choice: archetype.archetype });
                featChoices.filter(choice => choice.source == "Feat: " + archetype.name).forEach(choice => {
                    let choiceName = choice.feats[0].name;
                    if (choiceName.includes(choice.type)) {
                        choiceName = choiceName.split(" " + choice.type).join("");
                    }
                    results.push({ name: archetype.archetype + " " + choice.type, choice: choiceName })
                })
            })
        }
        return results;
    }

    get_CharacterTraits() {
        let character = this.get_Character();
        //Verdant Metamorphosis adds the Plant trait and removes the Humanoid, Animal or Fungus trait.
        if (character.get_FeatsTaken(1, character.level, "Verdant Metamorphosis").length) {
            return ["Plant"].concat(this.get_Character().class.ancestry.traits.filter(trait => !["Humanoid", "Animal", "Fungus"].includes(trait)))
            .sort(function(a,b) {
                if (a > b) {
                    return 1;
                }
                if (a < b) {
                    return -1;
                }
                return 0;
            })
        } else {
            return this.get_Character().class.ancestry.traits
        }
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
