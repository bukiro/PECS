import { Injectable } from '@angular/core';
import { AnimalCompanion } from 'src/app/classes/AnimalCompanion';
import { Armor } from 'src/app/classes/Armor';
import { Character } from 'src/app/classes/Character';
import { Creature } from 'src/app/classes/Creature';
import { Specialization } from 'src/app/classes/Specialization';
import { SpecializationGain } from 'src/app/classes/SpecializationGain';
import { CreatureService } from 'src/libs/shared/services/character/character.service';
import { RefreshService } from 'src/libs/shared/services/refresh/refresh.service';
import { ShoddyPenalties } from '../../definitions/shoddyPenalties';
import { MaxSkillLevel } from '../../definitions/skillLevels';
import { CharacterFeatsService } from '../character-feats/character-feats.service';
import { CreatureConditionsService } from '../creature-conditions/creature-conditions.service';
import { ItemSpecializationsDataService } from '../data/item-specializations-data.service';
import { SkillsDataService } from '../data/skills-data.service';
import { SkillValuesService } from '../skill-values/skill-values.service';
import { StatusService } from '../status/status.service';

@Injectable({
    providedIn: 'root',
})
export class ArmorPropertiesService {

    constructor(
        private readonly _refreshService: RefreshService,
        private readonly _skillValuesService: SkillValuesService,
        private readonly _creatureConditionsService: CreatureConditionsService,
        private readonly _itemSpecializationsDataService: ItemSpecializationsDataService,
        private readonly _characterFeatsService: CharacterFeatsService,
        private readonly _skillsDataService: SkillsDataService,
    ) { }

    public effectiveProficiency(armor: Armor, context: { creature: Creature }): string {
        if (
            this._creatureConditionsService
                .currentCreatureConditions(context.creature, { name: 'Mage Armor' }, { readonly: true })
                .length
        ) {
            //While wearing mage armor, you use your unarmored proficiency to calculate your AC.
            return 'Unarmored Defense';
        }

        return armor.effectiveProficiencyWithoutEffects();
    }

    public profLevel(
        armor: Armor,
        creature: Creature,
        charLevel: number = CreatureService.character.level,
        options: { itemStore?: boolean } = {},
    ): number {
        if (StatusService.isLoadingCharacter$.value || creature.isFamiliar()) { return 0; }

        this._cacheArmoredSkirt(armor, creature, options);

        let skillLevel = 0;
        const armorLevel =
            this._skillValuesService.level(
                this._skillsDataService.skills(creature.customSkills, armor.name, { type: 'Specific Weapon Proficiency' })[0],
                creature,
                charLevel,
            );
        const proficiencyLevel =
            this._skillValuesService.level(
                this.effectiveProficiency(armor, { creature }),
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
        const prof = this.effectiveProficiency(armor, { creature });

        if (creature.isCharacter() && armor.group) {
            const character = creature as Character;
            const skillLevel = this.profLevel(armor, character);

            this._characterFeatsService.characterFeatsAndFeatures()
                .filter(feat =>
                    feat.gainSpecialization.length &&
                    this._characterFeatsService.characterHasFeat(feat.name),
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
                            this._characterFeatsService.characterHasFeat(spec.featreq)
                        ),
                    ));
                });
            SpecializationGains.forEach(critSpec => {
                const specs: Array<Specialization> =
                    this._itemSpecializationsDataService.specializations(armor.group)
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
            creature.isCharacter() &&
            this._characterFeatsService.characterHasFeat('Junk Tinker') &&
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
