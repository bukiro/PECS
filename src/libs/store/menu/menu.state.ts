import { CreatureTypes } from 'src/libs/shared/definitions/creature-types';
import { MenuNames } from 'src/libs/shared/definitions/menu-names';

export interface MenuState {
    top: MenuNames | null;
    left: MenuNames | null;
    itemsMenuTarget: CreatureTypes;
}
