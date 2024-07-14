import { Component, ChangeDetectionStrategy, OnInit, OnDestroy, ChangeDetectorRef, Input } from '@angular/core';
import { Observable, Subscription, switchMap, distinctUntilChanged, map, shareReplay, combineLatest, of } from 'rxjs';
import { Character } from 'src/app/classes/creatures/character/character';
import { Creature } from 'src/app/classes/creatures/creature';
import { Domain } from 'src/app/classes/deities/domain';
import { Trait } from 'src/app/classes/hints/trait';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { Feat } from 'src/libs/shared/definitions/models/Feat';
import { FeatChoice } from 'src/libs/shared/definitions/models/FeatChoice';
import { FeatData } from 'src/libs/shared/definitions/models/FeatData';
import { CharacterDeitiesService } from 'src/libs/shared/services/character-deities/character-deities.service';
import { CharacterFeatsService } from 'src/libs/shared/services/character-feats/character-feats.service';
import { CharacterFlatteningService } from 'src/libs/shared/services/character-flattening/character-flattening.service';
import { CreatureEffectsService } from 'src/libs/shared/services/creature-effects/creature-effects.service';
import { CreaturePropertiesService } from 'src/libs/shared/services/creature-properties/creature-properties.service';
import { CreatureService } from 'src/libs/shared/services/creature/creature.service';
import { ClassesDataService } from 'src/libs/shared/services/data/classes-data.service';
import { DeitiesDataService } from 'src/libs/shared/services/data/deities-data.service';
import { FamiliarsDataService } from 'src/libs/shared/services/data/familiars-data.service';
import { TraitsDataService } from 'src/libs/shared/services/data/traits-data.service';
import { DeityDomainsService } from 'src/libs/shared/services/deity-domains/deity-domains.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { SettingsService } from 'src/libs/shared/services/settings/settings.service';
import { BaseCreatureElementComponent } from 'src/libs/shared/util/components/base-creature-element/base-creature-element.component';
import { creatureSizeName } from 'src/libs/shared/util/creatureUtils';
import { TrackByMixin } from 'src/libs/shared/util/mixins/track-by-mixin';
import { propMap$ } from 'src/libs/shared/util/observableUtils';
import { stringsIncludeCaseInsensitive, stringEqualsCaseInsensitive, capitalize } from 'src/libs/shared/util/stringUtils';

interface ClassChoice {
    name: string;
    choice: string;
    subChoice: boolean;
}

