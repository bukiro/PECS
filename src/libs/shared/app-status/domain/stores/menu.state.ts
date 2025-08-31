import { MenuNames } from 'src/libs/app-shell/util/models/menu-names';
import { CreatureTypes } from 'src/libs/shared/creatures/util/models/creature-types';

export interface MenuState {
    top: MenuNames | null;
    left: MenuNames | null;
    itemsMenuTarget: CreatureTypes;
}
