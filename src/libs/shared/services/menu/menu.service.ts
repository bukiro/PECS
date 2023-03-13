import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { MenuNames } from 'src/libs/shared/definitions/menuNames';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { AppStateService } from '../app-state/app-state.service';

const menuMatchingComponent = {
    [MenuNames.ItemsMenu]: 'items',
    [MenuNames.CraftingMenu]: 'crafting',
    [MenuNames.CharacterCreationMenu]: 'charactersheet',
    [MenuNames.CompanionMenu]: 'companion',
    [MenuNames.FamiliarMenu]: 'familiar',
    [MenuNames.SpellSelectionMenu]: 'spells',
    [MenuNames.SpellLibraryMenu]: 'spelllibrary',
    [MenuNames.ConditionsMenu]: 'conditions',
    [MenuNames.DiceMenu]: 'dice',
};

const topMenus = [MenuNames.DiceMenu];

@Injectable({
    providedIn: 'root',
})
export class MenuService {

    public static sideMenuState$ = new BehaviorSubject<MenuNames | null>(null);
    public static topMenuState$ = new BehaviorSubject<MenuNames | null>(null);
    public static itemsMenuTarget$ = new BehaviorSubject<CreatureTypes>(CreatureTypes.Character);

    constructor(
        private readonly _appStateService: AppStateService,
        private readonly _refreshService: RefreshService,
    ) { }

    public toggleMenu(menu?: MenuNames): void {
        const refreshDelay = 400;

        this._appStateService.setCharacterMenuClosedOnce();

        const isTopMenu = menu && topMenus.includes(menu);

        const setMenu = (newState: MenuNames | null): void => {
            if (isTopMenu) {
                MenuService.topMenuState$.next(newState);
            } else {
                MenuService.sideMenuState$.next(newState);
            }
        };

        if (menu) {
            if ((isTopMenu ? MenuService.topMenuState$.value : MenuService.sideMenuState$.value) === menu) {
                setMenu(null);

                setTimeout(() => {
                    this._refreshService.setComponentChanged(menuMatchingComponent[menu]);
                }, refreshDelay);
            } else {
                setMenu(menu);

                this._refreshService.setComponentChanged(menuMatchingComponent[menu]);
            }
        } else {
            setMenu(null);
        }

        this._refreshService.processPreparedChanges();
    }

    public setItemsMenuTarget(target: CreatureTypes = CreatureTypes.Character): void {
        MenuService.itemsMenuTarget$.next(target);

        this._refreshService.setComponentChanged('itemstore');
    }

}
