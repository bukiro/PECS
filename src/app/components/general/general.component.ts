import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, Input, OnDestroy } from '@angular/core';
import { CharacterService } from 'src/app/services/character.service';
import { EffectsService } from 'src/app/services/effects.service';
import { TraitsService } from 'src/app/services/traits.service';
import { AnimalCompanion } from 'src/app/classes/AnimalCompanion';
import { FamiliarsService } from 'src/app/services/familiars.service';
import { FeatChoice } from 'src/app/character-creation/definitions/models/FeatChoice';
import { DeitiesService } from 'src/app/services/deities.service';
import { Domain } from 'src/app/classes/Domain';
import { RefreshService } from 'src/app/services/refresh.service';
import { ClassesService } from 'src/app/services/classes.service';
import { Subscription } from 'rxjs';
import { ItemsService } from 'src/app/services/items.service';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { Character } from 'src/app/classes/Character';
import { Creature } from 'src/app/classes/Creature';
import { Familiar } from 'src/app/classes/Familiar';
import { Feat } from 'src/app/character-creation/definitions/models/Feat';
import { FeatData } from 'src/app/character-creation/definitions/models/FeatData';
import { Trait } from 'src/app/classes/Trait';
import { Trackers } from 'src/libs/shared/util/trackers';
import { CreatureSizeName } from 'src/libs/shared/util/creatureUtils';
import { CreaturePropertiesService } from 'src/libs/shared/services/creature-properties/creature-properties.service';
import { DeityDomainsService } from 'src/libs/shared/services/deity-domains/deity-domains.service';

