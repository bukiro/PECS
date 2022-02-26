import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, Input, OnDestroy } from '@angular/core';
import { CharacterService } from 'src/app/services/character.service';
import { EffectsService } from 'src/app/services/effects.service';
import { TraitsService } from 'src/app/services/traits.service';
import { AnimalCompanion } from 'src/app/classes/AnimalCompanion';
import { FamiliarsService } from 'src/app/services/familiars.service';
import { FeatChoice } from 'src/app/classes/FeatChoice';
import { DeitiesService } from 'src/app/services/deities.service';
import { Domain } from 'src/app/classes/Domain';
import { RefreshService } from 'src/app/services/refresh.service';
import { ClassesService } from 'src/app/services/classes.service';
import { Subscription } from 'rxjs';
import { ItemsService } from 'src/app/services/items.service';

@Component({
    selector: 'app-general',
    templateUrl: './general.component.html',
    styleUrls: ['./general.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class GeneralComponent implements OnInit, OnDestroy {

    @Input()
    creature: string = "Character";
    @Input()
    public showMinimizeButton: boolean = true;
    @Input()
    public sheetSide: string = "left";

    constructor(
        private changeDetector: ChangeDetectorRef,
        public characterService: CharacterService,
        private refreshService: RefreshService,
        public effectsService: EffectsService,
        public traitsService: TraitsService,
        private familiarsService: FamiliarsService,
        private deitiesService: DeitiesService,
        private classesService: ClassesService,
        private itemsService: ItemsService
    ) { }

    minimize() {
        this.characterService.get_Character().settings.generalMinimized = !this.characterService.get_Character().settings.generalMinimized;
    }

    get_Minimized() {
        switch (this.creature) {
            case "Character":
                return this.characterService.get_Character().settings.generalMinimized;
            case "Companion":
                return this.characterService.get_Character().settings.companionMinimized;
            case "Familiar":
                return this.characterService.get_Character().settings.familiarMinimized;
        }
    }

    still_loading() {
        return this.characterService.still_loading()
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

    get_ArchetypeFeats() {
        return this.characterService.get_CharacterFeatsAndFeatures().filter(feat => feat.traits.includes("Dedication") && feat.have(this.get_Character(), this.characterService))
    }

    get_Domains() {
        const character = this.get_Character();
        const archetypesDeityFocused = this.get_ArchetypeFeats().some(feat => this.classesService.get_ClassFromName(feat.archetype).deityFocused);
        if (character.class.deityFocused || archetypesDeityFocused) {
            const deity = this.characterService.get_CharacterDeities(character)[0];
            if (deity) {
                let domainFeats = this.characterService.get_CharacterFeatsAndFeatures()
                    .filter(feat => feat.gainDomains?.length && feat.have(character, this.characterService));
                let domains = deity.get_Domains(character, this.characterService)
                    .concat(...(domainFeats.map(feat => feat.gainDomains))
                    );
                return domains.map(domain => this.deitiesService.get_Domains(domain)[0] || new Domain());
            } else {
                return [];
            }
        } else {
            return [];
        }
    }

    get_Tenets() {
        const character = this.get_Character();
        //Collect tenets from all feats and features you have that include them.
        return [].concat(...this.characterService.get_CharacterFeatsAndFeatures()
            .filter(feat => feat.tenets?.length && feat.have(character, this.characterService))
            .map(feat => feat.tenets)
        );
    }

    get_Edicts() {
        let character = this.get_Character();
        const archetypesShowDeityEdicts = this.get_ArchetypeFeats().some(feat => this.classesService.get_ClassFromName(feat.archetype).showDeityEdicts);
        if (character.class.showDeityEdicts || archetypesShowDeityEdicts) {
            //Collect edicts from all deities you have (usually one);
            let deityEdicts: string[] = [];
            this.characterService.get_CharacterDeities(character).forEach(deity => {
                deityEdicts.push(...deity.edicts.map(edict => edict[0].toUpperCase() + edict.substr(1)));
            });
            return deityEdicts;
        } else {
            return [];
        }
    }

    get_Anathema() {
        const character = this.get_Character();

        let deityAnathema: string[] = [];
        const archetypesShowDeityAnathema = this.get_ArchetypeFeats().some(feat => this.classesService.get_ClassFromName(feat.archetype).showDeityAnathema);
        if (character.class.showDeityAnathema || archetypesShowDeityAnathema) {
            //If your Collect anathema from all deities you have (usually one);
            this.characterService.get_CharacterDeities(character).forEach(deity => {
                deityAnathema.push(...deity.anathema.map(anathema => anathema[0].toUpperCase() + anathema.substr(1)));
            });
        }
        //Add anathema from all feats and features you have that include them.
        return character.class.anathema.concat(...this.characterService.get_CharacterFeatsAndFeatures()
            .filter(feat => feat.anathema?.length && feat.have(this.get_Character(), this.characterService))
            .map(feat => feat.anathema.map(anathema => anathema[0].toUpperCase() + anathema.substr(1))))
            .concat((deityAnathema))
    }

    get_Languages() {
        return this.get_Character().class.languages
            .filter(language => (!language.level || language.level <= this.get_Character().level) && language.name)
            .map(language => language.name)
            .concat(this.get_EquipmentLanguages())
            .sort()
            .join(', ')
    }

    get_EquipmentLanguages() {
        let languages: string[] = [];
        const tooManySlottedAeonStones = this.itemsService.get_TooManySlottedAeonStones(this.get_Character());
        this.get_Character().inventories[0].wornitems.filter(wornItem => wornItem.investedOrEquipped()).forEach(wornItem => {
            languages = languages.concat(wornItem.gainLanguages.filter(language => language.name).map(language => language.name))
            if (!tooManySlottedAeonStones) {
                wornItem.aeonStones.forEach(stone => {
                    languages = languages.concat(stone.gainLanguages.filter(language => language.name).map(language => language.name))
                })
            }
        });
        return languages;
    }

    get_DifferentWorldsData() {
        let character = this.get_Character();
        if (this.characterService.get_CharacterFeatsTaken(1, character.level, "Different Worlds").length) {
            return character.class.get_FeatData(0, character.level, "Different Worlds");
        }
    }

    get_ClassChoices() {
        //Get the basic decisions for your class and all archetypes.
        // These decisions are feat choices identified by being .specialChoice==true, having exactly one feat, and having the class name (or the dedication feat name) as its source.
        let results: { name: string, choice: string, subChoice: boolean }[] = [];
        const character = this.get_Character();
        let featChoices: FeatChoice[] = [];
        const className = character.class?.name || "";
        if (className) {
            results.push({ name: "Class", choice: className, subChoice: false });
            character.class.levels.forEach(level => {
                featChoices.push(...level.featChoices.filter(choice => choice.specialChoice && !choice.autoSelectIfPossible && choice.feats.length == 1 && choice.available == 1));
            })
            //Find specialchoices that have this class as their source.
            featChoices.filter(choice => choice.source == className).forEach(choice => {
                let choiceName = choice.feats[0].name;
                if (choiceName.includes(choice.type)) {
                    choiceName = choiceName.replace(choice.type + ": ", "").replace(" " + choice.type, "");
                }
                results.push({ name: choice.type, choice: choiceName, subChoice: true })
            })
            //Archetypes are identified by you having a dedication feat.
            this.get_ArchetypeFeats().forEach(archetype => {
                results.push({ name: "Archetype", choice: archetype.archetype, subChoice: false });
                //Find specialchoices that have this dedication feat as their source.
                featChoices.filter(choice => choice.source == "Feat: " + archetype.name).forEach(choice => {
                    const choiceName = choice.feats[0].name;
                    results.push({ name: choice.type, choice: choiceName, subChoice: true })
                })
            })
        }
        return results;
    }

    get_CharacterTraits() {
        const character = this.get_Character();
        let traits: string[] = JSON.parse(JSON.stringify(character.class.ancestry.traits));
        //Verdant Metamorphosis adds the Plant trait and removes the Humanoid, Animal or Fungus trait.
        if (this.characterService.get_CharacterFeatsTaken(1, character.level, "Verdant Metamorphosis").length) {
            traits = ["Plant"].concat(traits.filter(trait => !["Humanoid", "Animal", "Fungus"].includes(trait)))
        }
        this.effectsService.get_ToggledOnThese(character, ["Character Gain Trait", "Character Lose Trait"]).filter(effect => effect.title).forEach(effect => {
            if (effect.target.toLowerCase().includes("gain trait")) {
                traits.push(effect.title);
            } else if (effect.target.toLowerCase().includes("lose trait")) {
                traits = traits.filter(trait => trait != effect.title);
            }
        })
        return traits.sort();
    }

    get_Traits(name: string = "") {
        return this.traitsService.get_Traits(name);
    }

    finish_Loading() {
        if (this.still_loading()) {
            setTimeout(() => this.finish_Loading(), 500)
        } else {
            this.changeSubscription = this.refreshService.get_Changed
                .subscribe((target) => {
                    if (["general", "all", this.creature.toLowerCase()].includes(target.toLowerCase())) {
                        this.changeDetector.detectChanges();
                    }
                });
            this.viewChangeSubscription = this.refreshService.get_ViewChanged
                .subscribe((view) => {
                    if (view.creature.toLowerCase() == this.creature.toLowerCase() && ["general", "all"].includes(view.target.toLowerCase())) {
                        this.changeDetector.detectChanges();
                    }
                });
            return true;
        }
    }

    ngOnInit() {
        this.finish_Loading();
    }

    private changeSubscription: Subscription;
    private viewChangeSubscription: Subscription;

    ngOnDestroy() {
        this.changeSubscription?.unsubscribe();
        this.viewChangeSubscription?.unsubscribe();
    }

}