@Component({
    selector: 'app-general',
    templateUrl: './general.component.html',
    styleUrls: ['./general.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeneralComponent extends TrackByMixin(BaseCreatureElementComponent) implements OnInit, OnDestroy {

    public creatureTypes = CreatureTypes;

    public isMinimized$: Observable<boolean>;
    public character$: Observable<Character>;
    public companionSpecies$: Observable<string | undefined>;
    public companionSpecializations$: Observable<string | undefined>;
    public creatureSize$: Observable<string>;
    public domains$: Observable<Array<Domain>>;
    public tenets$: Observable<Array<string>>;
    public edicts$: Observable<Array<string>>;
    public anathemas$: Observable<Array<string>>;
    public differentWorldsData$: Observable<Array<FeatData> | undefined>;
    public classChoices$: Observable<Array<ClassChoice>>;
    public characterTraits$: Observable<Array<Trait>>;
    public companionTraits$: Observable<Array<Trait>>;
    public familiarTraits$: Observable<Array<Trait>>;
    public familiarAbilities$: Observable<Array<{ ability: Feat; traits: Array<Trait> }>>;

    private _changeSubscription?: Subscription;
    private _viewChangeSubscription?: Subscription;
    private readonly _archetypeFeats$: Observable<Array<Feat>>;

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
        private readonly _characterDeitiesService: CharacterDeitiesService,
        private readonly _characterFeatsService: CharacterFeatsService,
    ) {
        super();

        this.isMinimized$ = this.creature$
            .pipe(
                switchMap(creature => SettingsService.settings$
                    .pipe(
                        switchMap(settings => {
                            switch (creature.type) {
                                case CreatureTypes.AnimalCompanion:
                                    return settings.companionMinimized$;
                                case CreatureTypes.Familiar:
                                    return settings.familiarMinimized$;
                                default:
                                    return settings.generalMinimized$;
                            }
                        }),
                    ),
                ),
                distinctUntilChanged(),
            );

        this._archetypeFeats$ = this._characterFeatsService.characterFeatsAtLevel$()
            .pipe(
                map(feats => feats.filter(feat =>
                    feat.traits.includes('Dedication'),
                )),
                shareReplay({ refCount: true, bufferSize: 1 }),
            );

        this.character$ = CreatureService.character$;
        this.companionSpecies$ = this._companionSpecies$();
        this.companionSpecializations$ = this._companionSpecializations$();
        this.companionTraits$ = this._companionTraits$();
        this.creatureSize$ = this._creatureSize$();
        this.domains$ = this._domains$();
        this.familiarAbilities$ = this._familiarAbilities$();
        this.familiarTraits$ = this._familiarTraits$();
        this.tenets$ = this._tenets$();
        this.edicts$ = this._edicts$();
        this.anathemas$ = this._anathemas$();
        this.differentWorldsData$ = this._differentWorldsData$();
        this.classChoices$ = this._classChoices$();
        this.characterTraits$ = this._characterTraits$();
    }

    public get creature(): Creature {
        return super.creature;
    }

    @Input()
    public set creature(creature: Creature) {
        this._updateCreature(creature);
    }

    public get shouldShowMinimizeButton(): boolean {
        return this.creature.isCharacter();
    }

    public toggleMinimized(minimized: boolean): void {
        SettingsService.settings.generalMinimized = minimized;
    }

    public incHeroPoints(amount: number): void {
        CreatureService.character.heroPoints += amount;
    }

    public familiarAbilityFromName(name: string): Feat {
        return this._familiarsDataService.familiarAbilityFromName(name);
    }

    public ngOnInit(): void {
        this._changeSubscription = this._refreshService.componentChanged$
            .subscribe(target => {
                if (stringsIncludeCaseInsensitive(['general', 'all', this.creature.type], target)) {
                    this._changeDetector.detectChanges();
                }
            });
        this._viewChangeSubscription = this._refreshService.detailChanged$
            .subscribe(view => {
                if (
                    stringEqualsCaseInsensitive(view.creature, this.creature.type)
                    && stringsIncludeCaseInsensitive(['general', 'all'], view.target)
                ) {
                    this._changeDetector.detectChanges();
                }
            });
    }

    public ngOnDestroy(): void {
        this._changeSubscription?.unsubscribe();
        this._viewChangeSubscription?.unsubscribe();
    }

    //TODO: Pretty sure this should be async.
    public languages(): string {
        return CreatureService.character.class.languages
            .filter(language => (!language.level || language.level <= CreatureService.character.level) && language.name)
            .map(language => language.name)
            .concat(this._languagesFromEquipment())
            .sort()
            .join(', ');
    }

    private _companionSpecies$(): Observable<string | undefined> {
        return CreatureService.companion$
            .pipe(
                switchMap(companion => combineLatest([
                    companion.level$,
                    companion.species$,
                    propMap$(companion.class$, 'levels', 'values$'),
                    propMap$(companion.class$, 'ancestry$'),
                ])
                    .pipe(
                        map(([level, species, levels, ancestry]) => {
                            if (level && levels.length) {
                                // Start with 'Young', 'Mature' etc.
                                const parts: Array<string> = [levels[level].name];

                                if (species) {
                                    // If the species is named, add the species.
                                    parts.push(species);
                                } else if (ancestry && ancestry.name) {
                                    // Otherwise add the type of animal (i.e. the ancestry).
                                    parts.push(ancestry.name);
                                }

                                return parts.join(' ');
                            }

                            return undefined;
                        }),
                    ),

                ),
            );
    }

    private _companionSpecializations$(): Observable<string | undefined> {
        return CreatureService.companion$
            .pipe(
                switchMap(companion => combineLatest([
                    CharacterFlatteningService.characterLevel$,
                    companion.level$,
                    propMap$(companion.class$, 'specializations', 'values$'),
                ])
                    .pipe(
                        map(([characterLevel, companionLevel, specializations]) => {
                            if (companionLevel && specializations.length) {
                                return specializations
                                    .filter(spec => spec.level <= characterLevel)
                                    .map(spec => spec.name)
                                    .join(', ');
                            }

                            return undefined;
                        }),
                    ),
                ),
            );
    }

    private _companionTraits$(): Observable<Array<Trait>> {
        return propMap$(CreatureService.companion$, 'class$', 'ancestry$')
            .pipe(
                map(ancestry => ancestry.traits),
                map(traits => traits.map(traitName => this._traitsDataService.traitFromName(traitName))),
            );
    }

    private _familiarAbilities$(): typeof this.familiarAbilities$ {
        return CreatureService.familiar$
            .pipe(
                map(familiar => familiar.abilities.feats.map(taken => this.familiarAbilityFromName(taken.name))),
                map(abilities => abilities.map(ability => ({
                    ability,
                    traits: ability.traits.map(traitName => this._traitsDataService.traitFromName(traitName)),
                }))),
            );
    }

    private _familiarTraits$(): Observable<Array<Trait>> {
        return CreatureService.familiar$
            .pipe(
                map(familiar => familiar.traits),
                map(traits => traits.map(traitName => this._traitsDataService.traitFromName(traitName))),
            );
    }

    private _creatureSize$(): Observable<string> {
        return this.creature$
            .pipe(
                switchMap(creature =>
                    this._creaturePropertiesService.effectiveSize$(creature),
                ),
                map(size => creatureSizeName(size)),
            );
    }

    private _domains$(): Observable<Array<Domain>> {
        return combineLatest([
            CharacterFlatteningService.characterClass$,
            this._archetypeFeats$,
        ])
            .pipe(
                switchMap(([characterClass, archetypeFeats]) =>
                    // If your class is deity-focused or you have any feat that toggles it,
                    // collect domains from your deity and all your feats that include them.
                    (
                        characterClass.deityFocused
                        || archetypeFeats.some(feat => this._classesDataService.classFromName(feat.archetype).deityFocused)
                    )
                        ? this._deityDomainsService.effectiveMainDomains$
                        : of(null),
                ),
                switchMap(deityDomains =>
                    deityDomains
                        ? this._characterFeatsService.characterFeatsAtLevel$()
                            .pipe(
                                map(feats =>
                                    feats
                                        .filter(feat =>
                                            feat.gainDomains?.length,
                                        )
                                        .map(feat => feat.gainDomains),
                                ),
                                map(domainLists => deityDomains.concat(...domainLists)),
                                map(domains => domains.map(domain => this._deitiesDataService.domains(domain)[0] || new Domain())),
                            )
                        : [],
                ),
            );
    }

    private _tenets$(): Observable<Array<string>> {
        //Collect tenets from all feats and features you have that include them.
        return this._characterFeatsService.characterFeatsAtLevel$()
            .pipe(
                map(feats => feats
                    .filter(feat => feat.tenets?.length)
                    .map(feat => feat.tenets),
                ),
                map(tenetLists => new Array<string>().concat(...tenetLists)),
            );
    }

    private _edicts$(): Observable<Array<string>> {
        return combineLatest([
            CharacterFlatteningService.characterClass$,
            this._archetypeFeats$,
        ])
            .pipe(
                switchMap(([characterClass, archetypeFeats]) =>
                    // If your class should show edicts or you have any feat that toggles it,
                    // collect anathema from all your deities.
                    (
                        characterClass.showDeityEdicts
                        || archetypeFeats.some(feat => this._classesDataService.classFromName(feat.archetype).showDeityEdicts)
                    )
                        ? this._characterDeitiesService.currentCharacterDeities$()
                        : of([]),
                ),
                map(deities => new Array<string>()
                    .concat(...deities.map(deity => deity.edicts.map(edict => capitalize(edict))))),
            );
    }

    private _anathemas$(): Observable<Array<string>> {
        return combineLatest([
            CharacterFlatteningService.characterClass$,
            this._archetypeFeats$,
        ])
            .pipe(
                switchMap(([characterClass, archetypeFeats]) =>
                    // If your class should show anathema or you have any feat that toggles it,
                    // collect anathema from all your deities and all your feats that include them.
                    (
                        characterClass.showDeityAnathema
                        || archetypeFeats.some(feat => this._classesDataService.classFromName(feat.archetype).showDeityAnathema)
                    )
                        ? combineLatest([
                            this._characterDeitiesService.currentCharacterDeities$(),
                            this._characterFeatsService.characterFeatsAtLevel$()
                                .pipe(
                                    map(feats => feats.filter(feat => feat.anathema?.length)),
                                ),
                        ])
                        : of([[], []]),
                ),
                map(([deities, feats]) => new Array<string>()
                    .concat(
                        ...deities.map(deity => deity.anathema.map(anathema => capitalize(anathema))),
                        ...feats.map(deity => deity.anathema.map(anathema => capitalize(anathema))),
                    ),
                ),
            );
    }

    private _differentWorldsData$(): Observable<Array<FeatData> | undefined> {
        return this._characterFeatsService.characterHasFeatAtLevel$('Different Worlds')
            .pipe(
                switchMap(hasDifferentWorlds =>
                    hasDifferentWorlds
                        ? combineLatest([
                            CharacterFlatteningService.characterClass$,
                            CharacterFlatteningService.characterLevel$,
                        ])
                            .pipe(
                                switchMap(([characterClass, level]) => characterClass.filteredFeatData$(0, level, 'Different Worlds')),
                            )
                        : of(undefined),
                ),
            );
    }

    private _classChoices$(): Observable<Array<ClassChoice>> {
        //Get the basic class choices for your class and all archetypes.
        // These decisions are feat choices identified by
        // - having specialChoice set to true
        // - having exactly one feat
        // - and having the class name (or the dedication feat name) as its source.
        return combineLatest([
            CharacterFlatteningService.characterClass$,
            CharacterFlatteningService.characterLevel$,
            this._archetypeFeats$,
        ])
            .pipe(
                map(([characterClass, characterLevel, archetypeFeats]) => {
                    if (characterClass.name) {
                        const featChoices: Array<FeatChoice> =
                            new Array<FeatChoice>()
                                .concat(...characterClass.levels
                                    .filter(level => level.number <= characterLevel)
                                    .map(level =>
                                        level.featChoices.filter(choice =>
                                            choice.specialChoice &&
                                            !choice.autoSelectIfPossible &&
                                            choice.feats.length === 1 &&
                                            choice.available === 1,
                                        ),
                                    ),
                                );

                        // Collect specialchoices that have this class as their source.
                        return featChoices
                            .filter(choice => choice.source === characterClass.name)
                            .map(choice => {
                                let choiceName = choice.feats[0].name;

                                if (choiceName.includes(choice.type)) {
                                    choiceName = choiceName.replace(`${ choice.type }: `, '').replace(` ${ choice.type }`, '');
                                }

                                return { name: choice.type, choice: choiceName, subChoice: true };
                            })
                            .concat(
                                // Add dedication feats and specialchoices that have one of these feats as their source.
                                ...archetypeFeats.map(archetypeFeat =>
                                    [{ name: 'Archetype', choice: archetypeFeat.archetype, subChoice: false }]
                                        .concat(
                                            ...featChoices
                                                .filter(choice => choice.source === `Feat: ${ archetypeFeat.name }`)
                                                .map(choice => ({ name: choice.type, choice: choice.feats[0].name, subChoice: true })),
                                        ),
                                ),
                            );
                    }

                    return [];
                }),
            );
    }

    private _characterTraits$(): Observable<Array<Trait>> {
        return combineLatest([
            propMap$(CharacterFlatteningService.characterClass$, 'ancestry$', 'traits', 'values$'),
            this._characterFeatsService.characterHasFeatAtLevel$('Verdant Metamorphosis'),
            this._creatureEffectsService.toggledEffectsOnThis$(CreatureService.character, 'Character Gain Trait'),
            this._creatureEffectsService.toggledEffectsOnThis$(CreatureService.character, 'Character Lose Trait'),
        ])
            .pipe(
                map(([ancestryTraits, hasVerdantMetamorphosis, gainTraitEffects, loseTraitEffects]) => {
                    let traits = new Array<string>(...ancestryTraits);

                    //Verdant Metamorphosis adds the Plant trait and removes the Humanoid, Animal or Fungus trait.
                    if (hasVerdantMetamorphosis) {
                        traits = ['Plant'].concat(traits.filter(trait => !['Humanoid', 'Animal', 'Fungus'].includes(trait)));
                    }

                    gainTraitEffects.forEach(effect => {
                        traits.push(effect.title);
                    });

                    loseTraitEffects.forEach(effect => {
                        traits = traits.filter(trait => trait !== effect.title);
                    });

                    return traits.sort();
                }),
                map(traits => traits.map(traitName => this._traitsDataService.traitFromName(traitName))),
            );
    }

    private _languagesFromEquipment(): Array<string> {
        let languages: Array<string> = [];
        const hasTooManySlottedAeonStones = CreatureService.character.hasTooManySlottedAeonStones();

        CreatureService.character.inventories[0].wornitems.filter(wornItem => wornItem.investedOrEquipped()).forEach(wornItem => {
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
