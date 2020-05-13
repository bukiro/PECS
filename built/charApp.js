var app = angular.module('charApp', []);
//App functions
//Why are these app functions and not scope functions? I assume I did that so they could be called from anywhere.
app.haveTrait = function ($obj, $trait) {
    //Does this object have this trait (as String)?
    //Can be any object - only runs if objects has the attribute "traits" at all
    //Returns true or false
    //Example: haveTrait(some_Weapon, "Finesse")
    if ($obj.traits) {
        return $obj.traits.findIndex(function (element) {
            return element.indexOf($trait) === 0;
        }) >= 0;
    }
};
app.haveModifiers = function ($list, $obj, $affected) {
    //Do any traits of this object affect this information? This basically looks up every one of the object's traits in the given list (usually $scope.trait_db),
    //Checks if that trait that has a method called $affected(), then runs it, and adds up the results.
    //Returns the sum of all formulas that affect this information
    //Usage: haveModifiers(List_of_traits, Object, affected_information)
    //Example: haveModifiers($scope.trait_db, some_Weapon, damageBonus)
    let results = 0;
    angular.forEach($obj.traits, function (trait) {
        if ($list.byName(trait) && typeof $list.byName(trait)[$affected] === "function") {
            let effect = eval("$list.byName(trait)." + $affected + "()");
            if (effect) {
                results += effect;
            }
            ;
        }
    });
    return results;
};
//Filters
app.filter('halve', function ($filter) {
    //halves and rounds down the value - standard for Pathfinder
    return function (x) {
        return Math.floor((x) / 2);
    };
});
app.filter('unique', function () {
    //This filter is stolen and I don't fully understand all of its methods.
    //It basically lists up every item in the array, so long as the value of a certain property hasn't already been listed.
    //Returns the array, minus all the items whose property already had that value.
    //Example: 
    /* some_items = [ {name:"dagger", type:"weapon"}, {name:"shortbow", type:"weapon"}, {name:"leather", type:"armor"} ]
      unique_types = $filter('unique')(some_items, "type")
      unique_types == [ {name:"dagger", type:"weapon"}, {name:"leather", type:"armor"} ]
    */
    //If you only want the list of unique properties, use: $filter('unique')(item_list, 'property').map(function(x){return x.property});
    return function (array, property) {
        var output = [];
        let keys = [];
        angular.forEach(array, function (object) {
            var key = object[property];
            if (keys.indexOf(key) === -1) {
                keys.push(key);
                output.push(object);
            }
        });
        return output;
    };
});
app.filter('charAttack', function ($filter) {
    //Calculates the attack bonus for a melee or ranged attack with this weapon.
    //Makes references to $scope.Level, $scope.Abilities, $scope.weaponProfs (weapon category proficiencies) and $scope.trait_db, which must be passed, as well as whether the attack is Ranged or Melee
    return function (x, $level, $abilities, $weaponProfs, $traits, $range) {
        var str = $abilities.byName("Strength").mod();
        var dex = $abilities.byName("Dexterity").mod();
        //Add character level if the character is trained or better with either the weapon category or the weapon itself
        var charLevel = (((x.level > 0) || ($weaponProfs.byName(x.prof).level > 0)) && $level);
        //Add either the weapon category proficiency or the weapon proficiency, whichever is better
        var profLevel = Math.max(x.level, $weaponProfs.byName(x.prof).level);
        //Check if the weapon has any traits that affect its Ability bonus to attack, such as Finesse or Brutal, and run those calculations.
        var traitMod = app.haveModifiers($traits, x, "attack");
        //If the previous step has resulted in a value, use that as the Ability bonus. If not, and the attack is ranged, use Dexterity, otherwise Strength
        var abilityMod = (traitMod) ? (traitMod) : ($range == "Ranged") ? dex : str;
        //Add up all modifiers and return the attack bonus for this attack
        var attackResult = charLevel + profLevel + x.itembonus + abilityMod;
        return attackResult;
    };
});
app.filter('charArmorDefense', function ($filter) {
    //Calculates the effective AC gained from wearing this armor.
    //Makes references to $scope.Level, $scope.Abilities and $scope.armorProfs (armor category proficiencies), which must be passed
    return function (x, $level, $abilities, $armorProfs) {
        var dex = $abilities.byName("Dexterity").mod();
        //Add character level if the character is trained or better with either the armor category or the armor itself
        var charLevel = (((x.level > 0) || ($armorProfs.byName(x.prof).level > 0)) && $level);
        //Add either the weapon category proficiency or the weapon proficiency, whichever is better
        var profLevel = Math.max(x.level, $armorProfs.byName(x.prof).level);
        //Add the dexterity modifier up to the armor's Dex Cap
        var dexBonus = Math.min(dex, (x.dexcap) ? x.dexcap : 999);
        //Add up all modifiers and return the AC gained from this armor
        var defenseResult = 10 + charLevel + profLevel + dexBonus + x.itembonus;
        return defenseResult;
    };
});
app.filter('canParry', function ($filter) {
    //Gets all items from this array that have Parry Trait, if the character is Trained or better with them
    //$scope.weaponProfs (weapon proficiencies) must be passed
    //Returns a filtered array
    return function (x, $weaponProfs) {
        let result = [];
        //Run over all equipped weapons
        angular.forEach($filter('filter')(x, { type: "weapon", equip: true }), function (weapon) {
            //Add this weapon to the result if it has the Parry Trait and if the character is Trained or better with the weapon category or the weapon itself
            if (app.haveTrait(weapon, "Parry") && ((weapon.level > 0) || ($weaponProfs.byName(weapon.prof).level > 0))) {
                result.push(weapon);
            }
        });
        return result;
    };
});
app.filter('charWeaponDamage', function ($filter) {
    //Lists the damage dice and damage bonuses for a ranged or melee attack with this weapon.
    //Abilities and Traits must be passed, as well as whether the attack is Melee or Ranged
    //Returns a string in the form of "1d6 +5"
    //Will get more complicated when runes are implemented
    return function (x, $abilities, $traits, $range) {
        var abilityDmg = "";
        var str = $abilities.byName('Strength').mod();
        //Get the basic "1d6" from the weapon's dice values
        var baseDice = x.dicenum + "d" + x.dicesize;
        //Check if the Weapon has any traits that affect its damage Bonus, such as Thrown or Propulsive, and run those calculations.
        var traitMod = app.haveModifiers($traits, x, "dmgbonus");
        //If the previous step has resulted in a value, use that as the Ability bonus to damage, otherwise use Strength for Melee attacks.
        //Ranged attacks don't get a damage bonus from Abilities without Traits.
        var abilityMod = (traitMod) ? (traitMod) : ($range == "Melee") && str;
        //Make a nice " +5" string from the Ability bonus if there is one, or else make it empty
        abilityDmg = (abilityMod) ? " +" + abilityMod : "";
        //Concatenate the strings for a readable damage die
        var dmgResult = baseDice + abilityDmg;
        return dmgResult;
    };
});
app.filter('charSkill', function ($filter) {
    //Calculates the effective bonus of the given Skill
    //$scope.Level, $scope.Abilities, $scope.feat_db and $scope.getEffects(skill) must be passed
    return function (x, $level, $abilities, $feats, $effects) {
        //Add character level if the character is trained or better with the Skill; Add half the level if the skill is unlearned and the character has the Untrained Improvisation feat.
        //Gets applied to saves and perception, but they are never untrained
        var charLevel = ((x.level > 0) ? $level : ($feats.byName("Untrained Improvisation").have) && Math.floor($level / 2));
        //Add the Ability modifier identified by the skill's ability property
        var abilityMod = $abilities.byName(x.ability).mod();
        //Add up all modifiers, the skill proficiency and all active effects, write the result into the skill object for easy access, then return the sum
        //getEffects(skill) has actually already been called and passed into the filter as $effects
        var skillResult = charLevel + x.level + abilityMod + $effects;
        x.value = skillResult;
        return skillResult;
    };
});
//controller
app.controller('charCtrl', function ($scope, $filter) {
    class Ability {
        constructor(name = "") {
            this.name = name;
            this.effects = [];
            this.basevalue = 10;
        }
        value() {
            //Calculates the ability with all active effects
            //Get all active effects on the ability
            let itembonus = $scope.getEffects(this);
            //Add the effect bonus to the base value - parseInt'ed because it's from a textbox - and return it
            return this.basevalue + itembonus;
        }
        mod() {
            //Calculates the ability modifier from the effective ability in the usual d20 fashion - 0-1 > -5; 2-3 > -4; ... 10-11 > 0; 12-13 > 1 etc.
            return Math.floor((this.value() - 10) / 2);
        }
    }
    class Skill {
        constructor(name = "", ability = "") {
            this.name = name;
            this.ability = ability;
            this.level = 0;
            this.note = "";
            this.effects = [];
        }
    }
    class Weapon {
        constructor(type = "weapon", name = "", equip = false, level = 0, prof = "", dmgType = "", dicenum = 1, dicesize = 6, melee = 0, ranged = 0, itembonus = 0, traits = []) {
            this.type = type;
            this.name = name;
            this.equip = equip;
            this.level = level;
            this.prof = prof;
            this.dmgType = dmgType;
            this.dicenum = dicenum;
            this.dicesize = dicesize;
            this.melee = melee;
            this.ranged = ranged;
            this.itembonus = itembonus;
            this.traits = traits;
        }
    }
    class Armor {
        constructor(type = "armor", name = "", equip = false, level = 0, prof = "", dexcap = 999, skillpenalty = 0, speedpenalty = 0, strength = 0, itembonus = 0, traits = []) {
            this.type = type;
            this.name = name;
            this.equip = equip;
            this.level = level;
            this.prof = prof;
            this.dexcap = dexcap;
            this.skillpenalty = skillpenalty;
            this.speedpenalty = speedpenalty;
            this.strength = strength;
            this.itembonus = itembonus;
            this.traits = traits;
        }
    }
    class Shield {
        constructor(type = "shield", name = "", equip = false, speedpenalty = 0, itembonus = 0, coverbonus = 0, traits = []) {
            this.type = type;
            this.name = name;
            this.equip = equip;
            this.speedpenalty = speedpenalty;
            this.itembonus = itembonus;
            this.coverbonus = coverbonus;
            this.traits = traits;
        }
    }
    class Feat {
        constructor(name = "", desc = "", levelreq = 0, lorebase = false, skillreq = "", abilityreq = "", featreq = "", specialreq = "", weaponreq = "", armorreq = "", showon = "", traits = [], effects = [], have = false) {
            this.name = name;
            this.desc = desc;
            this.levelreq = levelreq;
            this.lorebase = lorebase;
            this.skillreq = skillreq;
            this.abilityreq = abilityreq;
            this.featreq = featreq;
            this.specialreq = specialreq;
            this.weaponreq = weaponreq;
            this.armorreq = armorreq;
            this.showon = showon;
            this.traits = traits;
            this.effects = effects;
            this.have = have;
        }
        canChoose() {
            //This function evaluates ALL the possible requirements for taking a feat
            //Returns true only if all the requirements are true. If the feat doesn't have a requirement, it is always true.
            //First of all, never list feats that only show on the "Lore" skill - these are templates and never used directly
            //Copies are made in $scope.generateLore() individually for every unique lore, and these may show up on this list
            if (this.showon == "Lore") {
                return false;
            }
            //If the feat has a levelreq, check if the level beats that.
            let levelreq = (this.levelreq) ? ($scope.level >= this.levelreq) : true;
            //If the feat has an abilityreq, split it into the ability and the requirement (they come in strings like "Dexterity, 12"), then check if that ability's value() meets the requirement. 
            let abilityreq = (this.abilityreq) ? ($scope.abilities.byName(this.abilityreq.split(",")[0]).value() >= parseInt(this.abilityreq.split(",")[1])) : true;
            //If the feat has a skillreq, first split it into all different requirements (they come in strings like "Athletics, 2|Acrobatics, 2" or just "Acrobatics, 2")
            //Then check if any one of these requirements (split into the skill and the number) are met by the skill's level
            //These are always OR requirements, you never need two skills for a feat.
            let skillreq = false;
            if (this.skillreq) {
                let skillreqs = this.skillreq.split("|");
                skillreq = skillreqs.some(function (requirement) { return $scope.skills.byName(requirement.split(",")[0]).level >= parseInt(requirement.split(",")[1]); }) && true;
            }
            else {
                skillreq = true;
            }
            //If the feat has a weaponreq, split it and check if the named weapon proficiency's level meets the number
            let weaponreq = (this.weaponreq) ? ($scope.weaponProfs.byName(this.weaponreq.split(",")[0]).level >= parseInt(this.weaponreq.split(",")[1])) : true;
            //If the feat has an armorreq, split it and check if the named armor proficiency's level meets the number
            let armorreq = (this.armorreq) ? ($scope.armorProfs.byName(this.armorreq.split(",")[0]).level >= parseInt(this.armorreq.split(",")[1])) : true;
            //Lastly, if the feat has a specialreq, it comes as a string that contains a condition. Evaluate the condition to find out if the requirement is met.
            let specialreq = (this.specialreq) ? (eval(this.specialreq)) : true;
            //Return true if all are true
            return levelreq && abilityreq && skillreq && weaponreq && armorreq && specialreq;
        }
    }
    $scope.character = { name: "Dudebro", ancestry: "Human, Orc", class: "Monk", subclass: "", deity: "God" };
    $scope.level = 7;
    //The effective AC is called as a function and includes the worn armor and all raised shields and Parry weapons.
    $scope.AC = { name: 'AC', effects: [], value: function () {
            //Calculates the armor class from armor and all effects gained from raised shields or weapons
            //This is only called from the AC's value() method, and the AC is passed for easy function calls
            //Applies the charArmorDefense filter to the first (and only) worn armor to get the basic passive armor class
            let armor = $filter('filter')($scope.items, { type: "armor", equip: true })[0];
            let acbonus = $filter('charArmorDefense')(armor, $scope.level, $scope.abilities, $scope.armorProfs);
            //Adds all active effects on AC
            acbonus += $scope.getEffects(this);
            return acbonus;
        }
    };
    //The actual abilities with all modifiers are called as a function, as well as the Ability modifier (which is calculated from the value).
    $scope.abilities = [
        new Ability("Strength"),
        new Ability("Dexterity"),
        new Ability("Constitution"),
        new Ability("Intelligence"),
        new Ability("Wisdom"),
        new Ability("Charisma"),
    ];
    //We are counting Perception as a regular skill
    //All proficiencies are directly named as 0,2,4,6,8, which is their real modifier
    $scope.skills = [
        new Skill('Perception', "Wisdom"),
        new Skill('Acrobatics', "Dexterity"),
        new Skill('Arcana', "Intelligence"),
        new Skill('Athletics', "Strength"),
        new Skill('Crafting', "Intelligence"),
        new Skill('Deception', "Charisma"),
        new Skill('Diplomacy', "Charisma"),
        new Skill('Intimidation', "Charisma"),
        new Skill('Lore', "Intelligence"),
        new Skill('Medicine', "Wisdom"),
        new Skill('Nature', "Wisdom"),
        new Skill('Occultism', "Intelligence"),
        new Skill('Performance', "Charisma"),
        new Skill('Religion', "Wisdom"),
        new Skill('Society', "Intelligence"),
        new Skill('Stealth', "Dexterity"),
        new Skill('Survival', "Wisdom"),
        new Skill('Thievery', "Dexterity"),
    ];
    $scope.saves = [
        { name: 'Fortitude', level: 2, ability: "Constitution", note: '', effects: [], },
        { name: 'Reflex', level: 6, ability: "Dexterity", note: '', effects: [], },
        { name: 'Will', level: 4, ability: "Wisdom", note: '+2 vs enchantment', effects: [], },
    ];
    $scope.weaponProfs = [
        { name: 'Simple', level: 2, effects: [], },
        { name: 'Martial', level: 4, effects: [], },
        { name: 'Unarmed', level: 0, effects: [], },
    ];
    $scope.armorProfs = [
        { name: 'Light', level: 4, effects: [], },
        { name: 'Medium', level: 0, effects: [], },
        { name: 'Heavy', level: 0, effects: [], },
        { name: 'Unarmored', level: 4, effects: [], },
    ];
    //The inventory
    $scope.items = [];
    //This immutable item list may be loaded from a database in the future. Every weapon you "get" is copied from here to $scope.items, where it can be modified.
    //Weapon: type:string, name:string, equip:boolean, level:number, prof:string, dmgType:string, dicenum:number, dicesize:number, melee:number, ranged:number, itembonus:number, traits:string[],
    //Shield: type:string, name:string, equip:boolean, level:number, prof:string, dexcap:number, skillpenalty:number, speedpenalty:number, strength:number, itembonus:number, traits:string[],
    //Armor: type:string, name:string, equip:boolean, speedpenalty:number, itembonus:number, coverbonus:number, traits:string[],
    $scope.item_db = [
        new Weapon('weapon', 'Fist', false, 0, 'Unarmed', 'B', 1, 4, 5, 0, 0, ['Agile', 'Finesse', 'Nonlethal', 'Unarmed']),
        new Weapon('weapon', 'Halfling Sling Staff', false, 0, 'Martial', 'B', 1, 10, 0, 80, 0, ['Halfling', 'Propulsive', 'Uncommon']),
        new Weapon('weapon', 'Greatclub', false, 0, 'Martial', 'B', 1, 10, 5, 0, 0, ['Backswing', 'Shove']),
        new Weapon('weapon', 'War Flail', false, 0, 'Martial', 'B', 1, 10, 5, 0, 0, ['Disarm', 'Sweep', 'Trip']),
        new Weapon('weapon', 'Maul', false, 0, 'Martial', 'B', 1, 12, 5, 0, 0, ['Shove']),
        new Weapon('weapon', 'Gauntlet', false, 0, 'Simple', 'B', 1, 4, 5, 0, 0, ['Agile', 'Free-Hand']),
        new Weapon('weapon', 'Light Mace', false, 0, 'Simple', 'B', 1, 4, 5, 0, 0, ['Agile', 'Finesse', 'Shove']),
        new Weapon('weapon', 'Staff', false, 0, 'Simple', 'B', 1, 4, 5, 0, 0, ['Two-Hand d8']),
        new Weapon('weapon', 'Shield Bash', false, 0, 'Martial', 'B', 1, 4, 5, 0, 0, []),
        new Weapon('weapon', 'Sling', false, 0, 'Simple', 'B', 1, 6, 0, 50, 0, ['Propulsive']),
        new Weapon('weapon', 'Club', false, 0, 'Simple', 'B', 1, 6, 5, 0, 0, ['Thrown 10 ft.']),
        new Weapon('weapon', 'Mace', false, 0, 'Simple', 'B', 1, 6, 5, 0, 0, ['Shove']),
        new Weapon('weapon', 'Morningstar', false, 0, 'Simple', 'B', 1, 6, 5, 0, 0, ['Versatile P']),
        new Weapon('weapon', 'Flail', false, 0, 'Martial', 'B', 1, 6, 5, 0, 0, ['Disarm', 'Sweep', 'Trip']),
        new Weapon('weapon', 'Gnome Hooked Hammer', false, 0, 'Martial', 'B', 1, 6, 5, 0, 0, ['Gnome', 'Trip', 'Two-Hand d10', 'Uncommon', 'Versatile P']),
        new Weapon('weapon', 'Nunchaku', false, 0, 'Martial', 'B', 1, 6, 5, 0, 0, ['Backswing', 'Disarm', 'Finesse', 'Monk', 'Uncommon']),
        new Weapon('weapon', 'Sap', false, 0, 'Martial', 'B', 1, 6, 5, 0, 0, ['Agile', 'Nonlethal']),
        new Weapon('weapon', 'Shield Boss', false, 0, 'Martial', 'B', 1, 6, 5, 0, 0, ['Attached to Shield']),
        new Weapon('weapon', 'Light Hammer', false, 0, 'Martial', 'B', 1, 6, 5, 20, 0, ['Agile', 'Thrown 20 ft.']),
        new Weapon('weapon', 'Aklys', false, 0, 'Advanced', 'B', 1, 6, 5, 20, 0, ['Ranged Trip', 'Tethered', 'Thrown 20 feet', 'Trip', 'Uncommon']),
        new Weapon('weapon', 'Bo Staff', false, 0, 'Martial', 'B', 1, 8, 10, 0, 0, ['Monk', 'Parry', 'Reach', 'Trip']),
        new Weapon('weapon', 'Gnome Flickmace', false, 0, 'Advanced', 'B', 1, 8, 10, 0, 0, ['Gnome', 'Reach', 'Uncommon']),
        new Weapon('weapon', 'Warhammer', false, 0, 'Martial', 'B', 1, 8, 5, 0, 0, ['Shove']),
        new Weapon('weapon', 'Blowgun', false, 0, 'Simple', 'P', 1, 1, 0, 20, 0, ['Agile', 'Nonlethal']),
        new Weapon('weapon', 'Heavy Crossbow', false, 0, 'Simple', 'P', 1, 10, 0, 120, 0, []),
        new Weapon('weapon', 'Halberd', false, 0, 'Martial', 'P', 1, 10, 10, 0, 0, ['Reach', 'Versatile S']),
        new Weapon('weapon', 'Ranseur', false, 0, 'Martial', 'P', 1, 10, 10, 0, 0, ['Disarm', 'Reach']),
        new Weapon('weapon', 'Greatpick', false, 0, 'Martial', 'P', 1, 10, 5, 0, 0, ['Fatal d12']),
        new Weapon('weapon', 'Ogre Hook', false, 0, 'Advanced', 'P', 1, 10, 5, 0, 0, ['Deadly 1d10', 'Trip', 'Uncommon']),
        new Weapon('weapon', 'Dart', false, 0, 'Simple', 'P', 1, 4, 0, 20, 0, ['Agile', 'Thrown']),
        new Weapon('weapon', 'Shuriken', false, 0, 'Martial', 'P', 1, 4, 0, 20, 0, ['Agile', 'Monk', 'Thrown', 'Uncommon']),
        new Weapon('weapon', 'Clan Dagger', false, 0, 'Simple', 'P', 1, 4, 5, 0, 0, ['Agile', 'Dwarf', 'Parry', 'Uncommon', 'Versatile B']),
        new Weapon('weapon', 'Katar', false, 0, 'Simple', 'P', 1, 4, 5, 0, 0, ['Agile', 'Deadly d6', 'Monk', 'Uncommon']),
        new Weapon('weapon', 'Spiked Gauntlet', false, 0, 'Simple', 'P', 1, 4, 5, 0, 0, ['Agile', 'Free-Hand']),
        new Weapon('weapon', 'Light Pick', false, 0, 'Martial', 'P', 1, 4, 5, 0, 0, ['Agile', 'Fatal d8']),
        new Weapon('weapon', 'Main-gauche', false, 0, 'Martial', 'P', 1, 4, 5, 0, 0, ['Agile', 'Disarm', 'Finesse', 'Parry', 'Versatile S']),
        new Weapon('weapon', 'Sai', false, 0, 'Martial', 'P', 1, 4, 5, 0, 0, ['Agile', 'Disarm', 'Finesse', 'Monk', 'Uncommon', 'Versatile B']),
        new Weapon('weapon', 'Dagger', false, 0, 'Simple', 'P', 1, 4, 5, 10, 0, ['Agile', 'Finesse', 'Thrown 10 ft.', 'Versatile S']),
        new Weapon('weapon', 'Filcher\'s Fork', false, 0, 'Martial', 'P', 1, 4, 5, 20, 0, ['Agile', 'Backstabber', 'Deadly d6', 'Finesse', 'Halfling', 'Thrown 20 ft.', 'Uncommon']),
        new Weapon('weapon', 'Starknife', false, 0, 'Martial', 'P', 1, 4, 5, 20, 0, ['Agile', 'Deadly d6', 'Finesse', 'Thrown 20 ft.', 'Versatile S']),
        new Weapon('weapon', 'Javelin', false, 0, 'Simple', 'P', 1, 6, 0, 30, 0, ['Thrown']),
        new Weapon('weapon', 'Hand Crossbow', false, 0, 'Simple', 'P', 1, 6, 0, 60, 0, []),
        new Weapon('weapon', 'Composite Shortbow', false, 0, 'Martial', 'P', 1, 6, 0, 60, 0, ['Deadly d10', 'Propulsive']),
        new Weapon('weapon', 'Shortbow', false, 0, 'Martial', 'P', 1, 6, 0, 60, 0, ['Deadly d10']),
        new Weapon('weapon', 'Orc Knuckle Dagger', false, 0, 'Martial', 'P', 1, 6, 5, 0, 0, ['Agile', 'Disarm', 'Orc', 'Uncommon']),
        new Weapon('weapon', 'Pick', false, 0, 'Martial', 'P', 1, 6, 5, 0, 0, ['Fatal d10']),
        new Weapon('weapon', 'Rapier', false, 0, 'Martial', 'P', 1, 6, 5, 0, 0, ['Deadly d8', 'Disarm', 'Finesse']),
        new Weapon('weapon', 'Shield Spikes', false, 0, 'Martial', 'P', 1, 6, 5, 0, 0, ['Attached to Shield']),
        new Weapon('weapon', 'Shortsword', false, 0, 'Martial', 'P', 1, 6, 5, 0, 0, ['Agile', 'Finesse', 'Versatile S']),
        new Weapon('weapon', 'Spear', false, 0, 'Simple', 'P', 1, 6, 5, 20, 0, ['Thrown 20 ft.']),
        new Weapon('weapon', 'Composite Longbow', false, 0, 'Martial', 'P', 1, 8, 0, 100, 0, ['Deadly d10', 'Propulsive', 'Volley 30 ft.']),
        new Weapon('weapon', 'Longbow', false, 0, 'Martial', 'P', 1, 8, 0, 100, 0, ['Deadly d10', 'Volley 30 ft.']),
        new Weapon('weapon', 'Crossbow', false, 0, 'Simple', 'P', 1, 8, 0, 120, 0, []),
        new Weapon('weapon', 'Longspear', false, 0, 'Simple', 'P', 1, 8, 10, 0, 0, ['Reach']),
        new Weapon('weapon', 'Lance', false, 0, 'Martial', 'P', 1, 8, 10, 0, 0, ['Deadly d8', 'Jousting d6', 'Reach']),
        new Weapon('weapon', 'Trident', false, 0, 'Martial', 'P', 1, 8, 5, 20, 0, ['Thrown 20 ft.']),
        new Weapon('weapon', 'Guisarme', false, 0, 'Martial', 'S', 1, 10, 10, 0, 0, ['Reach', 'Trip']),
        new Weapon('weapon', 'Falchion', false, 0, 'Martial', 'S', 1, 10, 5, 0, 0, ['Forceful', 'Sweep']),
        new Weapon('weapon', 'Scythe', false, 0, 'Martial', 'S', 1, 10, 5, 0, 0, ['Deadly d10', 'Trip']),
        new Weapon('weapon', 'Greataxe', false, 0, 'Martial', 'S', 1, 12, 5, 0, 0, ['Sweep']),
        new Weapon('weapon', 'Greatsword', false, 0, 'Martial', 'S', 1, 12, 5, 0, 0, ['Versatile P']),
        new Weapon('weapon', 'Whip', false, 0, 'Martial', 'S', 1, 4, 10, 0, 0, ['Disarm', 'Finesse', 'Nonlethal', 'Reach', 'Trip']),
        new Weapon('weapon', 'Sickle', false, 0, 'Simple', 'S', 1, 4, 5, 0, 0, ['Agile', 'Finesse', 'Trip']),
        new Weapon('weapon', 'Scourge', false, 0, 'Martial', 'S', 1, 4, 5, 0, 0, ['Agile', 'Disarm', 'Finesse', 'Nonlethal', 'Sweep']),
        new Weapon('weapon', 'Dogslicer', false, 0, 'Martial', 'S', 1, 6, 5, 0, 0, ['Agile', 'Backstabber', 'Finesse', 'Goblin', 'Uncommon']),
        new Weapon('weapon', 'Kama', false, 0, 'Martial', 'S', 1, 6, 5, 0, 0, ['Agile', 'Monk', 'Trip', 'Uncommon']),
        new Weapon('weapon', 'Katana', false, 0, 'Martial', 'S', 1, 6, 5, 0, 0, ['Deadly d8', 'Two-Hand d10', 'Uncommon', 'Versatile P']),
        new Weapon('weapon', 'Kukri', false, 0, 'Martial', 'S', 1, 6, 5, 0, 0, ['Agile', 'Finesse', 'Trip', 'Uncommon']),
        new Weapon('weapon', 'Scimitar', false, 0, 'Martial', 'S', 1, 6, 5, 0, 0, ['Forceful', 'Sweep']),
        new Weapon('weapon', 'Sawtooth Saber', false, 0, 'Advanced', 'S', 1, 6, 5, 0, 0, ['Agile', 'Finesse', 'Twin', 'Uncommon']),
        new Weapon('weapon', 'Hatchet', false, 0, 'Martial', 'S', 1, 6, 5, 10, 0, ['Agile', 'Sweep', 'Thrown  10 ft.']),
        new Weapon('weapon', 'Fauchard', false, 0, 'Martial', 'S', 1, 8, 10, 0, 0, ['Deadly d8', 'Reach 10 ft.', 'Sweep', 'Trip']),
        new Weapon('weapon', 'Glaive', false, 0, 'Martial', 'S', 1, 8, 10, 0, 0, ['Deadly d8', 'Forceful', 'Reach']),
        new Weapon('weapon', 'Horsechopper', false, 0, 'Martial', 'S', 1, 8, 10, 0, 0, ['Goblin', 'Reach', 'Trip', 'Uncommon', 'Versatile P']),
        new Weapon('weapon', 'Bastard Sword', false, 0, 'Martial', 'S', 1, 8, 5, 0, 0, ['Two-Hand d12']),
        new Weapon('weapon', 'Battle Axe', false, 0, 'Martial', 'S', 1, 8, 5, 0, 0, ['Sweep']),
        new Weapon('weapon', 'Elven Curve Blade', false, 0, 'Martial', 'S', 1, 8, 5, 0, 0, ['Elf', 'Finesse', 'Forceful', 'Uncommon']),
        new Weapon('weapon', 'Longsword', false, 0, 'Martial', 'S', 1, 8, 5, 0, 0, ['Versatile P']),
        new Weapon('weapon', 'Spiked Chain', false, 0, 'Martial', 'S', 1, 8, 5, 0, 0, ['Disarm', 'Finesse', 'Trip', 'Uncommon']),
        new Weapon('weapon', 'Temple Sword', false, 0, 'Martial', 'S', 1, 8, 5, 0, 0, ['Monk', 'Trip', 'Uncommon']),
        new Weapon('weapon', 'Aldori Dueling Sword', false, 0, 'Advanced', 'S', 1, 8, 5, 0, 0, ['Finesse', 'Uncommon', 'Versatile P']),
        new Weapon('weapon', 'Dwarven War Axe', false, 0, 'Advanced', 'S', 1, 8, 5, 0, 0, ['Dwarf', 'Sweep', 'Two-Hand d12', 'Uncommon']),
        new Weapon('weapon', 'Orc Necksplitter', false, 0, 'Advanced', 'S', 1, 8, 5, 0, 0, ['Forceful', 'Orc', 'Sweep', 'Uncommon']),
        new Shield('shield', 'Buckler', false, 0, 1, 0, []),
        new Shield('shield', 'Wooden Shield', false, 0, 2, 0, []),
        new Shield('shield', 'Steel Shield', false, 0, 2, 0, []),
        new Shield('shield', 'Tower Shield', false, -5, 2, 2, []),
        new Armor('armor', 'Unarmored', false, 0, 'Unarmored', 999, 0, 0, 0, 0, []),
        new Armor('armor', 'Padded Armor', false, 0, 'Light', 3, 0, 0, 10, 1, ['Comfort']),
        new Armor('armor', 'Explorer\'s Clothing', false, 0, 'Unarmored', 5, 0, 0, 0, 0, ['Comfort']),
        new Armor('armor', 'Studded Leather Armor', false, 0, 'Light', 3, -1, 0, 12, 2, []),
        new Armor('armor', 'Chain Shirt', false, 0, 'Light', 3, -1, 0, 12, 2, ['Flexible', 'Noisy']),
        new Armor('armor', 'Leather Armor', false, 0, 'Light', 4, -1, 0, 10, 1, []),
        new Armor('armor', 'Breastplate', false, 0, 'Medium', 1, -2, -5, 16, 4, []),
        new Armor('armor', 'Chain Mail', false, 0, 'Medium', 1, -2, -5, 16, 4, ['Flexible', 'Noisy']),
        new Armor('armor', 'Hide Armor', false, 0, 'Medium', 2, -2, -5, 14, 3, []),
        new Armor('armor', 'Scale Mail', false, 0, 'Medium', 2, -2, -5, 14, 3, []),
        new Armor('armor', 'Hellknight Plate', false, 0, 'Heavy', 0, -3, -10, 18, 6, ['Bulwark', 'Uncommon']),
        new Armor('armor', 'Full Plate', false, 0, 'Heavy', 0, -3, -10, 18, 6, ['Bulwark']),
        new Armor('armor', 'Splint Mail', false, 0, 'Heavy', 1, -3, -10, 16, 5, []),
        new Armor('armor', 'Half Plate', false, 0, 'Heavy', 1, -3, -10, 16, 5, []),
    ];
    //The trait list is immutable and may be loaded from a database in the future. Functions look up information from here in case an item has a trait.
    //Some traits have special functions named after an information they affect, e.g. attack() or dmgbonus(). These get called by the haveModifiers() function.
    $scope.trait_db = [
        { name: 'Agile', showon: '', desc: 'The multiple attack penalty you take with this weapon on the second attack on your turn is -4 instead of -5, and -8 instead of -10 on the third and subsequent attacks in the turn.', have: function () { return $scope.trait_db.have(this); }, },
        { name: 'Attached', showon: '', desc: 'An attached weapon must be combined with another piece of gear to be used. The trait lists what type of item the weapon must be attached to. You must be wielding or wearing the item the weapon is attached to in order to attack with it. For example, shield spikes are attached to a shield, allowing you to attack with the spikes instead of a shield bash, but only if you\'re wielding the shield. An attached weapon is usually bolted onto or built into the item it\'s attached to, and typically an item can have only one weapon attached to it. An attached weapon can be affixed to an item with 10 minutes of work and a successful DC 10 Crafting check; this includes the time needed to remove the weapon from a previous item, if necessary. If an item is destroyed, its attached weapon can usually be salvaged.', have: function () { return $scope.trait_db.have(this); }, },
        { name: 'Backstabber', showon: '', desc: 'When you hit a flat-footed creature, this weapon deals 1 precision damage in addition to its normal damage. The precision damage increases to 2 if the weapon is a +3 weapon.', have: function () { return $scope.trait_db.have(this); }, },
        { name: 'Backswing', showon: '', desc: 'You can use the momentum from a missed attack with this weapon to lead into your next attack. After missing with this weapon on your turn, you gain a +1 circumstance bonus to your next attack with this weapon before the end of your turn.', have: function () { return $scope.trait_db.have(this); }, },
        { name: 'Brutal', showon: '', desc: 'A ranged attack with this trait uses its Strength modifier instead of Dexterity on the attack roll.', have: function () { return $scope.trait_db.have(this); }, attack: function () { return $scope.abilities.byName("Strength").mod(); }, },
        { name: 'Deadly', showon: '', desc: 'On a critical hit, the weapon adds a weapon damage die of the listed size. Roll this after doubling the weapon\'s damage. This increases to two dice if the weapon has a greater striking rune and three dice if the weapon has a major striking rune. For instance, a rapier with a greater striking rune deals 2d8 extra piercing damage on a critical hit. An ability that changes the size of the weapon\'s normal damage dice doesn\'t change the size of its deadly die.', have: function () { return $scope.trait_db.have(this); }, },
        { name: 'Disarm', showon: '', desc: 'You can use this weapon to Disarm with the Athletics skill even if you don\'t have a free hand. This uses the weapon\'s reach (if different from your own) and adds the weapon\'s item bonus to attack rolls (if any) as an item bonus to the Athletics check. If you critically fail a check to Disarm using the weapon, you can drop the weapon to take the effects of a failure instead of a critical failure. On a critical success, you still need a free hand if you want to take the item.', have: function () { return $scope.trait_db.have(this); }, },
        { name: 'Dwarf', showon: '', desc: 'A creature with this trait is a member of the dwarf ancestry. Dwarves are stout folk who often live underground and typically have darkvision. An ability with this trait can be used or selected only by dwarves. An item with this trait is created and used by dwarves.', have: function () { return $scope.trait_db.have(this); }, },
        { name: 'Elf', showon: '', desc: 'A creature with this trait is a member of the elf ancestry. Elves are mysterious people with rich traditions of magic and scholarship who typically have low-light vision. An ability with this trait can be used or selected only by elves. A weapon with this trait is created and used by elves.', have: function () { return $scope.trait_db.have(this); }, },
        { name: 'Fatal', showon: '', desc: 'The fatal trait includes a die size. On a critical hit, the weapon\'s damage die increases to that die size instead of the normal die size, and the weapon adds one additional damage die of the listed size.', have: function () { return $scope.trait_db.have(this); }, },
        { name: 'Finesse', showon: '', desc: 'You can use your Dexterity modifier instead of your Strength modifier on attack rolls using this melee weapon. You still use your Strength modifier when calculating damage.', have: function () { return $scope.trait_db.have(this); }, attack: function () { if ($scope.abilities.byName("Dexterity").mod() > $scope.abilities.byName("Strength").mod()) {
                return $scope.abilities.byName("Dexterity").mod();
            } }, },
        { name: 'Forceful', showon: '', desc: 'This weapon becomes more dangerous as you build momentum. When you attack with it more than once on your turn, the second attack gains a circumstance bonus to damage equal to the number of weapon damage dice, and each subsequent attack gains a circumstance bonus to damage equal to double the number of weapon damage dice.', have: function () { return $scope.trait_db.have(this); }, },
        { name: 'Free-Hand', showon: '', desc: 'This weapon doesn\'t take up your hand, usually because it is built into your armor. A free-hand weapon can\'t be Disarmed. You can use the hand covered by your free-hand weapon to wield other items, perform manipulate actions, and so on. You can\'t attack with a free-hand weapon if you\'re wielding anything in that hand or otherwise using that hand. When you\'re not wielding anything and not otherwise using the hand, you can use abilities that require you to have a hand free as well as those that require you to be wielding a weapon in that hand. Each of your hands can have only one free-hand weapon on it.', have: function () { return $scope.trait_db.have(this); }, },
        { name: 'Gnome', showon: '', desc: 'A creature with this trait is a member of the gnome ancestry. Gnomes are small people skilled at magic who seek out new experiences and usually have low-light vision. An ability with this trait can be used or selected only by gnomes. A weapon with this trait is created and used by gnomes.', have: function () { return $scope.trait_db.have(this); }, },
        { name: 'Goblin', showon: '', desc: 'A creature with this trait can come from multiple tribes of creatures, including goblins, hobgoblins, and bugbears. Goblins tend to have darkvision. An ability with this trait can be used or chosen only by goblins. A weapon with this trait is created and used by goblins.', have: function () { return $scope.trait_db.have(this); }, },
        { name: 'Grapple', showon: 'Athletics', desc: 'You can use this weapon to Grapple with the Athletics skill even if you don\'t have a free hand. This uses the weapon\'s reach (if different from your own) and adds the weapon\'s item bonus to attack rolls as an item bonus to the Athletics check. If you critically fail a check to Grapple using the weapon, you can drop the weapon to take the effects of a failure instead of a critical failure.', have: function () { return $scope.trait_db.have(this); }, },
        { name: 'Halfling', showon: '', desc: 'A creature with this trait is a member of the halfling ancestry. These small people are friendly wanderers considered to be lucky. An ability with this trait can be used or selected only by halflings. A weapon with this trait is created and used by halflings.', have: function () { return $scope.trait_db.have(this); }, },
        { name: 'Jousting', showon: '', desc: 'The weapon is suited for mounted combat with a harness or similar means. When mounted, if you moved at least 10 feet on the action before your attack, add a circumstance bonus to damage for that attack equal to the number of damage dice for the weapon. In addition, while mounted, you can wield the weapon in one hand, changing the damage die to the listed value.', have: function () { return $scope.trait_db.have(this); }, },
        { name: 'Monk', showon: '', desc: 'Many monks learn to use these weapons.', have: function () { return $scope.trait_db.have(this); }, },
        { name: 'Nonlethal', showon: '', desc: 'Attacks with this weapon are nonlethal, and are used to knock creatures unconscious instead of kill them. You can use a nonlethal weapon to make a lethal attack with a -2 circumstance penalty.', have: function () { return $scope.trait_db.have(this); }, },
        { name: 'Orc', showon: '', desc: 'Orcs craft and use these weapons.', have: function () { return $scope.trait_db.have(this); }, },
        { name: 'Parry', showon: '', desc: 'This weapon can be used defensively to block attacks. While wielding this weapon, if your proficiency with it is trained or better, you can spend an Interact action to position your weapon defensively, gaining a +1 circumstance bonus to AC until the start of your next turn.', have: function () { return $scope.trait_db.have(this); }, },
        { name: 'Propulsive', showon: '', desc: 'You add half your Strength modifier (if positive) to damage rolls with a propulsive ranged weapon. If you have a negative Strength modifier, you add your full Strength modifier instead.', have: function () { return $scope.trait_db.have(this); }, dmgbonus: function () { return Math.floor($scope.abilities.byName("Strength").mod() / (($scope.abilities.byName("Strength").mod() > 0) ? 2 : 1)); }, },
        { name: 'Range', showon: '', desc: 'These attacks will either list a finite range or a range increment, which follows the normal rules for range increments.', have: function () { return $scope.trait_db.have(this); }, },
        { name: 'Ranged Trip', showon: 'Athletics', desc: 'This weapon can be used to Trip with the Athletics skill at a distance up to the weapon\'s first range increment. The skill check takes a -2 circumstance penalty. You can add the weapon\'s item bonus to attack rolls as a bonus to the check. As with using a melee weapon to trip, a ranged trip doesn\'t deal any damage when used to Trip. This trait usually only appears on a thrown weapon.', have: function () { return $scope.trait_db.have(this); }, },
        { name: 'Reach', showon: '', desc: 'Natural attacks with this trait can be used to attack creatures up to the listed distance away instead of only adjacent creatures. Weapons with this trait are long and can be used to attack creatures up to 10 feet away instead of only adjacent creatures. For creatures that already have reach with the limb or limbs that wield the weapon, the weapon increases their reach by 5 feet.', have: function () { return $scope.trait_db.have(this); }, },
        { name: 'Shove', showon: 'Athletics', desc: 'You can use this weapon to Shove with the Athletics skill even if you don\'t have a free hand. This uses the weapon\'s reach (if different from your own) and adds the weapon\'s item bonus to attack rolls as an item bonus to the Athletics check. If you critically fail a check to Shove using the weapon, you can drop the weapon to take the effects of a failure instead of a critical failure.', have: function () { return $scope.trait_db.have(this); }, },
        { name: 'Sweep', showon: 'Athletics', desc: 'This weapon makes wide sweeping or spinning attacks, making it easier to attack multiple enemies. When you attack with this weapon, you gain a +1 circumstance bonus to your attack roll if you already attempted to attack a different target this turn using this weapon.', have: function () { return $scope.trait_db.have(this); }, },
        { name: 'Tethered', showon: '', desc: 'This weapon is attached to a length of rope or chain that allows you to retrieve it after it has left your hand. If you have a free hand while wielding this weapon, you can use an Interact action to pull the weapon back into your grasp after you have thrown it as a ranged attack or after it has been disarmed (unless it is being held by another creature).', have: function () { return $scope.trait_db.have(this); }, },
        { name: 'Thrown', showon: '', desc: 'You can throw this weapon as a ranged attack, and it is a ranged weapon when thrown. A thrown weapon adds your Strength modifier to damage just like a melee weapon does. When this trait appears on a melee weapon, it also includes the range increment. Ranged weapons with this trait use the range increment specified in the weapon\'s Range entry.', have: function () { return $scope.trait_db.have(this); }, dmgbonus: function () { return $scope.abilities.byName("Strength").mod(); }, },
        { name: 'Trip', showon: 'Athletics', desc: 'You can use this weapon to Trip with the Athletics skill even if you don\'t have a free hand. This uses the weapon\'s reach (if different from your own) and adds the weapon\'s item bonus to attack rolls as an item bonus to the Athletics check. If you critically fail a check to Trip using the weapon, you can drop the weapon to take the effects of a failure instead of a critical failure.', have: function () { return $scope.trait_db.have(this); }, },
        { name: 'Twin', showon: '', desc: 'These weapons are used as a pair, complementing each other. When you attack with a twin weapon, you add a circumstance bonus to the damage roll equal to the weapon\'s number of damage dice if you have previously attacked with a different weapon of the same type this turn. The weapons must be of the same type to benefit from this trait, but they don\'t need to have the same runes.', have: function () { return $scope.trait_db.have(this); }, },
        { name: 'Two-Hand', showon: '', desc: 'This weapon can be wielded with two hands. Doing so changes its weapon damage die to the indicated value. This change applies to all the weapon\'s damage dice, such as those from striking runes.', have: function () { return $scope.trait_db.have(this); }, },
        { name: 'Unarmed', showon: '', desc: 'An unarmed attack uses your body rather than a manufactured weapon. An unarmed attack isn\'t a weapon, though it\'s categorized with weapons for weapon groups, and it might have weapon traits. Since it\'s part of your body, an unarmed attack can\'t be Disarmed. It also doesn\'t take up a hand, though a fist or other grasping appendage follows the same rules as a free-hand weapon.', have: function () { return $scope.trait_db.have(this); }, },
        { name: 'Versatile', showon: '', desc: 'A versatile weapon can be used to deal a different type of damage than that listed in the Damage entry. This trait indicates the alternate damage type. For instance, a piercing weapon that is versatile S can be used to deal piercing or slashing damage. You choose the damage type each time you make an attack.', have: function () { return $scope.trait_db.have(this); }, },
        { name: 'Volley', showon: '', desc: 'This ranged weapon is less effective at close distances. Your attacks against targets that are at a distance within the range listed take a -2 penalty.', have: function () { return $scope.trait_db.have(this); }, },
        { name: 'Bulwark', showon: 'Reflex', desc: 'The armor covers you so completely that it provides benefits against some damaging effects. On Reflex saves to avoid a damaging effect, such as a fireball, you add a +3 modifier instead of your Dexterity modifier.', have: function () { return $scope.trait_db.have(this); }, },
        { name: 'Comfort', showon: '', desc: 'The armor is so comfortable that you can rest normally while wearing it.', have: function () { return $scope.trait_db.have(this); }, },
        { name: 'Flexible', showon: '', desc: 'The armor is flexible enough that it doesn\'t hinder most actions. You don\'t apply its check penalty to Acrobatics or Athletics checks.', have: function () { return $scope.trait_db.have(this); }, },
        { name: 'Noisy', showon: '', desc: 'This armor is loud and likely to alert others to your presence. The armor\'s check penalty applies to Stealth checks even if you meet the required Strength score.', have: function () { return $scope.trait_db.have(this); }, },
    ];
    //The feats list is full of feats that don't do anything yet. Others just add a little hint to a property like a skill or have an active effect.
    //Feats that require or affect a Lore skill get expanded or copied (in case of lorebase:true) when a new Lore skill gets added, so this list can vary in the runtime
    //canChoose() is a function where all the -req fields are evaluated. specialreq is for feats that have uncommon requirements (such as "no Deity selected") and needs to be a string that contains a true/false evaluation
    //name:string,desc:string,levelreq:number,lorebase:boolean,skillreq:string,abilityreq:string,featreq:string,specialreq:string,weaponreq:string,armorreq:string,showon:string,traits:string[],effects:string[],have:boolean
    $scope.feat_db = [
        new Feat('Fleet', 'Increase your Speed by 5 feet.', 1, false, '', '', '', '', '', '', 'speed', ['General'], ['speed +5'], false),
        new Feat('Weapon Proficiency: Simple Weapons', 'Become trained in a weapon type.', 1, false, '', '', '', '', '', '', 'weaponProfs', ['General'], ['Simple =2'], false),
        new Feat('Armor Proficiency: Medium armor', 'Become trained in a type of armor.', 1, false, '', '', '', '', '', "Light, 2", 'medium', ['General'], ['Medium =2'], false),
        new Feat('Weapon Proficiency: Martial Weapons', 'Become trained in a weapon type.', 1, false, '', '', '', '', "Simple, 2", '', '', ['General'], ['Martial =2'], false),
        new Feat('Armor Proficiency: Light armor', 'Become trained in a type of armor.', 1, false, '', '', '', '', '', '', 'light', ['General'], ['Light =2'], false),
        new Feat('Armor Proficiency: Heavy armor', 'Become trained in a type of armor.', 1, false, '', '', '', '', '', "Medium, 2", 'heavy', ['General'], ['Heavy =2'], false),
        new Feat('Additional Lore', 'Become trained in another Lore subcategory.', 1, false, "Lore, 2", '', '', '', '', '', '', ['General', 'Skill'], [], false),
        new Feat('Adopted Ancestry: Dwarf', 'Gain access to ancestry feats from another ancestry.', 1, false, '', '', '', '', '', '', '', ['General'], [], false),
        new Feat('Adopted Ancestry: Elf', 'Gain access to ancestry feats from another ancestry.', 1, false, '', '', '', '', '', '', '', ['General'], [], false),
        new Feat('Adopted Ancestry: Gnome', 'Gain access to ancestry feats from another ancestry.', 1, false, '', '', '', '', '', '', '', ['General'], [], false),
        new Feat('Adopted Ancestry: Goblin', 'Gain access to ancestry feats from another ancestry.', 1, false, '', '', '', '', '', '', '', ['General'], [], false),
        new Feat('Adopted Ancestry: Halfling', 'Gain access to ancestry feats from another ancestry.', 1, false, '', '', '', '', '', '', '', ['General'], [], false),
        new Feat('Adopted Ancestry: Orc', 'Gain access to ancestry feats from another ancestry.', 1, false, '', '', '', '', '', '', '', ['General'], [], false),
        new Feat('Alchemical Crafting', 'Craft alchemical items.', 1, false, "Crafting, 2", '', '', '', '', '', 'crafting', ['General', 'Skill'], [], false),
        new Feat('Ancestral Paragon', 'Gain a 1st-level ancestry feat.', 3, false, '', '', '', '', '', '', '', ['General'], [], false),
        new Feat('Arcane Sense', 'Cast detect magic at will as an arcane innate spell.', 1, false, "Arcana, 2", '', '', '', '', '', 'arcana', ['General', 'Skill'], [], false),
        new Feat('Assurance: Acrobatics', 'Receive a fixed result on a skill check.', 1, false, "Acrobatics, 2", '', '', '', '', '', 'acrobatics', ['General', 'Fortune', 'Skill'], [], false),
        new Feat('Assurance: Arcana', 'Receive a fixed result on a skill check.', 1, false, "Arcana, 2", '', '', '', '', '', 'arcana', ['General', 'Fortune', 'Skill'], [], false),
        new Feat('Assurance: Athletics', 'Receive a fixed result on a skill check.', 1, false, "Athletics, 2", '', '', '', '', '', 'athletics', ['General', 'Fortune', 'Skill'], [], false),
        new Feat('Assurance: Crafting', 'Receive a fixed result on a skill check.', 1, false, "Crafting, 2", '', '', '', '', '', 'crafting', ['General', 'Fortune', 'Skill'], [], false),
        new Feat('Assurance: Deception', 'Receive a fixed result on a skill check.', 1, false, "Deception, 2", '', '', '', '', '', 'deception', ['General', 'Fortune', 'Skill'], [], false),
        new Feat('Assurance: Diplomacy', 'Receive a fixed result on a skill check.', 1, false, "Diplomacy, 2", '', '', '', '', '', 'diplomacy', ['General', 'Fortune', 'Skill'], [], false),
        new Feat('Assurance: Intimidation', 'Receive a fixed result on a skill check.', 1, false, "Intimidation, 2", '', '', '', '', '', 'intimidation', ['General', 'Fortune', 'Skill'], [], false),
        new Feat('Assurance: Lore', 'Receive a fixed result on a skill check.', 1, true, "Lore, 2", '', '', '', '', '', 'Lore', ['General', 'Fortune', 'Skill'], [], false),
        new Feat('Assurance: Medicine', 'Receive a fixed result on a skill check.', 1, false, "Medicine, 2", '', '', '', '', '', 'medicine', ['General', 'Fortune', 'Skill'], [], false),
        new Feat('Assurance: Nature', 'Receive a fixed result on a skill check.', 1, false, "Nature, 2", '', '', '', '', '', 'nature', ['General', 'Fortune', 'Skill'], [], false),
        new Feat('Assurance: Occultism', 'Receive a fixed result on a skill check.', 1, false, "Occultism, 2", '', '', '', '', '', 'occultism', ['General', 'Fortune', 'Skill'], [], false),
        new Feat('Assurance: Performance', 'Receive a fixed result on a skill check.', 1, false, "Performance, 2", '', '', '', '', '', 'performance', ['General', 'Fortune', 'Skill'], [], false),
        new Feat('Assurance: Religion', 'Receive a fixed result on a skill check.', 1, false, "Religion, 2", '', '', '', '', '', 'religion', ['General', 'Fortune', 'Skill'], [], false),
        new Feat('Assurance: Society', 'Receive a fixed result on a skill check.', 1, false, "Society, 2", '', '', '', '', '', 'society', ['General', 'Fortune', 'Skill'], [], false),
        new Feat('Assurance: Stealth', 'Receive a fixed result on a skill check.', 1, false, "Stealth, 2", '', '', '', '', '', 'stealth', ['General', 'Fortune', 'Skill'], [], false),
        new Feat('Assurance: Survival', 'Receive a fixed result on a skill check.', 1, false, "Survival, 2", '', '', '', '', '', 'survival', ['General', 'Fortune', 'Skill'], [], false),
        new Feat('Assurance: Thievery', 'Receive a fixed result on a skill check.', 1, false, "Thievery, 2", '', '', '', '', '', 'thievery', ['General', 'Fortune', 'Skill'], [], false),
        new Feat('Automatic Knowledge: Arcana', 'Recall Knowledge as a free action once per round.', 2, false, "Arcana, 4", '', 'Assurance: Arcana', '', '', '', 'arcana', ['General', 'Skill'], [], false),
        new Feat('Automatic Knowledge: Crafting', 'Recall Knowledge as a free action once per round.', 2, false, "Crafting, 4", '', 'Assurance: Crafting', '', '', '', 'crafting', ['General', 'Skill'], [], false),
        new Feat('Automatic Knowledge: Lore', 'Recall Knowledge as a free action once per round.', 2, true, "Lore, 4", '', 'Assurance: Lore', '', '', '', 'Lore', ['General', 'Skill'], [], false),
        new Feat('Automatic Knowledge: Medicine', 'Recall Knowledge as a free action once per round.', 2, false, "Medicine, 4", '', 'Assurance: Medicine', '', '', '', 'medicine', ['General', 'Skill'], [], false),
        new Feat('Automatic Knowledge: Nature', 'Recall Knowledge as a free action once per round.', 2, false, "Nature, 4", '', 'Assurance: Nature', '', '', '', 'nature', ['General', 'Skill'], [], false),
        new Feat('Automatic Knowledge: Occultism', 'Recall Knowledge as a free action once per round.', 2, false, "Occultism, 4", '', 'Assurance: Occultism', '', '', '', 'occultism', ['General', 'Skill'], [], false),
        new Feat('Automatic Knowledge: Religion', 'Recall Knowledge as a free action once per round.', 2, false, "Religion, 4", '', 'Assurance: Religion', '', '', '', 'religion', ['General', 'Skill'], [], false),
        new Feat('Automatic Knowledge: Society', 'Recall Knowledge as a free action once per round.', 2, false, "Society, 4", '', 'Assurance: Society', '', '', '', 'society', ['General', 'Skill'], [], false),
        new Feat('Backup Disguise', 'You have a specific disguise that you keep at the ready, worn underneath your outer garment.', 2, false, "Deception, 4", '', '', '', '', '', 'deception', ['General', 'Skill', 'Uncommon'], [], false),
        new Feat('Bargain Hunter', 'Earn Income by searching for deals.', 1, false, "Diplomacy, 2", '', '', '', '', '', 'diplomacy', ['General', 'Skill'], [], false),
        new Feat('Battle Cry', 'Demoralizes foes when you roll for initiative.', 7, false, "Intimidation, 6", '', '', '', '', '', 'intimidation', ['General', 'Skill'], [], false),
        new Feat('Battle Medicine', 'Heal yourself or an ally in battle.', 1, false, "Medicine, 2", '', '', '', '', '', 'medicine', ['General', 'Healing', 'Manipulate', 'Skill'], [], false),
        new Feat('Bizarre Magic', 'Your magic becomes more difficult to identify.', 7, false, "Occultism, 6", '', '', '', '', '', 'occultism', ['General', 'Skill'], [], false),
        new Feat('Bonded Animal', 'An animal becomes permanently helpful to you.', 2, false, "Nature, 4", '', '', '', '', '', 'nature', ['General', 'Downtime', 'Skill'], [], false),
        new Feat('Breath Control', 'Hold your breath longer and gain benefits against inhaled threats.', 1, false, '', '', '', '', '', '', 'fortitude', ['General'], [], false),
        new Feat('Canny Acumen: Fortitude', 'Become an expert in a saving throw or Perception.', 1, false, '', '', '', '', '', '', '', ['General'], [], false),
        new Feat('Canny Acumen: Perception', 'Become an expert in a saving throw or Perception.', 1, false, '', '', '', '', '', '', '', ['General'], [], false),
        new Feat('Canny Acumen: Reflex', 'Become an expert in a saving throw or Perception.', 1, false, '', '', '', '', '', '', '', ['General'], [], false),
        new Feat('Canny Acumen: Will', 'Become an expert in a saving throw or Perception.', 1, false, '', '', '', '', '', '', '', ['General'], [], false),
        new Feat('Cat Fall', 'Treat falls as shorter than they are.', 1, false, "Acrobatics, 2", '', '', '', '', '', 'acrobatics', ['General', 'Skill'], [], false),
        new Feat('Charming Liar', 'Improve a target\'s attitude with your lies.', 1, false, "Deception, 2", '', '', '', '', '', 'deception', ['General', 'Skill'], [], false),
        new Feat('Cloud Jump', 'Jump impossible distances.', 15, false, "Athletics, 8", '', '', '', '', '', 'athletics', ['General', 'Skill'], [], false),
        new Feat('Combat Climber', 'Fight more effectively as you Climb.', 1, false, "Athletics, 2", '', '', '', '', '', 'athletics', ['General', 'Skill'], [], false),
        new Feat('Confabulator', 'Reduce the bonuses against your repeated lies.', 2, false, "Deception, 4", '', '', '', '', '', 'deception', ['General', 'Skill'], [], false),
        new Feat('Connections', 'Leverage your connections for favors and meetings.', 2, false, "Society, 4", '', 'Courtly Graces', '', '', '', 'society', ['General', 'Skill'], [], false),
        new Feat('Continual Recovery', 'Treat Wounds on a patient more often.', 2, false, "Medicine, 4", '', '', '', '', '', 'medicine', ['General', 'Skill'], [], false),
        new Feat('Courtly Graces', 'Use Society to get along in noble society.', 1, false, "Society, 2", '', '', '', '', '', 'society', ['General', 'Skill'], [], false),
        new Feat('Craft Anything', 'Ignore most requirements for crafting items.', 15, false, "Crafting, 8", '', '', '', '', '', 'crafting', ['General', 'Skill'], [], false),
        new Feat('Diehard', 'Die at dying 5, rather than dying 4.', 1, false, '', '', '', '', '', '', 'health', ['General'], [], false),
        new Feat('Different Worlds', 'Create a second identity for yourself with a different name, history, and background.', 1, false, '', '', '', '', '', '', '', ['General', 'Uncommon'], [], false),
        new Feat('Divine Guidance', 'Find guidance in the writings of your faith.', 15, false, "Religion, 8", '', '', '', '', '', 'religion', ['General', 'Skill'], [], false),
        new Feat('Dubious Knowledge', 'Learn true and erroneous knowledge on failed check.', 1, false, "Arcana, 2|Crafting, 2|Lore, 2|Medicine, 2|Nature, 2|Occultism, 2|Religion, 2|Society, 2", '', '', '', '', '', 'arcana, crafting, lore, medicine, nature, occultism, religion, society', ['General', 'Skill'], [], false),
        new Feat('Entourage', 'You have a small group of admirers who tend to follow you around while you\'re in civilized settlements.', 7, false, "Diplomacy, 6", '', 'Hobnobber', '', '', '', 'diplomacy', ['General', 'Rare', 'Skill'], [], false),
        new Feat('Expeditious Search', 'Search areas in half the time.', 7, false, "Perception, 6", '', '', '', '', '', 'perception', ['General'], [], false),
        new Feat('Experienced Professional', 'Prevent critical failures when Earning Income.', 1, false, "Lore, 2", '', '', '', '', '', 'lore', ['General', 'Skill'], [], false),
        new Feat('Experienced Smuggler', 'Conceal items from observers more effectively.', 1, false, "Stealth, 2", '', '', '', '', '', 'stealth', ['General', 'Skill'], [], false),
        new Feat('Experienced Tracker', 'Track at your full Speed at a –5 penalty.', 1, false, "Survival, 2", '', '', '', '', '', 'survival', ['General', 'Skill'], [], false),
        new Feat('Eye of the Arclords', 'The Arclords of Nex have achieved a unique mastery of magic.', 2, false, "Arcana, 4", '', 'Arcane Sense', '', '', '', 'arcana', ['General', 'Skill', 'Uncommon'], [], false),
        new Feat('Fascinating Performance', 'Perform to fascinate observers.', 1, false, "Performance, 2", '', '', '', '', '', 'performance', ['General', 'Skill'], [], false),
        new Feat('Fast Recovery', 'Regain more HP from rest, recover faster from disease and poisons.', 1, false, '', "Constitution, 14", '', '', '', '', 'health, fortitude', ['General'], [], false),
        new Feat('Feather Step', 'Step into difficult terrain.', 1, false, '', "Dexterity, 14", '', '', '', '', 'speed', ['General'], [], false),
        new Feat('Foil Senses', 'Take precautions against special senses.', 7, false, "Stealth, 6", '', '', '', '', '', 'stealth', ['General', 'Skill'], [], false),
        new Feat('Forager', 'Forage for supplies to provide for multiple creatures.', 1, false, "Survival, 2", '', '', '', '', '', 'survival', ['General', 'Skill'], [], false),
        new Feat('Glad-Hand', 'Make an Impression on a target you\'ve just met.', 2, false, "Diplomacy, 4", '', '', '', '', '', 'diplomacy', ['General', 'Skill'], [], false),
        new Feat('Godless Healing', 'With limited access to divine healing magic, Rahadoumi often become adept at using ordinary medicine for when dangerous situations arise.', 2, false, '', '', 'Battle Medicine', '$scope.character.deity==""', '', '', 'medicine', ['General', 'Skill'], [], false),
        new Feat('Group Coercion', 'Coerce multiple targets simultaneously.', 1, false, "Intimidation, 2", '', '', '', '', '', 'intimidation', ['General', 'Skill'], [], false),
        new Feat('Group Impression', 'Make an Impression on multiple targets at once.', 1, false, "Diplomacy, 2", '', '', '', '', '', 'diplomacy', ['General', 'Skill'], [], false),
        new Feat('Hefty Hauler', 'Increase your Bulk limits by 2.', 1, false, "Athletics, 2", '', '', '', '', '', 'athletics', ['General', 'Skill'], [], false),
        new Feat('Hobnobber', 'Gather Information rapidly.', 1, false, "Diplomacy, 2", '', '', '', '', '', 'diplomacy', ['General', 'Skill'], [], false),
        new Feat('Impeccable Crafter', 'Specialty Crafting Craft items more efficiently.', 7, false, "Crafting, 6", '', 'Specialty Crafting', '', '', '', 'crafting', ['General', 'Skill'], [], false),
        new Feat('Impressive Performance', 'Make an Impression with Performance.', 1, false, "Performance, 2", '', '', '', '', '', 'performance', ['General', 'Skill'], [], false),
        new Feat('Incredible Initiative', '+2 to initiative rolls.', 1, false, '', '', '', '', '', '', 'perception', ['General'], [], false),
        new Feat('Incredible Investiture', 'Invest up to 12 magic items.', 11, false, '', "Charisma, 16", '', '', '', '', 'items', ['General'], [], false),
        new Feat('Intimidating Glare', 'Demoralize a creature without speaking.', 1, false, "Intimidation, 2", '', '', '', '', '', 'intimidation', ['General', 'Skill'], [], false),
        new Feat('Intimidating Prowess', 'Gain a bonus to physically Demoralize a target.', 2, false, "Intimidation, 4", "Strength, 16", '', '', '', '', 'intimidation', ['General', 'Skill'], [], false),
        new Feat('Inventor', 'Use Crafting to create item formulas.', 7, false, "Crafting, 6", '', '', '', '', '', 'crafting', ['General', 'Downtime', 'Skill'], [], false),
        new Feat('Kip Up', 'Stand up for free without triggering reactions.', 7, false, "Acrobatics, 6", '', '', '', '', '', 'acrobatics', ['General', 'Skill'], [], false),
        new Feat('Lasting Coercion', 'Coerce a target into helping you longer.', 2, false, "Intimidation, 4", '', '', '', '', '', 'intimidation', ['General', 'Skill'], [], false),
        new Feat('Legendary Codebreaker', 'Quickly Decipher Writing using Society.', 15, false, "Society, 8", '', '', '', '', '', 'society', ['General', 'Skill'], [], false),
        new Feat('Legendary Linguist', 'Create pidgin languages to communicate with anyone.', 15, false, "Society, 8", '', 'Multilingual', '', '', '', 'society', ['General', 'Skill'], [], false),
        new Feat('Legendary Medic', 'Remove disease or the blinded, deafened, doomed, or drained condition.', 15, false, "Medicine, 8", '', '', '', '', '', 'medicine', ['General', 'Skill'], [], false),
        new Feat('Legendary Negotiation', 'Quickly parley with foes.', 15, false, "Diplomacy, 8", '', '', '', '', '', 'diplomacy', ['General', 'Skill'], [], false),
        new Feat('Legendary Performer', 'Gain renown for your Performance Virtuosic Performer.', 15, false, "Performance, 8", '', 'Virtuosic Performer', '', '', '', 'performer', ['General', 'Skill'], [], false),
        new Feat('Legendary Professional', 'Gain renown for your Lore.', 15, false, "Lore, 8", '', '', '', '', '', 'lore', ['General', 'Skill'], [], false),
        new Feat('Legendary Sneak', 'Hide and Sneak without cover or being concealed.', 15, false, "Stealth, 8", '', 'Swift Sneak', '', '', '', 'stealth', ['General', 'Skill'], [], false),
        new Feat('Legendary Survivalist', 'Survive extreme conditions.', 15, false, "Survival, 8", '', '', '', '', '', 'survival', ['General', 'Skill'], [], false),
        new Feat('Legendary Thief', 'Steal what would normally be impossible to steal.', 15, false, "Thievery, 8", '', 'Pickpocket', '', '', '', 'thievery', ['General', 'Skill'], [], false),
        new Feat('Lengthy Diversion', 'Remain hidden after you Create a Diversion.', 1, false, "Deception, 2", '', '', '', '', '', 'deception', ['General', 'Skill'], [], false),
        new Feat('Lie to Me', 'Use Deception to detect lies.', 1, false, "Deception, 2", '', '', '', '', '', 'deception', ['General', 'Skill'], [], false),
        new Feat('Magical Crafting', 'Craft magic items.', 2, false, "Crafting, 4", '', '', '', '', '', 'crafting', ['General', 'Skill'], [], false),
        new Feat('Magical Shorthand', 'Expert in Arcana, Nature, Occultism, Learn spells quickly and at a reduced cost.', 2, false, "Arcana, 4|Nature, 4|Occultism, 4|Religion, 4", '', '', '', '', '', 'arcana, nature, occultism, religion', ['General', 'Skill'], [], false),
        new Feat('Multilingual', 'Learn two new languages.', 1, false, "Society, 2", '', '', '', '', '', 'society', ['General', 'Skill'], [], false),
        new Feat('Natural Medicine', 'Use Nature to Treat Wounds.', 1, false, "Nature, 2", '', '', '', '', '', 'nature', ['General', 'Skill'], [], false),
        new Feat('Nimble Crawl', 'Crawl at a faster rate.', 2, false, "Acrobatics, 4", '', '', '', '', '', 'acrobatics', ['General', 'Skill'], [], false),
        new Feat('Oddity Identification', '+2 to Occultism checks to Identify Magic with certain traits.', 1, false, "Occultism, 2", '', '', '', '', '', 'occultism', ['General', 'Skill'], [], false),
        new Feat('Pickpocket', 'Steal or Palm an Object more effectively.', 1, false, "Thievery, 2", '', '', '', '', '', 'thievery', ['General', 'Skill'], [], false),
        new Feat('Planar Survival', 'Use Survival to Subsist on different planes.', 7, false, "Survival, 6", '', '', '', '', '', 'survival', ['General', 'Skill'], [], false),
        new Feat('Powerful Leap', 'Jump farther and higher.', 2, false, "Athletics, 4", '', '', '', '', '', 'athletics', ['General', 'Skill'], [], false),
        new Feat('Quick Climber', 'Climb swiftly.', 7, false, "Athletics, 6", '', '', '', '', '', 'athletics', ['General', 'Skill'], [], false),
        new Feat('Quick Coercion', 'Coerce a creature quickly.', 1, false, "Intimidation, 2", '', '', '', '', '', 'intimidation', ['General', 'Skill'], [], false),
        new Feat('Quick Disguise', 'Set up a disguise in only half the time.', 2, false, "Deception, 4", '', '', '', '', '', 'deception', ['General', 'Skill'], [], false),
        new Feat('Quick Identification', 'Identify Magic in 1 minute or less.', 1, false, "Arcana, 2|Nature, 2|Occultism, 2|Religion, 2", '', '', '', '', '', 'arcana, nature, occultism, religion', ['General', 'Skill'], [], false),
        new Feat('Quick Jump', 'High Jump or Long Jump as a single action.', 1, false, "Athletics, 2", '', '', '', '', '', 'athletics', ['General', 'Skill'], [], false),
        new Feat('Quick Recognition', 'Master in Arcana, Nature, Occultism, Identify spells as a free action.', 7, false, "Arcana, 6 OR Nature, 6 OR Occultism, 6 OR Religion, 6", '', 'Recognize Spell', '', '', '', 'arcana, nature, occultism, religion', ['General', 'Skill'], [], false),
        new Feat('Quick Repair', 'Repair items quickly.', 1, false, "Crafting, 2", '', '', '', '', '', 'crafting', ['General', 'Skill'], [], false),
        new Feat('Quick Squeeze', 'Move swiftly as you Squeeze.', 1, false, "Acrobatics, 2", '', '', '', '', '', 'acrobatics', ['General', 'Skill'], [], false),
        new Feat('Quick Swim', 'Swim quickly.', 7, false, "Athletics, 6", '', '', '', '', '', 'athletics', ['General', 'Skill'], [], false),
        new Feat('Quick Unlock', 'Pick a Lock with 1 action.', 7, false, "Thievery, 6", '', '', '', '', '', 'thievery', ['General', 'Skill'], [], false),
        new Feat('Quiet Allies', 'Roll a single Stealth check when sneaking with allies.', 2, false, "Stealth, 4", '', '', '', '', '', 'stealth', ['General', 'Skill'], [], false),
        new Feat('Rapid Mantel', 'Pull yourself onto ledges quickly.', 2, false, "Athletics, 4", '', '', '', '', '', 'athletics', ['General', 'Skill'], [], false),
        new Feat('Read Lips', 'Read the lips of people you can see.', 1, false, "Society, 2", '', '', '', '', '', 'society', ['General', 'Skill'], [], false),
        new Feat('Recognize Spell', 'Identify a spell as a reaction as it\'s being cast.', 1, false, "Arcana, 2|Nature, 2|Occultism, 2|Religion, 2", '', '', '', '', '', 'arcana, nature, occultism, religion', ['General', 'Secret', 'Skill'], [], false),
        new Feat('Reveal Machinations', 'You convince a creature that you played a minor but recurring role in its life.', 15, false, "Deception, 8", '', '', '', '', '', 'deception', ['General', 'Rare', 'Skill'], [], false),
        new Feat('Ride', 'Automatically succeed at commanding your mount to move.', 1, false, '', '', '', '', '', '', 'nature', ['General'], [], false),
        new Feat('Robust Recovery', 'Greater benefits from Treat Disease and Treat Poison.', 2, false, "Medicine, 4", '', '', '', '', '', 'medicine', ['General', 'Skill'], [], false),
        new Feat('Scare to Death', 'Scare a target so much, they might die.', 15, false, "Intimidation, 8", '', '', '', '', '', 'intimidation', ['General', 'Death', 'Emotion', 'Fear', 'Incapacitation', 'Skill'], [], false),
        new Feat('Secret Speech', 'Learn the secret language of a society.', 1, false, "Deception, 2", '', '', '', '', '', 'deception', ['General', 'Skill', 'Uncommon'], [], false),
        new Feat('Shameless Request', 'Make Requests of others with lesser consequences.', 7, false, "Diplomacy, 6", '', '', '', '', '', 'diplomacy', ['General', 'Skill'], [], false),
        new Feat('Shield Block', 'Ward off a blow with your shield.', 1, false, '', '', '', '', '', '', 'defense', ['General'], [], false),
        new Feat('Sign Language', 'Learn sign languages.', 1, false, "Society, 2", '', '', '', '', '', 'society', ['General', 'Skill'], [], false),
        new Feat('Skill Training', 'Become trained in a skill.', 1, false, '', "Intelligence, 12", '', '', '', '', '', ['General', 'Skill'], [], false),
        new Feat('Slippery Secrets', 'Evade attempts to uncover your true nature.', 7, false, "Deception, 6", '', '', '', '', '', 'deception', ['General', 'Skill'], [], false),
        new Feat('Snare Crafting', 'Craft snares.', 1, false, "Crafting, 2", '', '', '', '', '', 'crafting', ['General', 'Skill'], [], false),
        new Feat('Sow Rumor', 'You spread rumors, which may or may not be true, about a specific subject.', 2, false, "Deception, 4", '', '', '', '', '', 'deception', ['General', 'Secret', 'Skill', 'Uncommon'], [], false),
        new Feat('Specialty Crafting', 'Gain bonuses to Craft certain items.', 1, false, "Crafting, 2", '', '', '', '', '', 'crafting', ['General', 'Skill'], [], false),
        new Feat('Steady Balance', 'Maintain your balance in adverse conditions.', 1, false, "Acrobatics, 2", '', '', '', '', '', 'acrobatics', ['General', 'Skill'], [], false),
        new Feat('Streetwise', 'Use Society to Gather Information and Recall Knowledge.', 1, false, "Society, 2", '', '', '', '', '', 'society', ['General', 'Skill'], [], false),
        new Feat('Student of the Canon', 'More accurately recognize the tenets of your faith or philosophy.', 1, false, "Religion, 2", '', '', '', '', '', 'religion', ['General', 'Skill'], [], false),
        new Feat('Subtle Theft', 'Your thefts are harder to notice.', 1, false, "Thievery, 2", '', '', '', '', '', 'thievery', ['General', 'Skill'], [], false),
        new Feat('Survey Wildlife', 'Identify nearby creatures through signs and clues.', 1, false, "Survival, 2", '', '', '', '', '', 'survival', ['General', 'Skill'], [], false),
        new Feat('Swift Sneak', 'Move your full Speed while you Sneak.', 7, false, "Stealth, 6", '', '', '', '', '', 'stealth', ['General', 'Skill'], [], false),
        new Feat('Terrain Expertise', '+1 to Survival checks in certain terrain.', 1, false, "Survival, 2", '', '', '', '', '', 'survival', ['General', 'Skill'], [], false),
        new Feat('Terrain Stalker', 'Sneak in certain terrain without attempting a check.', 1, false, "Stealth, 2", '', '', '', '', '', 'stealth', ['General', 'Skill'], [], false),
        new Feat('Terrified Retreat', 'Cause foes you Demoralize to flee.', 7, false, "Intimidation, 6", '', '', '', '', '', 'intimidation', ['General', 'Skill'], [], false),
        new Feat('Titan Wrestler', 'Disarm, Grapple, Shove, or Trip larger creatures.', 1, false, "Athletics, 2", '', '', '', '', '', 'athletics', ['General', 'Skill'], [], false),
        new Feat('Toughness', 'Increase your maximum HP and reduce the DCs of recovery checks.', 1, false, '', '', '', '', '', '', 'health', ['General'], [], false),
        new Feat('Train Animal', 'Teach an animal a trick.', 1, false, "Nature, 2", '', '', '', '', '', 'nature', ['General', 'Downtime', 'Manipulate', 'Skill'], [], false),
        new Feat('Trick Magic Item', 'Activate a magic item you normally can\'t activate.', 1, false, "Arcana, 2|Nature, 2|Occultism, 2|Religion, 2", '', '', '', '', '', 'arcana, nature, occultism, religion', ['General', 'Manipulate', 'Skill'], [], false),
        new Feat('Tweak Appearances', 'You can alter a creature\'s clothing to improve their social impact.', 2, false, "Crafting, 4", '', '', '', '', '', 'crafting', ['General', 'Skill', 'Uncommon'], [], false),
        new Feat('Underwater Marauder', 'Fight more effectively underwater.', 1, false, "Athletics, 2", '', '', '', '', '', 'athletics', ['General', 'Skill'], [], false),
        new Feat('Unified Theory', 'Use Arcana for checks for all magical traditions.', 15, false, "Arcana, 8", '', '', '', '', '', 'arcana', ['General', 'Skill'], [], false),
        new Feat('Unmistakable Lore', 'Recall Knowledge about your Lore more effectively.', 2, false, "Lore, 2", '', '', '', '', '', 'Lore', ['General', 'Skill'], [], false),
        new Feat('Untrained Improvisation', 'Become more adept at using untrained skills.', 3, false, '', '', '', '', '', '', '', ['General'], [], false),
        new Feat('Virtuosic Performer', '+1 with a certain type of performance.', 1, false, "Performance, 2", '', '', '', '', '', 'performance', ['General', 'Skill'], [], false),
        new Feat('Wall Jump', 'Jump of walls.', 7, false, "Athletics, 6", '', '', '', '', '', 'athletics', ['General', 'Skill'], [], false),
        new Feat('Ward Medic', 'Treat several patients at once.', 2, false, "Medicine, 4", '', '', '', '', '', 'medicine', ['General', 'Skill'], [], false),
        new Feat('Wary Disarmament', '+2 to AC or saves against devices or traps you trigger while disarming.', 2, false, "Thievery, 4", '', '', '', '', '', 'thievery', ['General', 'Skill'], [], false),
        new Feat('Weapon Proficiency: Advanced Weapon', 'Become trained in a weapon type.', 1, false, '', '', '', '', "Martial, 2", '', '', ['General'], [], false),
        new Feat('Wilderness Spotter', 'Use Survival for your Initiative when in a specific terrain.', 2, false, "Survival, 4", '', '', '', '', '', 'survival', ['General', 'Skill', 'Uncommon'], [], false),
    ];
    $scope.newLore = "";
    //The result of effects() is stored in effectsData to avoid infdig from stability checks (and running effects() too much).
    //Only the effects list should call effects(), all other functions can use effectsData instead.
    $scope.effectsData = [];
    //scope functions
    $scope.initNotes = function (objects) {
        //Only used when the page is loaded. In the given objects, if there is a note, enable showing the note.
        angular.forEach(objects, function (obj) {
            obj.showNotes = obj.note ? true : false;
        });
    };
    //all these functions allow getting an entry from a list by its name instead of its index. This is always strict.
    //If there are multiple entries with the same name, only the first is used, so make sure you don't use duplicate names or don't use them in functions that should affect all of them.
    //Pathfinder avoids duplicate names, but you can add the same item to your inventory multiple times.
    $scope.abilities.byName = function ($name) {
        return $filter('filter')($scope.abilities, { name: $name }, true)[0];
    };
    $scope.skills.byName = function ($name) {
        return $filter('filter')($scope.skills, { name: $name }, true)[0];
    };
    $scope.saves.byName = function ($name) {
        return $filter('filter')($scope.saves, { name: $name }, true)[0];
    };
    $scope.feat_db.byName = function ($name) {
        return $filter('filter')($scope.feat_db, { name: $name }, true)[0];
    };
    $scope.weaponProfs.byName = function ($name) {
        return $filter('filter')($scope.weaponProfs, { name: $name }, true)[0];
    };
    $scope.armorProfs.byName = function ($name) {
        return $filter('filter')($scope.armorProfs, { name: $name }, true)[0];
    };
    $scope.items.byName = function ($name) {
        return $filter('filter')($scope.items, { name: $name }, true)[0];
    };
    $scope.item_db.byName = function ($name) {
        return $filter('filter')($scope.item_db, { name: $name }, true)[0];
    };
    $scope.trait_db.byName = function ($name) {
        //When getting a Trait by name, only the first word is searched. Traits are always one word, but a weapon may have "Thrown 10ft" instead of just "Thrown".
        return $filter('filter')($scope.trait_db, { name: $name.split(" ")[0] }, true)[0];
    };
    $scope.getEffects = function ($affectedObj) {
        //Gets the sum of all effects on this object and writes the list into its effects property
        //Requires the passed object to have both a name and an effect property
        let result = 0;
        //reset the object's effects property
        $affectedObj.effects.length = 0;
        //If any effect in $scope.effectsData has the object's name as a target and is marked as applicable, add it to the effect bonus and list its value and source in the object's own effects property
        angular.forEach($filter('filter')($scope.effectsData, { target: $affectedObj.name, apply: true }, true), function (effect) {
            //parseInt the effect's value for the likely case it's a string like "+1"
            result += parseInt(effect.value);
            $affectedObj.effects.push(effect.value + " (" + effect.source + ")");
        });
        return result;
    };
    $scope.trait_db.have = function (trait) {
        //Is there any equipped item that has this trait? Incidentally uses the haveTrait() function that asks if that one item has this trait - you can see where this is going.
        //Returns true if any ( some() ) of the equipped items can say yes to having the trait
        let itemsEquipped = $filter('filter')($scope.items, { equip: true });
        return itemsEquipped.some(function (item) { return app.haveTrait(item, trait.name); }) && true;
    };
    $scope.feat_db.canChoose = function (feat) {
        //This function evaluates ALL the possible requirements for taking a feat
        //Returns true only if all the requirements are true. If the feat doesn't have a requirement, it is always true.
        //First of all, never list feats that only show on the "Lore" skill - these are templates and never used directly
        //Copies are made in $scope.generateLore() individually for every unique lore, and these may show up on this list
        if (feat.showon == "Lore") {
            return false;
        }
        //If the feat has a levelreq, check if the level beats that.
        let levelreq = (feat.levelreq) ? ($scope.level >= feat.levelreq) : true;
        //If the feat has an abilityreq, split it into the ability and the requirement (they come in strings like "Dexterity, 12"), then check if that ability's value() meets the requirement. 
        let abilityreq = (feat.abilityreq) ? ($scope.abilities.byName(feat.abilityreq.split(",")[0]).value() >= parseInt(feat.abilityreq.split(",")[1])) : true;
        //If the feat has a skillreq, first split it into all different requirements (they come in strings like "Athletics, 2|Acrobatics, 2" or just "Acrobatics, 2")
        //Then check if any one of these requirements (split into the skill and the number) are met by the skill's level
        //These are always OR requirements, you never need two skills for a feat.
        let skillreq = false;
        if (feat.skillreq) {
            let skillreqs = feat.skillreq.split("|");
            skillreq = skillreqs.some(function (requirement) { return $scope.skills.byName(requirement.split(",")[0]).level >= parseInt(requirement.split(",")[1]); }) && true;
        }
        else {
            skillreq = true;
        }
        //If the feat has a weaponreq, split it and check if the named weapon proficiency's level meets the number
        let weaponreq = (feat.weaponreq) ? ($scope.weaponProfs.byName(feat.weaponreq.split(",")[0]).level >= parseInt(feat.weaponreq.split(",")[1])) : true;
        //If the feat has an armorreq, split it and check if the named armor proficiency's level meets the number
        let armorreq = (feat.armorreq) ? ($scope.armorProfs.byName(feat.armorreq.split(",")[0]).level >= parseInt(feat.armorreq.split(",")[1])) : true;
        //Lastly, if the feat has a specialreq, it comes as a string that contains a condition. Evaluate the condition to find out if the requirement is met.
        let specialreq = (feat.specialreq) ? (eval(feat.specialreq)) : true;
        //Return true if all are true
        return levelreq && abilityreq && skillreq && weaponreq && armorreq && specialreq;
    };
    $scope.effects = function () {
        //This is a terrible, horrible, no good, very bad function, but it is absolutely necessary.
        //It goes over every equipped item and taken feat, reads their "effects" and turns them into standardized effect data that is ultimately stored in $scope.effectsData
        //That wouldn't be so bad, but there are so many exceptions. Like skill penalties that don't apply if you meet a strength requirement, unless the item also has a certain trait,
        // and speed penalties that still apply even then, but in a lessened form, and shield bonuses that only apply if the shield is raised, and get higher if you also take cover.
        //These exceptions all need to be handled, and the function will likely become much longer as the application develops.
        //For this reason, we are only calling it from the global effects list, and everybody else can go and check effectsData instead, where the result is stored.
        //effectsData only gets updated if the data has changed, to avoid infinite digest.
        let effects = [];
        let itemeffects = [];
        let feateffects = [];
        //Start off with checking ALL equipped items and push their standardized effects into itemeffects.
        //All effects are stored as {type, target, value, source, penalty, (apply)}
        //Apply is decided later according to bonus types and if there is a higher bonus of the same type,
        // but if you set apply:false here, you can get an effect that is always listed as not applied (such as a skill penalty whose strength requirement has been met)
        angular.forEach($filter('filter')($scope.items, { equip: true }), function (item) {
            //If an item has a simple instruction in effects, such as "Strength +2", split it into the affected target and the change (keeping the + or - in front),
            // then mark the effect as a penalty if the change is negative.
            angular.forEach(item.effects, function (effect) {
                let split = effect.split(" ");
                itemeffects.push({ type: 'item', target: split[0], value: split[1], source: item.name, penalty: (parseInt(split[1]) < 0) ? true : false });
            });
            //If an item is a shield that is raised, add its item bonus to AC with a + in front. If you are also taking cover while the shield is raised, add that bonus as well.
            //Don't put the shield bonus into "effects"!
            if (item.type == "shield" && item.raised) {
                let shieldbonus = item.itembonus;
                if (item.takecover) {
                    shieldbonus += item.coverbonus;
                }
                itemeffects.push({ type: 'circumstance', target: "AC", value: "+" + shieldbonus, source: item.name, penalty: false });
            }
            //If an item is a weapon that is raised, add +1 to AC.
            if (item.type == "weapon" && item.raised) {
                itemeffects.push({ type: 'circumstance', target: "AC", value: "+1", source: item.name, penalty: false });
            }
            //Now the exceptions begin. If an item has a skillpenalty or a speedpenalty, check if Strength meets its strength requirement
            //- unless it doesn't have a strength requirement, like a tower shield. In that case, the penalty just applies. Always.
            let strength = $scope.abilities.byName("Strength").value();
            if (item.skillpenalty) {
                if (!item.strength || item.strength > strength) {
                    //You are not strong enough to act freely in this armor.
                    //If the item has the Flexible trait, its penalty doesn't apply to Acrobatics and Athletics.
                    //We push this as an apply:false effect to each so you can see that (and why) you were spared from it.
                    //We also add a note to the source for clarity.
                    if (app.haveTrait(item, "Flexible")) {
                        itemeffects.push({ type: 'item', target: "Acrobatics", value: item.skillpenalty, source: item.name + " (Flexible)", penalty: true, apply: false });
                        itemeffects.push({ type: 'item', target: "Athletics", value: item.skillpenalty, source: item.name + " (Flexible)", penalty: true, apply: false });
                    }
                    else {
                        itemeffects.push({ type: 'item', target: "Acrobatics", value: item.skillpenalty, source: item.name, penalty: true });
                        itemeffects.push({ type: 'item', target: "Athletics", value: item.skillpenalty, source: item.name, penalty: true });
                    }
                    //These two always apply unless you are strong enough.
                    itemeffects.push({ type: 'item', target: "Stealth", value: item.skillpenalty, source: item.name, penalty: true });
                    itemeffects.push({ type: 'item', target: "Thievery", value: item.skillpenalty, source: item.name, penalty: true });
                }
                else {
                    //If you ARE strong enough, we push some not applying effects so you can feel good about that
                    itemeffects.push({ type: 'item', target: "Acrobatics", value: item.skillpenalty, source: item.name + " (Strength)", penalty: true, apply: false });
                    itemeffects.push({ type: 'item', target: "Athletics", value: item.skillpenalty, source: item.name + " (Strength)", penalty: true, apply: false });
                    itemeffects.push({ type: 'item', target: "Thievery", value: item.skillpenalty, source: item.name + " (Strength)", penalty: true, apply: false });
                    //UNLESS the item is also Noisy, in which case you do get the stealth penalty because you are dummy thicc and the clap of your ass cheeks keeps alerting the guards.
                    if (app.haveTrait(item, "Noisy")) {
                        itemeffects.push({ type: 'item', target: "Stealth", value: item.skillpenalty, source: item.name + " (Noisy)", penalty: true });
                    }
                    else {
                        itemeffects.push({ type: 'item', target: "Stealth", value: item.skillpenalty, source: item.name + " (Strength)", penalty: true, apply: false });
                    }
                }
            }
            if (item.speedpenalty) {
                if (!item.strength || item.strength > strength) {
                    //You are not strong enough to move unhindered in this armor. You get a speed penalty.
                    itemeffects.push({ type: 'untyped', target: "Speed", value: item.speedpenalty, source: item.name, penalty: true });
                }
                else {
                    if (parseInt(item.speedpenalty) < -5) {
                        //You are strong enough, but if the armor is particularly heavy, your penalty is only lessened.
                        //In this case we push both the avoided and the actual effect so you can feel at least a little good about yourself.
                        itemeffects.push({ type: 'untyped', target: "Speed", value: (item.speedpenalty + 5), source: item.name, penalty: true });
                        itemeffects.push({ type: 'untyped', target: "Speed", value: item.speedpenalty, source: item.name + " (Strength)", penalty: true, apply: false });
                    }
                    else {
                        //If you are strong enough and the armor only gave -5ft penalty, you get a fully avoided effect to gaze at.
                        itemeffects.push({ type: 'untyped', target: "Speed", value: item.speedpenalty, source: item.name + " (Strength)", penalty: true, apply: false });
                    }
                }
            }
        });
        //Feat effects are thankfully simple - so far. We check the "effects" property of every taken feat, split it up and push it as a new feateffect,
        // same as we did with items before the exceptions came.
        angular.forEach($filter('filter')($scope.feat_db, { have: true }), function (feat) {
            angular.forEach(feat.effects, function (effect) {
                let split = effect.split(" ");
                feateffects.push({ type: 'untyped', target: split[0], value: split[1], source: feat.name, penalty: (parseInt(split[1]) < 0) ? true : false });
            });
        });
        //Now we push itemeffects and feateffects into effects together.
        //Somehow, push.apply() gives us one array of objects, and push() gives us an array of two arrays of objects, so we use the former.
        effects.push.apply(effects, itemeffects);
        effects.push.apply(effects, feateffects);
        //The bonus types are hardcoded. If Paizo ever adds a new bonus type, this is where we need to change it.
        let types = ["item", "circumstance", "status", "proficiency", "untyped"];
        //This is what we built the unique filter for. From all the effects, get every target only once, so we know all the targets and don't get duplicates from the upcoming loops.
        let targets = $filter('unique')(effects, 'target').map(function (x) { return x.target; });
        //Now go over all the bonus types. If one target is affected by two bonuses of the same type, only the bigger one is applied. The same goes for penalties.
        angular.forEach(types, function ($type) {
            if ($type == 'untyped') {
                //If a penalty is untyped, it always applies, unless we already marked it as apply:false. Only penalties can be untyped.
                //We actually see untyped bonuses in feats, so we apply them here, too.
                angular.forEach($filter('filter')(effects, { type: 'untyped', apply: '!' + false }), function (effect) {
                    effect.apply = true;
                });
            }
            else {
                //For all bonus types except untyped, check all targets:
                angular.forEach(targets, function ($target) {
                    //Get all the active effects for the target of the current bonus type
                    let bonuseffects = $filter('filter')(effects, { type: $type, target: $target, penalty: false, apply: '!' + false });
                    if (bonuseffects.length > 0) {
                        //If we have any bonuses for this target and this type, figure out which one is the largest and only get that one.
                        let maxvalue = Math.max.apply(Math, bonuseffects.map(function (x) { return parseInt(x.value); }));
                        //Then apply the first effect with that value, that target and that type. The actual effect may vary if two of the same bonuses exist, but it doesn't matter.
                        $filter('filter')(bonuseffects, { value: maxvalue })[0].apply = true;
                    }
                    let penaltyeffects = $filter('filter')(effects, { type: $type, target: $target, penalty: true, apply: '!' + false });
                    //If we have any PENALTIES for this target and this type, we proceed as with bonuses, only we pick the lowest number (that is, the worst penalty).
                    if (penaltyeffects.length > 0) {
                        let minvalue = Math.min.apply(Math, penaltyeffects.map(function (x) { return parseInt(x.value); }));
                        $filter('filter')(penaltyeffects, { value: minvalue })[0].apply = true;
                    }
                });
            }
        });
        //We are saving the result in effectsData to avoid infinite digest when this function is run from everywhere and always produces a new object.
        //This also means we can't save effectsData every run, so we first check if there is any need to save it again.
        //Since object === object, we need to compare the entire content of both effectsData and the newly generated effects list with toJson().
        if (angular.toJson($scope.effectsData) !== angular.toJson(effects)) {
            //If anything has changed, we write the new effects into effectsData
            $scope.effectsData = effects;
        }
        //Lastly, we return effectsData, which is either completely unchanged by all this effort or is a whole new object
        //(which means AngularJS will run this function again immediately to ensure stability, and then we will be thankful for our !== operator)
        return $scope.effectsData;
    };
    $scope.equipArmor = function (armor) {
        if (armor.equip == true) {
            angular.forEach($filter('filter')($scope.items, { type: armor.type }), function (item) {
                item.equip = false;
            });
            armor.equip = true;
        }
    };
    $scope.itemget = function (item) {
        let newitem = { equip: true, type: "" };
        switch (item.constructor.name) {
            case "Weapon": {
                newitem = new Weapon();
                break;
            }
            case "Armor": {
                newitem = new Armor();
                break;
            }
            case "Shield": {
                newitem = new Shield();
                break;
            }
        }
        angular.copy(item, newitem);
        //newitem.id = Date.now();
        newitem.equip = true;
        if (newitem.type == "armor" || newitem.type == "shield") {
            $scope.equipArmor(newitem);
        }
        ;
        $scope.items.push(newitem);
    };
    $scope.itemdrop = function (item) {
        $scope.items.splice($scope.items.indexOf(item), 1);
        $scope.equipBasics();
    };
    $scope.equipBasics = function () {
        if ($filter('filter')($scope.items, { type: 'armor', equip: true }).length == 0) {
            if ($filter('filter')($scope.items, { type: 'armor' }).length == 0) {
                $scope.itemget($scope.item_db.byName("Unarmored"));
            }
            $scope.items.byName("Unarmored").equip = true;
            $scope.equipArmor($scope.items.byName("Unarmored"));
        }
        if ($filter('filter')($scope.items, { type: 'weapon', equip: true }).length == 0) {
            if ($filter('filter')($scope.items, { type: 'weapon' }).length == 0) {
                $scope.itemget($scope.item_db.byName("Fist"));
            }
            $scope.items.byName("Fist").equip = true;
        }
    };
    $scope.generateLore = function (newLore) {
        let newLoreName = "Lore: " + newLore + " Lore";
        if (newLore != "" && !$scope.skills.byName(newLoreName)) {
            $scope.skills.push(new Skill(newLoreName, "Intelligence"));
            angular.forEach($filter('filter')($scope.feat_db, { skillreq: "Lore", lorebase: '!' + true }), function (feat) {
                let skillreqs = feat.skillreq.split("|");
                angular.forEach(skillreqs, function (requirement) {
                    if (requirement.split(",")[0] == "Lore") {
                        feat.skillreq += "|" + newLoreName + "," + requirement.split(",")[1];
                    }
                });
            });
            angular.forEach($filter('filter')($scope.feat_db, { showon: "Lore", lorebase: '!' + true }), function (feat) {
                feat.showon += ", " + newLoreName;
            });
            let newFeats = [];
            angular.forEach($filter('filter')($scope.feat_db, { lorebase: true }), function (feat) {
                let newFeat = new Feat();
                angular.copy(feat, newFeat);
                newFeat.name = newFeat.name.replace("Lore", newLoreName);
                newFeat.skillreq = (newFeat.skillreq) ? newFeat.skillreq.replace("Lore", newLoreName) : "";
                newFeat.featreq = (newFeat.featreq) ? newFeat.featreq.replace("Lore", newLoreName) : "";
                newFeat.showon = newFeat.showon.replace("Lore", newLoreName);
                newFeat.lorebase = false;
                newFeats.push(newFeat);
            });
            if (newFeats.length > 0) {
                $scope.feat_db.push.apply($scope.feat_db, newFeats);
            }
        }
    };
    $scope.removeLore = function (oldLore) {
        angular.forEach($filter('filter')($scope.feat_db, { skillreq: oldLore.name }), function (feat) {
            let skillreqs = feat.skillreq.split("|");
            angular.forEach(skillreqs, function (requirement) {
                if (requirement.split(",")[0] == oldLore.name) {
                    feat.skillreq = feat.skillreq.replace("|" + oldLore.name + "," + requirement.split(",")[1], "");
                }
            });
        });
        angular.forEach($filter('filter')($scope.feat_db, { showon: oldLore.name }), function (feat) {
            feat.showon = feat.showon.replace(", " + oldLore.name, "");
        });
        angular.forEach($filter('filter')($scope.feat_db, { name: oldLore.name }), function (feat) {
            $scope.feat_db.splice($scope.feat_db.indexOf(feat), 1);
        });
        $scope.skills.splice($scope.skills.indexOf(oldLore), 1);
    };
    $scope.initNotes($scope.skills);
    $scope.initNotes($scope.saves);
    $scope.equipBasics();
});
