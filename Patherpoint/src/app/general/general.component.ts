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
        //Remove tenets from all feats and features you have that include them.
        return [].concat(...this.get_Character().get_FeatsTaken(1, this.get_Character().level)
            .map(feat => this.characterService.get_FeatsAndFeatures(feat.name)[0])
            .filter(feat => feat?.tenets?.length)
            .map(feat => feat.tenets))
    }

    get_Anathema() {
        //Remove tenets from all feats and features you have that include them.
        return [].concat(...this.get_Character().get_FeatsTaken(1, this.get_Character().level)
            .map(feat => this.characterService.get_FeatsAndFeatures(feat.name)[0])
            .filter(feat => feat?.anathema?.length)
            .map(feat => feat.anathema))
    }

    get_HuntersEdge() {
        return this.get_Character().get_FeatsTaken(1, this.get_Character().level).filter(gain => ["Flurry", "Outwit", "Precision"].includes(gain.name));
    }

    get_WizardSchool() {
        return this.get_Character().get_FeatsTaken(1, this.get_Character().level)
            .filter(gain => ["Abjuration School", "Conjuration School", "Divination School", "Enchantment School", "Evocation School", "Illusion School", "Necromancy School", "Transmutation School", "Universalist School"].includes(gain.name));
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
        //We don't process the values yet - for now we just collect all Speeds that are mentioned in effects.
        let speedEffects = this.effectsService.get_Effects().all.filter(effect => effect.creature == this.get_Creature().id && effect.apply && (effect.target.includes("Speed")));
        speedEffects.forEach(effect => {
            if (!speeds.filter(speed => speed.name == effect.target).length) {
                speeds.push(new Speed(effect.target))
            }
        });
        //Remove any duplicates for display
        let uniqueSpeeds: Speed[] = [];
        speeds.forEach(speed => {
            if (!uniqueSpeeds.find(uniqueSpeed => uniqueSpeed.name == speed.name)) {
                uniqueSpeeds.push(speed);
            }
        })
        return uniqueSpeeds.filter(speed => speed.value(this.get_Creature(), this.characterService, this.effectsService)[0] != 0);
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
            return true;
        }
    }

    ngOnInit() {
        this.finish_Loading();
    }

}
