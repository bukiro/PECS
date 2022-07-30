import { Injectable } from '@angular/core';
import { AnimalCompanion } from 'src/app/classes/AnimalCompanion';
import { Armor } from 'src/app/classes/Armor';
import { Character } from 'src/app/classes/Character';
import { Creature } from 'src/app/classes/Creature';
import { Familiar } from 'src/app/classes/Familiar';
import { Specialization } from 'src/app/classes/Specialization';
import { SpecializationGain } from 'src/app/classes/SpecializationGain';
import { CharacterService } from 'src/app/services/character.service';
import { RefreshService } from 'src/app/services/refresh.service';
import { ShoddyPenalties } from '../../definitions/shoddyPenalties';
import { MaxSkillLevel } from '../../definitions/skillLevels';
import { SkillValuesService } from '../skill-values/skill-values.service';

@Injectable({
    providedIn: 'root',
})
export class ArmorPropertiesService {

    constructor(
        private readonly _characterService: CharacterService,
        private readonly _refreshService: RefreshService,
        private readonly _skillValuesService: SkillValuesService,
    ) { }

    public profLevel(
        armor: Armor,
        creature: Creature,
        charLevel: number = this._characterService.character.level,
        options: { itemStore?: boolean } = {},
    ): number {
        if (this._characterService.stillLoading || creature instanceof Familiar) { return 0; }

        this._cacheArmoredSkirt(armor, creature, options);

        let skillLevel = 0;
        const armorLevel =
            this._skillValuesService.level(
                this._characterService.skills(creature, armor.name, { type: 'Specific Weapon Proficiency' })[0],
                creature,
                charLevel,
            );
        const proficiencyLevel =
            this._skillValuesService.level(
                armor.effectiveProficiency(creature, this._characterService),
                creature,
                charLevel,
            );

        //Add either the armor category proficiency or the armor proficiency, whichever is better
        skillLevel = Math.min(Math.max(armorLevel, proficiencyLevel), MaxSkillLevel);

        return skillLevel;
    }

    public armorSpecializations(armor: Armor, creature: Creature): Array<Specialization> {
        const SpecializationGains: Array<SpecializationGain> = [];
        const specializations: Array<Specialization> = [];
        const prof = armor.effectiveProficiency(creature, this._characterService);

        if (creature instanceof Character && armor.group) {
            const character = creature as Character;
            const skillLevel = this.profLevel(armor, character);

            this._characterService.characterFeatsAndFeatures()
                .filter(feat =>
                    feat.gainSpecialization.length &&
                    feat.have({ creature: character }, { characterService: this._characterService }),
                )
                .forEach(feat => {
                    SpecializationGains.push(...feat.gainSpecialization.filter(spec =>
                        (!spec.group || (armor.group && spec.group.includes(armor.group))) &&
                        (
                            !spec.name ||
                            ((armor.name && spec.name.includes(armor.name)) || (armor.armorBase && spec.name.includes(armor.armorBase)))
                        ) &&
                        (!spec.trait || armor.traits.filter(trait => trait && spec.trait.includes(trait)).length) &&
                        (!spec.proficiency || (prof && spec.proficiency.includes(prof))) &&
                        (!spec.skillLevel || skillLevel >= spec.skillLevel) &&
                        (
                            !spec.featreq ||
                            this._characterService.characterFeatsAndFeatures(spec.featreq)[0]
                                ?.have({ creature: character }, { characterService: this._characterService })
                        ),
                    ));
                });
            SpecializationGains.forEach(critSpec => {
                const specs: Array<Specialization> =
                    this._characterService.itemGroupSpecializations(armor.group)
                        .map(spec => Object.assign(new Specialization(), spec).recast());

                specs.forEach(spec => {
                    if (critSpec.condition) {
                        spec.desc = `(${ critSpec.condition }) ${ spec.desc }`;
                    }

                    if (!specializations.some(existingspec => JSON.stringify(existingspec) === JSON.stringify(spec))) {
                        specializations.push(spec);
                    }
                });
            });
        }

        return specializations;
    }

    public updateModifiers(armor: Armor, creature: Creature): void {
        //Initialize shoddy values and armored skirt.
        //Set components to update if these values have changed from before.
        const oldValues = [armor.$affectedByArmoredSkirt, armor.$shoddy];

        this._cacheArmoredSkirt(armor, creature as AnimalCompanion | Character);
        this._cacheEffectiveShoddy(armor, creature);

        const newValues = [armor.$affectedByArmoredSkirt, armor.$shoddy];

        if (oldValues.some((previous, index) => previous !== newValues[index])) {
            this._refreshService.prepareDetailToChange(creature.type, 'inventory');
        }
    }

    private _cacheArmoredSkirt(armor: Armor, creature: Creature, options: { itemStore?: boolean } = {}): void {
        if (!options.itemStore && ['Breastplate', 'Chain Shirt', 'Chain Mail', 'Scale Mail'].includes(armor.name)) {
            const armoredSkirt =
                creature.inventories
                    .map(inventory => inventory.adventuringgear)
                    .find(gear => gear.find(item => item.isArmoredSkirt && item.equipped));

            if (armoredSkirt?.length) {
                armor.$affectedByArmoredSkirt = 1;
            } else {
                armor.$affectedByArmoredSkirt = 0;
            }
        } else if (!options.itemStore && ['Half Plate', 'Full Plate', 'Hellknight Plate'].includes(armor.name)) {
            const armoredSkirt =
                creature.inventories
                    .map(inventory => inventory.adventuringgear)
                    .find(gear => gear.find(item => item.isArmoredSkirt && item.equipped));

            if (armoredSkirt?.length) {
                armor.$affectedByArmoredSkirt = -1;
            } else {
                armor.$affectedByArmoredSkirt = 0;
            }
        } else {
            armor.$affectedByArmoredSkirt = 0;
        }
    }

    private _cacheEffectiveShoddy(armor: Armor, creature: Creature): number {
        //Shoddy items have a -2 penalty to AC, unless you have the Junk Tinker feat and have crafted the item yourself.
        if (
            armor.shoddy &&
            this._characterService.feats('Junk Tinker')[0]?.have({ creature }, { characterService: this._characterService }) &&
            armor.crafted
        ) {
            armor.$shoddy = ShoddyPenalties.NotShoddy;
        } else if (armor.shoddy) {
            armor.$shoddy = ShoddyPenalties.Shoddy;
        } else {
            armor.$shoddy = ShoddyPenalties.NotShoddy;
        }

        return armor.$shoddy;
    }

}
