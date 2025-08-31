import { Component, ChangeDetectionStrategy, computed, Signal, input } from '@angular/core';
import { CharacterSheetBaseComponent } from '../character-sheet-base/character-sheet-base.component';
import { ButtonComponent } from 'src/libs/shared/ui/button/components/button/button.component';
import { CharacterSheetCardComponent } from 'src/libs/shared/ui/character-sheet-card/character-sheet-card.component';

type ComponentReference =
    'abilities' |
    'activities' |
    'attacks' |
    'defense' |
    'generalLower' |
    'generalUpper' |
    'health' |
    'inventory' |
    'skills' |
    'spellbookLower' |
    'spellbookUpper';

type Modes = 'All' | 'Encounter' | 'Exploration' | 'Downtime' | 'Inventory' | 'ConditionsEffects';

type ColumnLayout = Record<Modes, Partial<Record<ComponentReference, true>>>;

const columnLayouts: [ColumnLayout, ColumnLayout] = [
    {
        All: {
            generalUpper: true,
            health: true,
            abilities: true,
            skills: true,
            activities: true,
        },
        Encounter: {
            defense: true,
            health: true,
            generalLower: true,
            abilities: true,
            skills: true,
            activities: true,
        },
        Exploration: {
            generalUpper: true,
            health: true,
            abilities: true,
        },
        Downtime: {
            generalUpper: true,
            health: true,
            abilities: true,
            spellbookLower: true,
        },
        Inventory: {
            inventory: true,
        },
        ConditionsEffects: {},
    },
    {
        All: {
            defense: true,
            attacks: true,
            spellbookUpper: true,
            inventory: true,
        },
        Encounter: {
            attacks: true,
            spellbookUpper: true,
        },
        Exploration: {
            skills: true,
            spellbookLower: true,
        },
        Downtime: {
            skills: true,
            activities: true,
        },
        Inventory: {
            defense: true,
            attacks: true,
            activities: true,
        },
        ConditionsEffects: {},
    },
];

@Component({
    selector: 'app-character-sheet-desktop',
    templateUrl: './character-sheet-desktop.component.html',
    styleUrls: ['./character-sheet-desktop.component.scss', '../character-sheet-base/character-sheet-base.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CharacterSheetCardComponent,
        ButtonComponent,
    ],
})
export class CharacterSheetDesktopComponent extends CharacterSheetBaseComponent<Modes> {
    public readonly attacksAndSpellsOrder$$ = input.required<Record<string, number>>({ alias: 'attacksAndSpellsOrder' });

    public readonly currentLayouts$$: Signal<[
        Partial<Record<ComponentReference, true>>,
        Partial<Record<ComponentReference, true>>
    ]> = computed(() => {
        const currentMode = this.shownMode$$();

        return [
            columnLayouts[0][currentMode],
            columnLayouts[1][currentMode],
        ];
    });

}