@Component({
    selector: 'app-general',
    templateUrl: './general.component.html',
    styleUrls: ['./general.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeneralComponent implements OnInit, OnDestroy {

    @Input()
    public creature: CreatureTypes = CreatureTypes.Character;
    @Input()
    public showMinimizeButton = true;

    public creatureTypesEnum = CreatureTypes;

    private _changeSubscription: Subscription;
    private _viewChangeSubscription: Subscription;

    constructor(
        private readonly _changeDetector: ChangeDetectorRef,
        private readonly _characterService: CharacterService,
        private readonly _refreshService: RefreshService,
        private readonly _effectsService: EffectsService,
        private readonly _traitsService: TraitsService,
        private readonly _familiarsService: FamiliarsService,
        private readonly _deitiesService: DeitiesService,
        private readonly _classesService: ClassesService,
        private readonly _itemsService: ItemsService,
        private readonly _creaturePropertiesService: CreaturePropertiesService,
        private readonly _deityDomainsService: DeityDomainsService,
        public trackers: Trackers,
    ) { }

    public get isMinimized(): boolean {
        switch (this.creature) {
            case CreatureTypes.AnimalCompanion:
                return this._characterService.character.settings.companionMinimized;
            case CreatureTypes.Familiar:
                return this._characterService.character.settings.familiarMinimized;
            default:
                return this._characterService.character.settings.generalMinimized;
        }
    }

    public get stillLoading(): boolean {
        return this._characterService.stillLoading;
    }

    public get character(): Character {
        return this._characterService.character;
    }

    public get companion(): AnimalCompanion {
        return this._characterService.companion;
    }

    public get familiar(): Familiar {
        return this._characterService.familiar;
    }

    private get _currentCreature(): Creature {
        return this._characterService.creatureFromType(this.creature);
    }

    public minimize(): void {
        this._characterService.character.settings.generalMinimized = !this._characterService.character.settings.generalMinimized;
    }

    public familiarAbilityFromName(name: string): Feat {
        return this._familiarsService.familiarAbilityFromName(name);
    }

    public companionSpecies(): string {
        const companion: AnimalCompanion = this.companion;

        if (companion.level && companion.class.levels.length) {
            let species: string = companion.class.levels[companion.level].name;

            if (companion.species) {
                species += ` ${ companion.species }`;
            } else if (companion.class.ancestry && companion.class.ancestry.name) {
                species += ` ${ companion.class.ancestry.name }`;
            }

            return species;
        }
    }

    public companionSpecializations(): string {
        const companion: AnimalCompanion = this.companion;

        if (companion.level && companion.class.specializations.length) {
            return companion.class.specializations.filter(spec => spec.level <= this.character.level).map(spec => spec.name)
                .join(', ');
        }
    }

    public incHeroPoints(amount: number): void {
        this.character.heroPoints += amount;
    }

    public creatureSize(): string {
        return CreatureSizeName(this._creaturePropertiesService.effectiveSize(this._currentCreature));
    }

    public domains(): Array<Domain> {
        const character = this.character;
        const isArchetypesDeityFocused =
            this._archetypeFeats().some(feat => this._classesService.classFromName(feat.archetype).deityFocused);

        if (character.class.deityFocused || isArchetypesDeityFocused) {
            const deity = this._characterService.currentCharacterDeities(character)[0];

            if (deity) {
                const domainFeats = this._characterService.characterFeatsAndFeatures()
                    .filter(feat =>
                        feat.gainDomains?.length &&
                        feat.have({ creature: character }, { characterService: this._characterService }),
                    );
                const domains = this._deityDomainsService.effectiveDomains(deity, character)
                    .concat(...(domainFeats.map(feat => feat.gainDomains)));

                return domains.map(domain => this._deitiesService.domains(domain)[0] || new Domain());
            } else {
                return [];
            }
        } else {
            return [];
        }
    }

    public tenets(): Array<string> {
        const character = this.character;

        //Collect tenets from all feats and features you have that include them.
        return [].concat(...this._characterService.characterFeatsAndFeatures()
            .filter(feat => feat.tenets?.length && feat.have({ creature: character }, { characterService: this._characterService }))
            .map(feat => feat.tenets),
        );
    }

    public edicts(): Array<string> {
        const character = this.character;
        const doArchetypesShowDeityEdicts =
            this._archetypeFeats().some(feat => this._classesService.classFromName(feat.archetype).showDeityEdicts);

        if (character.class.showDeityEdicts || doArchetypesShowDeityEdicts) {
            //Collect edicts from all deities you have (usually one);
            const deityEdicts: Array<string> = [];

            this._characterService.currentCharacterDeities(character).forEach(deity => {
                deityEdicts.push(...deity.edicts.map(edict => edict[0].toUpperCase() + edict.substr(1)));
            });

            return deityEdicts;
        } else {
            return [];
        }
    }

    public anathema(): Array<string> {
        const character = this.character;

        const deityAnathema: Array<string> = [];
        const doArchetypesShowDeityAnathema =
            this._archetypeFeats().some(feat => this._classesService.classFromName(feat.archetype).showDeityAnathema);

        if (character.class.showDeityAnathema || doArchetypesShowDeityAnathema) {
            //If your Collect anathema from all deities you have (usually one);
            this._characterService.currentCharacterDeities(character).forEach(deity => {
                deityAnathema.push(...deity.anathema.map(anathema => anathema[0].toUpperCase() + anathema.substr(1)));
            });
        }

        //Add anathema from all feats and features you have that include them.
        return character.class.anathema.concat(...this._characterService.characterFeatsAndFeatures()
            .filter(feat => feat.anathema?.length && feat.have({ creature: character }, { characterService: this._characterService }))
            .map(feat => feat.anathema.map(anathema => anathema[0].toUpperCase() + anathema.substr(1))))
            .concat((deityAnathema));
    }

    public languages(): string {
        return this.character.class.languages
            .filter(language => (!language.level || language.level <= this.character.level) && language.name)
            .map(language => language.name)
            .concat(this._languagesFromEquipment())
            .sort()
            .join(', ');
    }

    public differentWorldsData(): Array<FeatData> {
        const character = this.character;

        if (this._characterService.characterFeatsTaken(1, character.level, { featName: 'Different Worlds' }).length) {
            return character.class.filteredFeatData(0, character.level, 'Different Worlds');
        }
    }

    public classChoices(): Array<{ name: string; choice: string; subChoice: boolean }> {
        //Get the basic class choices for your class and all archetypes.
        // These decisions are feat choices identified by
        // - being .specialChoice==true
        // - having exactly one feat
        // - and having the class name (or the dedication feat name) as its source.
        const results: Array<{ name: string; choice: string; subChoice: boolean }> = [];
        const character = this.character;
        const featChoices: Array<FeatChoice> = [];
        const className = character.class?.name || '';

        if (className) {
            results.push({ name: 'Class', choice: className, subChoice: false });
            character.class.levels.forEach(level => {
                featChoices.push(...level.featChoices.filter(choice =>
                    choice.specialChoice &&
                    !choice.autoSelectIfPossible &&
                    choice.feats.length === 1 &&
                    choice.available === 1,
                ));
            });
            //Find specialchoices that have this class as their source.
            featChoices.filter(choice => choice.source === className).forEach(choice => {
                let choiceName = choice.feats[0].name;

                if (choiceName.includes(choice.type)) {
                    choiceName = choiceName.replace(`${ choice.type }: `, '').replace(` ${ choice.type }`, '');
                }

                results.push({ name: choice.type, choice: choiceName, subChoice: true });
            });
            //Archetypes are identified by you having a dedication feat.
            this._archetypeFeats().forEach(archetype => {
                results.push({ name: 'Archetype', choice: archetype.archetype, subChoice: false });
                //Find specialchoices that have this dedication feat as their source.
                featChoices.filter(choice => choice.source === `Feat: ${ archetype.name }`).forEach(choice => {
                    const choiceName = choice.feats[0].name;

                    results.push({ name: choice.type, choice: choiceName, subChoice: true });
                });
            });
        }

        return results;
    }

    public characterTraits(): Array<string> {
        const character = this.character;
        let traits: Array<string> = JSON.parse(JSON.stringify(character.class.ancestry.traits));

        //Verdant Metamorphosis adds the Plant trait and removes the Humanoid, Animal or Fungus trait.
        if (this._characterService.characterFeatsTaken(1, character.level, { featName: 'Verdant Metamorphosis' }).length) {
            traits = ['Plant'].concat(traits.filter(trait => !['Humanoid', 'Animal', 'Fungus'].includes(trait)));
        }

        this._effectsService.toggledEffectsOnThese(character, ['Character Gain Trait', 'Character Lose Trait'])
            .filter(effect => effect.title)
            .forEach(effect => {
                if (effect.target.toLowerCase().includes('gain trait')) {
                    traits.push(effect.title);
                } else if (effect.target.toLowerCase().includes('lose trait')) {
                    traits = traits.filter(trait => trait !== effect.title);
                }
            });

        return traits.sort();
    }

    public traitFromName(name: string): Trait {
        return this._traitsService.traitFromName(name);
    }

    public ngOnInit(): void {
        this._changeSubscription = this._refreshService.componentChanged$
            .subscribe(target => {
                if (['general', 'all', this.creature.toLowerCase()].includes(target.toLowerCase())) {
                    this._changeDetector.detectChanges();
                }
            });
        this._viewChangeSubscription = this._refreshService.detailChanged$
            .subscribe(view => {
                if (view.creature.toLowerCase() === this.creature.toLowerCase() && ['general', 'all'].includes(view.target.toLowerCase())) {
                    this._changeDetector.detectChanges();
                }
            });
    }

    public ngOnDestroy(): void {
        this._changeSubscription?.unsubscribe();
        this._viewChangeSubscription?.unsubscribe();
    }

    private _archetypeFeats(): Array<Feat> {
        return this._characterService.characterFeatsAndFeatures()
            .filter(feat =>
                feat.traits.includes('Dedication') &&
                feat.have({ creature: this.character }, { characterService: this._characterService }),
            );
    }

    private _languagesFromEquipment(): Array<string> {
        let languages: Array<string> = [];
        const hasTooManySlottedAeonStones = this._itemsService.hasTooManySlottedAeonStones(this.character);

        this.character.inventories[0].wornitems.filter(wornItem => wornItem.investedOrEquipped()).forEach(wornItem => {
            languages = languages.concat(wornItem.gainLanguages.filter(language => language.name).map(language => language.name));

            if (!hasTooManySlottedAeonStones) {
                wornItem.aeonStones.forEach(stone => {
                    languages = languages.concat(stone.gainLanguages.filter(language => language.name).map(language => language.name));
                });
            }
        });

        return languages;
    }

}
