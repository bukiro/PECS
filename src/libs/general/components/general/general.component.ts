import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, Input, OnDestroy } from '@angular/core';
import { CreatureService } from 'src/libs/shared/services/character/character.service';
import { CreatureEffectsService } from 'src/libs/shared/services/creature-effects/creature-effects.service';
import { TraitsDataService } from 'src/libs/shared/services/data/traits-data.service';
import { AnimalCompanion } from 'src/app/classes/AnimalCompanion';
import { FamiliarsDataService } from 'src/libs/shared/services/data/familiars-data.service';
import { FeatChoice } from 'src/libs/shared/definitions/models/FeatChoice';
import { DeitiesDataService } from 'src/libs/shared/services/data/deities-data.service';
import { Domain } from 'src/app/classes/Domain';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { Subscription } from 'rxjs';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { Character } from 'src/app/classes/Character';
import { Creature } from 'src/app/classes/Creature';
import { Familiar } from 'src/app/classes/Familiar';
import { Feat } from 'src/libs/shared/definitions/models/Feat';
import { Trait } from 'src/app/classes/Trait';
import { CreatureSizeName } from 'src/libs/shared/util/creatureUtils';
import { CreaturePropertiesService } from 'src/libs/shared/services/creature-properties/creature-properties.service';
import { DeityDomainsService } from 'src/libs/shared/services/deity-domains/deity-domains.service';
import { ClassesDataService } from 'src/libs/shared/services/data/classes-data.service';
import { CreatureEquipmentService } from 'src/libs/shared/services/creature-equipment/creature-equipment.service';
import { CharacterDeitiesService } from 'src/libs/shared/services/character-deities/character-deities.service';
import { CharacterFeatsService } from 'src/libs/shared/services/character-feats/character-feats.service';
import { StatusService } from 'src/libs/shared/services/status/status.service';
import { FeatData } from 'src/libs/shared/definitions/models/FeatData';
import { BaseClass } from 'src/libs/shared/util/mixins/base-class';
import { TrackByMixin } from 'src/libs/shared/util/mixins/trackers-mixin';

