export class SpellTarget {
    name = '';
    id = '';
    playerId = '';
    type: 'Character' | 'Companion' | 'Familiar' = 'Character';
    selected = false;
    isPlayer = false;
    recast() {
        return this;
    }
}
