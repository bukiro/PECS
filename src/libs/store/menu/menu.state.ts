import { CreatureTypes } from 'src/libs/shared/definitions/creatureTypes';
import { MenuNames } from 'src/libs/shared/definitions/menuNames';

export interface MenuState {
    top: MenuNames | null;
    left: MenuNames | null;
    itemsMenuTarget: CreatureTypes;
}