@Component({
    selector: 'app-general',
    templateUrl: './general.component.html',
    styleUrls: ['./general.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeneralComponent extends TrackByMixin(BaseClass) implements OnInit, OnDestroy {

    @Input()
    public creature: CreatureTypes = CreatureTypes.Character;
    @Input()
    public showMinimizeButton = true;

    public creatureTypesEnum = CreatureTypes;

    private _changeSubscription?: Subscription;
    private _viewChangeSubscription?: Subscription;

    constructor(
        private readonly _changeDetector: ChangeDetectorRef,
        private readonly _refreshService: RefreshService,
        private readonly _creatureEffectsService: CreatureEffectsService,
        private readonly _traitsDataService: TraitsDataService,
        private readonly _familiarsDataService: FamiliarsDataService,
        private readonly _deitiesDataService: DeitiesDataService,
        private readonly _classesDataService: ClassesDataService,
        private readonly _creaturePropertiesService: CreaturePropertiesService,
        private readonly _deityDomainsService: DeityDomainsService,
        private readonly _creatureEquipmentService: CreatureEquipmentService,
        private readonly _characterDeitiesService: CharacterDeitiesService,
        private readonly _characterFeatsService: CharacterFeatsService,
    ) {
        super();
    }

    public get isMinimized(): boolean {
        switch (this.creature) {
            case CreatureTypes.AnimalCompanion:
                return CreatureService.character.settings.companionMinimized;
            case CreatureTypes.Familiar:
                return CreatureService.character.settings.familiarMinimized;
            default:
                return CreatureService.character.settings.generalMinimized;
        }
    }

    public get stillLoading(): boolean {
        return StatusService.isLoadingCharacter;
    }

    public get character(): Character {
        return CreatureService.character;
    }

    public get companion(): AnimalCompanion {
        return CreatureService.companion;
    }

    public get familiar(): Familiar {
        return CreatureService.familiar;
    }

    private get _currentCreature(): Creature {
        return CreatureService.creatureFromType(this.creature);
    }

    public minimize(): void {
        CreatureService.character.settings.generalMinimized = !CreatureService.character.settings.generalMinimized;
    }

    public familiarAbilityFromName(name: string): Feat {
        return this._familiarsDataService.familiarAbilityFromName(name);
    }

    public companionSpecies(): string | undefined {
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

    public companionSpecializations(): string | undefined {
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
            this._archetypeFeats().some(feat => this._classesDataService.classFromName(feat.archetype).deityFocused);

        if (character.class.deityFocused || isArchetypesDeityFocused) {
            const deity = this._characterDeitiesService.currentCharacterDeities()[0];

            if (deity) {
                const domainFeats = this._characterFeatsService.characterFeatsAndFeatures()
                    .filter(feat =>
                        feat.gainDomains?.length &&
                        this._characterFeatsService.characterHasFeat(feat.name),
                    );
                const domains = this._deityDomainsService.effectiveDomains(deity)
                    .concat(...(domainFeats.map(feat => feat.gainDomains)));

                return domains.map(domain => this._deitiesDataService.domains(domain)[0] || new Domain());
            } else {
                return [];
            }
        } else {
            return [];
        }
    }

    public tenets(): Array<string> {
        //Collect tenets from all feats and features you have that include them.
        return new Array<string>()
            .concat(...this._characterFeatsService.characterFeatsAndFeatures()
                .filter(feat => feat.tenets?.length && this._characterFeatsService.characterHasFeat(feat.name))
                .map(feat => feat.tenets),
            );
    }

    public edicts(): Array<string> {
        const character = this.character;
        const doArchetypesShowDeityEdicts =
            this._archetypeFeats().some(feat => this._classesDataService.classFromName(feat.archetype).showDeityEdicts);

        if (character.class.showDeityEdicts || doArchetypesShowDeityEdicts) {
            //Collect edicts from all deities you have (usually one);
            const deityEdicts: Array<string> = [];

            this._characterDeitiesService.currentCharacterDeities().forEach(deity => {
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
            this._archetypeFeats().some(feat => this._classesDataService.classFromName(feat.archetype).showDeityAnathema);

        if (character.class.showDeityAnathema || doArchetypesShowDeityAnathema) {
            //If your Collect anathema from all deities you have (usually one);
            this._characterDeitiesService.currentCharacterDeities().forEach(deity => {
                deityAnathema.push(...deity.anathema.map(anathema => anathema[0].toUpperCase() + anathema.substr(1)));
            });
        }

        //Add anathema from all feats and features you have that include them.
        return character.class.anathema.concat(...this._characterFeatsService.characterFeatsAndFeatures()
            .filter(feat => feat.anathema?.length && this._characterFeatsService.characterHasFeat(feat.name))
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

    public differentWorldsData(): Array<FeatData> | undefined {
        const character = this.character;

        if (this._characterFeatsService.characterFeatsTaken(1, character.level, { featName: 'Different Worlds' }).length) {
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
        if (this._characterFeatsService.characterFeatsTaken(1, character.level, { featName: 'Verdant Metamorphosis' }).length) {
            traits = ['Plant'].concat(traits.filter(trait => !['Humanoid', 'Animal', 'Fungus'].includes(trait)));
        }

        this._creatureEffectsService.toggledEffectsOnThese(character, ['Character Gain Trait', 'Character Lose Trait'])
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
        return this._traitsDataService.traitFromName(name);
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
        return this._characterFeatsService.characterFeatsAndFeatures()
            .filter(feat =>
                feat.traits.includes('Dedication') &&
                this._characterFeatsService.characterHasFeat(feat.name),
            );
    }

    private _languagesFromEquipment(): Array<string> {
        let languages: Array<string> = [];
        const hasTooManySlottedAeonStones = this.character.hasTooManySlottedAeonStones();

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
