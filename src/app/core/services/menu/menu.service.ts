import { Injectable } from '@angular/core';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { MenuNames } from 'src/libs/shared/definitions/menuNames';
import { MenuState } from 'src/libs/shared/definitions/Types/menuState';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { AppStateService } from '../app-state/app-state.service';

@Injectable({
    providedIn: 'root',
})
export class MenuService {

    private readonly _menuState = {
        [MenuNames.ItemsMenu]: 'out' as MenuState,
        [MenuNames.CraftingMenu]: 'out' as MenuState,
        [MenuNames.CharacterMenu]: 'in' as MenuState,
        [MenuNames.CompanionMenu]: 'out' as MenuState,
        [MenuNames.FamiliarMenu]: 'out' as MenuState,
        [MenuNames.SpellsMenu]: 'out' as MenuState,
        [MenuNames.SpellLibraryMenu]: 'out' as MenuState,
        [MenuNames.ConditionsMenu]: 'out' as MenuState,
        [MenuNames.DiceMenu]: 'out' as MenuState,
    };

    private readonly _menuMatchingComponent = {
        [MenuNames.ItemsMenu]: 'items',
        [MenuNames.CraftingMenu]: 'crafting',
        [MenuNames.CharacterMenu]: 'charactersheet',
        [MenuNames.CompanionMenu]: 'companion',
        [MenuNames.FamiliarMenu]: 'familiar',
        [MenuNames.SpellsMenu]: 'spells',
        [MenuNames.SpellLibraryMenu]: 'spelllibrary',
        [MenuNames.ConditionsMenu]: 'conditions',
        [MenuNames.DiceMenu]: 'dice',
    };

    private _itemsMenuTarget: CreatureTypes = CreatureTypes.Character;

    constructor(
        private readonly _appStateService: AppStateService,
        private readonly _refreshService: RefreshService,
    ) { }


    public get characterMenuState(): MenuState {
        return this._menuState.character;
    }

    public get companionMenuState(): MenuState {
        return this._menuState.companion;
    }

    public get familiarMenuState(): MenuState {
        return this._menuState.familiar;
    }

    public get itemsMenuState(): MenuState {
        return this._menuState.items;
    }

    public get craftingMenuState(): MenuState {
        return this._menuState.crafting;
    }

    public get spellsMenuState(): MenuState {
        return this._menuState.spells;
    }

    public get spellLibraryMenuState(): MenuState {
        return this._menuState.spelllibrary;
    }

    public get conditionsMenuState(): MenuState {
        return this._menuState.conditions;
    }

    public get diceMenuState(): MenuState {
        return this._menuState.dice;
    }

    public toggleMenu(menu?: MenuNames): void {
        const refreshDelay = 400;

        this._appStateService.setCharacterMenuClosedOnce();

        if (menu) {
            if (this._menuState[menu] === 'out') {
                this._menuState[menu] = 'in';
                this._refreshService.setComponentChanged(this._menuMatchingComponent[menu]);
            } else {
                this._menuState[menu] = 'out';
                setTimeout(() => {
                    this._refreshService.setComponentChanged(this._menuMatchingComponent[menu]);
                }, refreshDelay);
            }

            this._menuState[menu] = (this._menuState[menu] === 'out') ? 'in' : 'out';
        }

        Object.values(MenuNames).forEach(menuName => {
            if (
                menu !== menuName &&
                !(menu === MenuNames.DiceMenu && [MenuNames.CompanionMenu, MenuNames.FamiliarMenu].includes(menuName))
            ) {
                if (this._menuState[menuName] === 'in') {
                    this._menuState[menuName] = 'out';
                    setTimeout(() => {
                        this._refreshService.setComponentChanged(this._menuMatchingComponent[menuName]);
                    }, refreshDelay);
                }
            }
        });

        this._refreshService.setComponentChanged('top-bar');
        this._refreshService.processPreparedChanges();
    }

    public itemsMenuTarget(): CreatureTypes {
        return this._itemsMenuTarget;
    }

    public setItemsMenuTarget(target: CreatureTypes = CreatureTypes.Character): void {
        this._itemsMenuTarget = target;
        this._refreshService.setComponentChanged('itemstore');
    }

}
