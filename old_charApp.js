var app = angular.module('charApp', []);

//App functions
//Why are these app functions and not scope functions? I assume I did that so they could be called from anywhere.

app.haveTrait = function($obj, $trait) {
//Does this object have this trait (as String)?
//Can be any object - only runs if objects has the attribute "traits" at all
//Returns true or false
//Example: haveTrait(some_Weapon, "Finesse")
  if ($obj.traits) {
    return $obj.traits.findIndex(function (element) {
      return element.indexOf($trait) === 0;
    }) >= 0;
  }
}
app.haveModifiers = function($list, $obj, $affected) {
//Do any traits of this object affect this information? This basically looks up every one of the object's traits in the given list (usually $scope.trait_db),
//Checks if that trait that has a method called $affected(), then runs it, and adds up the results.
//Returns the sum of all formulas that affect this information
//Usage: haveModifiers(List_of_traits, Object, affected_information)
//Example: haveModifiers($scope.trait_db, some_Weapon, damageBonus)
  results = 0;
  angular.forEach($obj.traits, function(trait) {
    if ( $list.byName(trait) && typeof $list.byName(trait)[$affected] === "function" ) {
      effect = eval("$list.byName(trait)." + $affected + "()");
      if (effect) {results += effect};      
    }
  });
  return results;
}

//Filters
app.filter('halve', function($filter) {
//halves and rounds down the value - standard for Pathfinder
  return function(x) {
    return Math.floor((x)/2);
  };
});
app.filter('unique', function() {
//This filter is stolen and I don't fully understand all of its methods.
//It basically lists up every item in the array, so long as the value of a certain property hasn't already been listed.
//Returns the array, minus all the items whose property already had that value.
//Example: 
/* some_items = [ {name:"dagger", type:"weapon"}, {name:"shortbow", type:"weapon"}, {name:"leather", type:"armor"} ]
  unique_types = $filter('unique')(some_items, "type")
  unique_types == [ {name:"dagger", type:"weapon"}, {name:"leather", type:"armor"} ]
*/
//If you only want the list of unique properties, use: $filter('unique')(item_list, 'property').map(function(x){return x.property});
  return function(array, property) {
    var output = [];
    keys = [];
    angular.forEach(array, function(object) {
      var key = object[property];
      if (keys.indexOf(key) === -1) {
        keys.push(key);
        output.push(object);
      }
    });
    return output;
  };
});
app.filter('charAttack', function($filter) {
//Calculates the attack bonus for a melee or ranged attack with this weapon.
//Makes references to $scope.Level, $scope.Abilities, $scope.weaponProfs (weapon category proficiencies) and $scope.trait_db, which must be passed, as well as whether the attack is Ranged or Melee
  return function(x, $level, $abilities, $weaponProfs, $traits, $range) {
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
app.filter('charArmorDefense', function($filter) {
//Calculates the effective AC gained from wearing this armor.
//Makes references to $scope.Level, $scope.Abilities and $scope.armorProfs (armor category proficiencies), which must be passed
    return function(x, $level, $abilities, $armorProfs) {
      var dex = $abilities.byName("Dexterity").mod();
      //Add character level if the character is trained or better with either the armor category or the armor itself
      var charLevel = (((x.level > 0) || ($armorProfs.byName(x.prof).level > 0)) && $level);
      //Add either the weapon category proficiency or the weapon proficiency, whichever is better
      var profLevel = Math.max(x.level, $armorProfs.byName(x.prof).level);
      //Add the dexterity modifier up to the armor's Dex Cap
      var dexBonus = Math.min(dex, (x.dexcap)?x.dexcap:999)
      //Add up all modifiers and return the AC gained from this armor
      var defenseResult = 10 + charLevel + profLevel + dexBonus + x.itembonus;
      return defenseResult;
    };
  });
app.filter('canParry', function($filter) {
//Gets all items from this array that have Parry Trait, if the character is Trained or better with them
//$scope.weaponProfs (weapon proficiencies) must be passed
//Returns a filtered array
  return function(x, $weaponProfs) {
    result = []
    //Run over all equipped weapons
    angular.forEach($filter('filter')(x, {type:"weapon",equip:true}), function(weapon) {
      //Add this weapon to the result if it has the Parry Trait and if the character is Trained or better with the weapon category or the weapon itself
      if (app.haveTrait(weapon,"Parry") && ((weapon.level > 0) || ($weaponProfs.byName(weapon.prof).level > 0))) {result.push(weapon);}
    });
    return result;
  };
});
app.filter('charWeaponDamage', function($filter) {
//Lists the damage dice and damage bonuses for a ranged or melee attack with this weapon.
//Abilities and Traits must be passed, as well as whether the attack is Melee or Ranged
//Returns a string in the form of "1d6 +5"
//Will get more complicated when runes are implemented
  return function(x, $abilities, $traits, $range) {
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
app.filter('charSkill', function($filter) {
  //Calculates the effective bonus of the given Skill
  //$scope.Level, $scope.Abilities, $scope.feat_db and $scope.getEffects(skill) must be passed
  return function(x, $level, $abilities, $feats, $effects) {
    //Add character level if the character is trained or better with the Skill; Add half the level if the skill is unlearned and the character has the Untrained Improvisation feat.
    //Gets applied to saves and perception, but they are never untrained
    var charLevel = ((x.level > 0) ? $level : ($feats.byName("Untrained Improvisation").have) && Math.floor($level/2));
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
app.controller('charCtrl', function($scope,$filter) {
  $scope.character = { name:"Dudebro", ancestry:"Human, Orc", class:"Monk", subclass:"", deity:"God" }
  $scope.level = 7;
  //The effective AC is called as a function and includes the worn armor and all raised shields and Parry weapons.
  $scope.AC = {name:'AC', value:function() {return $scope.AC.effectiveAC(this)}, effects:[] }
  //The actual abilities with all modifiers are called as a function, as well as the Ability modifier (which is calculated from the value).
  $scope.abilities = [
    { name:'Strength', basevalue:17, value:function() {return $scope.abilities.effectiveAbility(this)}, mod:function() { return $scope.abilities.mod(this) }, effects:[] },
    { name:'Dexterity', basevalue:13, value:function() {return $scope.abilities.effectiveAbility(this)}, mod:function() { return $scope.abilities.mod(this) }, effects:[] },
    { name:'Constitution', basevalue:14, value:function() {return $scope.abilities.effectiveAbility(this)}, mod:function() { return $scope.abilities.mod(this) }, effects:[] },
    { name:'Intelligence', basevalue:10, value:function() {return $scope.abilities.effectiveAbility(this)}, mod:function() { return $scope.abilities.mod(this) }, effects:[] },
    { name:'Wisdom', basevalue:13, value:function() {return $scope.abilities.effectiveAbility(this)}, mod:function() { return $scope.abilities.mod(this) }, effects:[] },
    { name:'Charisma', basevalue:9, value:function() {return $scope.abilities.effectiveAbility(this)}, mod:function() { return $scope.abilities.mod(this) }, effects:[] },
  ];
  //We are counting Perception as a regular skill
  //All proficiencies are directly named as 0,2,4,6,8, which is their real modifier
  $scope.skills = [
    { name:'Perception', level:2, ability:"Wisdom", note:'+2 initiative', effects:[], },
    { name:'Acrobatics', level:0, ability:"Dexterity", note:'', effects:[], },
    { name:'Arcana', level:0, ability:"Intelligence", note:'', effects:[], },
    { name:'Athletics', level:4, ability:"Strength", note:'+2 jumping', effects:[], },
    { name:'Crafting', level:0, ability:"Intelligence", note:'', effects:[], },
    { name:'Deception', level:0, ability:"Charisma", note:'', effects:[], },
    { name:'Diplomacy', level:0, ability:"Charisma", note:'', effects:[], },
    { name:'Intimidation', level:0, ability:"Charisma", note:'', effects:[], },
    { name:'Lore', level:0, ability:"Intelligence", note:'', effects:[], },
    { name:'Medicine', level:0, ability:"Wisdom", note:'', effects:[], },
    { name:'Nature', level:0, ability:"Wisdom", note:'', effects:[], },
    { name:'Occultism', level:0, ability:"Intelligence", note:'', effects:[], },
    { name:'Performance', level:0, ability:"Charisma", note:'', effects:[], },
    { name:'Religion', level:0, ability:"Wisdom", note:'', effects:[], },
    { name:'Society', level:2, ability:"Intelligence", note:'', effects:[], },
    { name:'Stealth', level:2, ability:"Dexterity", note:'', effects:[], },
    { name:'Survival', level:0, ability:"Wisdom", note:'', effects:[], },
    { name:'Thievery', level:0, ability:"Dexterity", note:'', effects:[], },
  ];
  $scope.saves = [
    { name:'Fortitude', level:2, ability:"Constitution", note:'', effects:[], },
    { name:'Reflex', level:6, ability:"Dexterity", note:'', effects:[], },
    { name:'Will', level:4, ability:"Wisdom", note:'+2 vs enchantment', effects:[], },
  ];
  $scope.weaponProfs = [
    { name:'Simple', level:2, effects:[], },
    { name:'Martial', level:4, effects:[], },
    { name:'Unarmed', level:0, effects:[], },
  ]
  $scope.armorProfs = [
    { name:'Light', level:4, effects:[], },
    { name:'Medium', level:0, effects:[], },
    { name:'Heavy', level:0, effects:[], },
    { name:'Unarmored', level:4, effects:[], },
  ]
  //The inventory
  $scope.items = []
  //All the feats you have
  $scope.feats = []
  //This immutable item list may be loaded from a database in the future. Every weapon you "get" is copied from here to $scope.items, where it can be modified.
  $scope.item_db = [
    { type:'weapon', name:'Fist', equip:false, level:0, prof:'Unarmed', dmgType:'B', dicenum:1, dicesize:4, melee:5, itembonus:0, traits:['Agile', 'Finesse', 'Nonlethal', 'Unarmed'], },
    { type:'weapon', name:'Clan Dagger', equip:false, level:0, prof:'Simple', dmgType:'P', dicenum:1, dicesize:4, melee:5, itembonus:0, traits:['Agile', 'Dwarf', 'Parry', 'Uncommon', 'Versatile B'], },
    { type:'weapon', name:'Club', equip:false, level:0, prof:'Simple', dmgType:'B', dicenum:1, dicesize:6, melee:5, itembonus:0, traits:['Thrown 10 ft.'], },
    { type:'weapon', name:'Dagger', equip:false, level:0, prof:'Simple', dmgType:'P', dicenum:1, dicesize:4, melee:5, ranged:10, itembonus:0, traits:['Agile', 'Finesse', 'Thrown 10 ft.', 'Versatile S'], },
    { type:'weapon', name:'Gauntlet', equip:false, level:0, prof:'Simple', dmgType:'B', dicenum:1, dicesize:4, melee:5, itembonus:0, traits:['Agile', 'Free-Hand'], },
    { type:'weapon', name:'Katar', equip:false, level:0, prof:'Simple', dmgType:'P', dicenum:1, dicesize:4, melee:5, itembonus:0, traits:['Agile', 'Deadly d6', 'Monk', 'Uncommon'], },
    { type:'weapon', name:'Light Mace', equip:false, level:0, prof:'Simple', dmgType:'B', dicenum:1, dicesize:4, melee:5, itembonus:0, traits:['Agile', 'Finesse', 'Shove'], },
    { type:'weapon', name:'Longspear', equip:false, level:0, prof:'Simple', dmgType:'P', dicenum:1, dicesize:8, melee:10, itembonus:0, traits:['Reach'], },
    { type:'weapon', name:'Mace', equip:false, level:0, prof:'Simple', dmgType:'B', dicenum:1, dicesize:6, melee:5, itembonus:0, traits:['Shove'], },
    { type:'weapon', name:'Morningstar', equip:false, level:0, prof:'Simple', dmgType:'B', dicenum:1, dicesize:6, melee:5, itembonus:0, traits:['Versatile P'], },
    { type:'weapon', name:'Sickle', equip:false, level:0, prof:'Simple', dmgType:'S', dicenum:1, dicesize:4, melee:5, itembonus:0, traits:['Agile', 'Finesse', 'Trip'], },
    { type:'weapon', name:'Spear', equip:false, level:0, prof:'Simple', dmgType:'P', dicenum:1, dicesize:6, melee:5, ranged:20, itembonus:0, traits:['Thrown 20 ft.'], },
    { type:'weapon', name:'Spiked Gauntlet', equip:false, level:0, prof:'Simple', dmgType:'P', dicenum:1, dicesize:4, melee:5, itembonus:0, traits:['Agile', 'Free-Hand'], },
    { type:'weapon', name:'Staff', equip:false, level:0, prof:'Simple', dmgType:'B', dicenum:1, dicesize:4, melee:5, itembonus:0, traits:['Two-Hand d8'], },
    { type:'weapon', name:'Bastard Sword', equip:false, level:0, prof:'Martial', dmgType:'S', dicenum:1, dicesize:8, melee:5, itembonus:0, traits:['Two-Hand d12'], },
    { type:'weapon', name:'Battle Axe', equip:false, level:0, prof:'Martial', dmgType:'S', dicenum:1, dicesize:8, melee:5, itembonus:0, traits:['Sweep'], },
    { type:'weapon', name:'Bo Staff', equip:false, level:0, prof:'Martial', dmgType:'B', dicenum:1, dicesize:8, melee:10, itembonus:0, traits:['Monk', 'Parry', 'Reach', 'Trip'], },
    { type:'weapon', name:'Dogslicer', equip:false, level:0, prof:'Martial', dmgType:'S', dicenum:1, dicesize:6, melee:5, itembonus:0, traits:['Agile', 'Backstabber', 'Finesse', 'Goblin', 'Uncommon'], },
    { type:'weapon', name:'Elven Curve Blade', equip:false, level:0, prof:'Martial', dmgType:'S', dicenum:1, dicesize:8, melee:5, itembonus:0, traits:['Elf', 'Finesse', 'Forceful', 'Uncommon'], },
    { type:'weapon', name:'Falchion', equip:false, level:0, prof:'Martial', dmgType:'S', dicenum:1, dicesize:10, melee:5, itembonus:0, traits:['Forceful', 'Sweep'], },
    { type:'weapon', name:'Fauchard', equip:false, level:0, prof:'Martial', dmgType:'S', dicenum:1, dicesize:8, melee:10, itembonus:0, traits:['Deadly d8', 'Reach 10 ft.', 'Sweep', 'Trip'], },
    { type:'weapon', name:'Filcher\'s Fork', equip:false, level:0, prof:'Martial', dmgType:'P', dicenum:1, dicesize:4, melee:5, ranged:20, itembonus:0, traits:['Agile', 'Backstabber', 'Deadly d6', 'Finesse', 'Halfling', 'Thrown 20 ft.', 'Uncommon'], },
    { type:'weapon', name:'Flail', equip:false, level:0, prof:'Martial', dmgType:'B', dicenum:1, dicesize:6, melee:5, itembonus:0, traits:['Disarm', 'Sweep', 'Trip'], },
    { type:'weapon', name:'Glaive', equip:false, level:0, prof:'Martial', dmgType:'S', dicenum:1, dicesize:8, melee:10, itembonus:0, traits:['Deadly d8', 'Forceful', 'Reach'], },
    { type:'weapon', name:'Gnome Hooked Hammer', equip:false, level:0, prof:'Martial', dmgType:'B', dicenum:1, dicesize:6, melee:5, itembonus:0, traits:['Gnome', 'Trip', 'Two-Hand d10', 'Uncommon', 'Versatile P'], },
    { type:'weapon', name:'Greataxe', equip:false, level:0, prof:'Martial', dmgType:'S', dicenum:1, dicesize:12, melee:5, itembonus:0, traits:['Sweep'], },
    { type:'weapon', name:'Greatclub', equip:false, level:0, prof:'Martial', dmgType:'B', dicenum:1, dicesize:10, melee:5, itembonus:0, traits:['Backswing', 'Shove'], },
    { type:'weapon', name:'Greatpick', equip:false, level:0, prof:'Martial', dmgType:'P', dicenum:1, dicesize:10, melee:5, itembonus:0, traits:['Fatal d12'], },
    { type:'weapon', name:'Greatsword', equip:false, level:0, prof:'Martial', dmgType:'S', dicenum:1, dicesize:12, melee:5, itembonus:0, traits:['Versatile P'], },
    { type:'weapon', name:'Guisarme', equip:false, level:0, prof:'Martial', dmgType:'S', dicenum:1, dicesize:10, melee:10, itembonus:0, traits:['Reach', 'Trip'], },
    { type:'weapon', name:'Halberd', equip:false, level:0, prof:'Martial', dmgType:'P', dicenum:1, dicesize:10, melee:10, itembonus:0, traits:['Reach', 'Versatile S'], },
    { type:'weapon', name:'Hatchet', equip:false, level:0, prof:'Martial', dmgType:'S', dicenum:1, dicesize:6, melee:5, ranged:10, itembonus:0, traits:['Agile', 'Sweep', 'Thrown  10 ft.'], },
    { type:'weapon', name:'Horsechopper', equip:false, level:0, prof:'Martial', dmgType:'S', dicenum:1, dicesize:8, melee:10, itembonus:0, traits:['Goblin', 'Reach', 'Trip', 'Uncommon', 'Versatile P'], },
    { type:'weapon', name:'Kama', equip:false, level:0, prof:'Martial', dmgType:'S', dicenum:1, dicesize:6, melee:5, itembonus:0, traits:['Agile', 'Monk', 'Trip', 'Uncommon'], },
    { type:'weapon', name:'Katana', equip:false, level:0, prof:'Martial', dmgType:'S', dicenum:1, dicesize:6, melee:5, itembonus:0, traits:['Deadly d8', 'Two-Hand d10', 'Uncommon', 'Versatile P'], },
    { type:'weapon', name:'Kukri', equip:false, level:0, prof:'Martial', dmgType:'S', dicenum:1, dicesize:6, melee:5, itembonus:0, traits:['Agile', 'Finesse', 'Trip', 'Uncommon'], },
    { type:'weapon', name:'Lance', equip:false, level:0, prof:'Martial', dmgType:'P', dicenum:1, dicesize:8, melee:10, itembonus:0, traits:['Deadly d8', 'Jousting d6', 'Reach'], },
    { type:'weapon', name:'Light Hammer', equip:false, level:0, prof:'Martial', dmgType:'B', dicenum:1, dicesize:6, melee:5, ranged:20, itembonus:0, traits:['Agile', 'Thrown 20 ft.'], },
    { type:'weapon', name:'Light Pick', equip:false, level:0, prof:'Martial', dmgType:'P', dicenum:1, dicesize:4, melee:5, itembonus:0, traits:['Agile', 'Fatal d8'], },
    { type:'weapon', name:'Longsword', equip:false, level:0, prof:'Martial', dmgType:'S', dicenum:1, dicesize:8, melee:5, itembonus:0, traits:['Versatile P'], },
    { type:'weapon', name:'Main-gauche', equip:false, level:0, prof:'Martial', dmgType:'P', dicenum:1, dicesize:4, melee:5, itembonus:0, traits:['Agile', 'Disarm', 'Finesse', 'Parry', 'Versatile S'], },
    { type:'weapon', name:'Maul', equip:false, level:0, prof:'Martial', dmgType:'B', dicenum:1, dicesize:12, melee:5, itembonus:0, traits:['Shove'], },
    { type:'weapon', name:'Nunchaku', equip:false, level:0, prof:'Martial', dmgType:'B', dicenum:1, dicesize:6, melee:5, itembonus:0, traits:['Backswing', 'Disarm', 'Finesse', 'Monk', 'Uncommon'], },
    { type:'weapon', name:'Orc Knuckle Dagger', equip:false, level:0, prof:'Martial', dmgType:'P', dicenum:1, dicesize:6, melee:5, itembonus:0, traits:['Agile', 'Disarm', 'Orc', 'Uncommon'], },
    { type:'weapon', name:'Pick', equip:false, level:0, prof:'Martial', dmgType:'P', dicenum:1, dicesize:6, melee:5, itembonus:0, traits:['Fatal d10'], },
    { type:'weapon', name:'Ranseur', equip:false, level:0, prof:'Martial', dmgType:'P', dicenum:1, dicesize:10, melee:10, itembonus:0, traits:['Disarm', 'Reach'], },
    { type:'weapon', name:'Rapier', equip:false, level:0, prof:'Martial', dmgType:'P', dicenum:1, dicesize:6, melee:5, itembonus:0, traits:['Deadly d8', 'Disarm', 'Finesse'], },
    { type:'weapon', name:'Sai', equip:false, level:0, prof:'Martial', dmgType:'P', dicenum:1, dicesize:4, melee:5, itembonus:0, traits:['Agile', 'Disarm', 'Finesse', 'Monk', 'Uncommon', 'Versatile B'], },
    { type:'weapon', name:'Sap', equip:false, level:0, prof:'Martial', dmgType:'B', dicenum:1, dicesize:6, melee:5, itembonus:0, traits:['Agile', 'Nonlethal'], },
    { type:'weapon', name:'Scimitar', equip:false, level:0, prof:'Martial', dmgType:'S', dicenum:1, dicesize:6, melee:5, itembonus:0, traits:['Forceful', 'Sweep'], },
    { type:'weapon', name:'Scourge', equip:false, level:0, prof:'Martial', dmgType:'S', dicenum:1, dicesize:4, melee:5, itembonus:0, traits:['Agile', 'Disarm', 'Finesse', 'Nonlethal', 'Sweep'], },
    { type:'weapon', name:'Scythe', equip:false, level:0, prof:'Martial', dmgType:'S', dicenum:1, dicesize:10, melee:5, itembonus:0, traits:['Deadly d10', 'Trip'], },
    { type:'weapon', name:'Shield Bash', equip:false, level:0, prof:'Martial', dmgType:'B', dicenum:1, dicesize:4, melee:5, itembonus:0, traits:[], },
    { type:'weapon', name:'Shield Boss', equip:false, level:0, prof:'Martial', dmgType:'B', dicenum:1, dicesize:6, melee:5, itembonus:0, traits:['Attached to Shield'], },
    { type:'weapon', name:'Shield Spikes', equip:false, level:0, prof:'Martial', dmgType:'P', dicenum:1, dicesize:6, melee:5, itembonus:0, traits:['Attached to Shield'], },
    { type:'weapon', name:'Shortsword', equip:false, level:0, prof:'Martial', dmgType:'P', dicenum:1, dicesize:6, melee:5, itembonus:0, traits:['Agile', 'Finesse', 'Versatile S'], },
    { type:'weapon', name:'Spiked Chain', equip:false, level:0, prof:'Martial', dmgType:'S', dicenum:1, dicesize:8, melee:5, itembonus:0, traits:['Disarm', 'Finesse', 'Trip', 'Uncommon'], },
    { type:'weapon', name:'Starknife', equip:false, level:0, prof:'Martial', dmgType:'P', dicenum:1, dicesize:4, melee:5, ranged:20, itembonus:0, traits:['Agile', 'Deadly d6', 'Finesse', 'Thrown 20 ft.', 'Versatile S'], },
    { type:'weapon', name:'Temple Sword', equip:false, level:0, prof:'Martial', dmgType:'S', dicenum:1, dicesize:8, melee:5, itembonus:0, traits:['Monk', 'Trip', 'Uncommon'], },
    { type:'weapon', name:'Trident', equip:false, level:0, prof:'Martial', dmgType:'P', dicenum:1, dicesize:8, melee:5, ranged:20, itembonus:0, traits:['Thrown 20 ft.'], },
    { type:'weapon', name:'War Flail', equip:false, level:0, prof:'Martial', dmgType:'B', dicenum:1, dicesize:10, melee:5, itembonus:0, traits:['Disarm', 'Sweep', 'Trip'], },
    { type:'weapon', name:'Warhammer', equip:false, level:0, prof:'Martial', dmgType:'B', dicenum:1, dicesize:8, melee:5, itembonus:0, traits:['Shove'], },
    { type:'weapon', name:'Whip', equip:false, level:0, prof:'Martial', dmgType:'S', dicenum:1, dicesize:4, melee:10, itembonus:0, traits:['Disarm', 'Finesse', 'Nonlethal', 'Reach', 'Trip'], },
    { type:'weapon', name:'Aklys', equip:false, level:0, prof:'Advanced', dmgType:'B', dicenum:1, dicesize:6, melee:5, ranged:20, itembonus:0, traits:['Ranged Trip', 'Tethered', 'Thrown 20 feet', 'Trip', 'Uncommon'], },
    { type:'weapon', name:'Aldori Dueling Sword', equip:false, level:0, prof:'Advanced', dmgType:'S', dicenum:1, dicesize:8, melee:5, itembonus:0, traits:['Finesse', 'Uncommon', 'Versatile P'], },
    { type:'weapon', name:'Dwarven War Axe', equip:false, level:0, prof:'Advanced', dmgType:'S', dicenum:1, dicesize:8, melee:5, itembonus:0, traits:['Dwarf', 'Sweep', 'Two-Hand d12', 'Uncommon'], },
    { type:'weapon', name:'Gnome Flickmace', equip:false, level:0, prof:'Advanced', dmgType:'B', dicenum:1, dicesize:8, melee:10, itembonus:0, traits:['Gnome', 'Reach', 'Uncommon'], },
    { type:'weapon', name:'Ogre Hook', equip:false, level:0, prof:'Advanced', dmgType:'P', dicenum:1, dicesize:10, melee:5, itembonus:0, traits:['Deadly 1d10', 'Trip', 'Uncommon'], },
    { type:'weapon', name:'Orc Necksplitter', equip:false, level:0, prof:'Advanced', dmgType:'S', dicenum:1, dicesize:8, melee:5, itembonus:0, traits:['Forceful', 'Orc', 'Sweep', 'Uncommon'], },
    { type:'weapon', name:'Sawtooth Saber', equip:false, level:0, prof:'Advanced', dmgType:'S', dicenum:1, dicesize:6, melee:5, itembonus:0, traits:['Agile', 'Finesse', 'Twin', 'Uncommon'], },
    { type:'weapon', name:'Blowgun', equip:false, level:0, prof:'Simple', dmgType:'P', dicenum:1, dicesize:1, ranged:20, itembonus:0, traits:['Agile', 'Nonlethal'], },
    { type:'weapon', name:'Crossbow', equip:false, level:0, prof:'Simple', dmgType:'P', dicenum:1, dicesize:8, ranged:120, itembonus:0, traits:[], },
    { type:'weapon', name:'Dart', equip:false, level:0, prof:'Simple', dmgType:'P', dicenum:1, dicesize:4, ranged:20, itembonus:0, traits:['Agile', 'Thrown'], },
    { type:'weapon', name:'Hand Crossbow', equip:false, level:0, prof:'Simple', dmgType:'P', dicenum:1, dicesize:6, ranged:60, itembonus:0, traits:[], },
    { type:'weapon', name:'Heavy Crossbow', equip:false, level:0, prof:'Simple', dmgType:'P', dicenum:1, dicesize:10, ranged:120, itembonus:0, traits:[], },
    { type:'weapon', name:'Javelin', equip:false, level:0, prof:'Simple', dmgType:'P', dicenum:1, dicesize:6, ranged:30, itembonus:0, traits:['Thrown'], },
    { type:'weapon', name:'Sling', equip:false, level:0, prof:'Simple', dmgType:'B', dicenum:1, dicesize:6, ranged:50, itembonus:0, traits:['Propulsive'], },
    { type:'weapon', name:'Composite Longbow', equip:false, level:0, prof:'Martial', dmgType:'P', dicenum:1, dicesize:8, ranged:100, itembonus:0, traits:['Deadly d10', 'Propulsive', 'Volley 30 ft.'], },
    { type:'weapon', name:'Composite Shortbow', equip:false, level:0, prof:'Martial', dmgType:'P', dicenum:1, dicesize:6, ranged:60, itembonus:0, traits:['Deadly d10', 'Propulsive'], },
    { type:'weapon', name:'Halfling Sling Staff', equip:false, level:0, prof:'Martial', dmgType:'B', dicenum:1, dicesize:10, ranged:80, itembonus:0, traits:['Halfling', 'Propulsive', 'Uncommon'], },
    { type:'weapon', name:'Longbow', equip:false, level:0, prof:'Martial', dmgType:'P', dicenum:1, dicesize:8, ranged:100, itembonus:0, traits:['Deadly d10', 'Volley 30 ft.'], },
    { type:'weapon', name:'Shortbow', equip:false, level:0, prof:'Martial', dmgType:'P', dicenum:1, dicesize:6, ranged:60, itembonus:0, traits:['Deadly d10'], },
    { type:'weapon', name:'Shuriken', equip:false, level:0, prof:'Martial', dmgType:'P', dicenum:1, dicesize:4, ranged:20, itembonus:0, traits:['Agile', 'Monk', 'Thrown', 'Uncommon'], },
    { type:'armor', name:'Unarmored', equip:false, level:0, prof:'Unarmored', itembonus:0, traits:[], },
    { type:'armor', name:'Explorer\'s Clothing', equip:false, level:0, prof:'Unarmored', dexcap:5, itembonus:0, traits:['Comfort'], },
    { type:'armor', name:'Padded Armor', equip:false, level:0, prof:'Light', dexcap:3, strength:10, itembonus:1, traits:['Comfort'], },
    { type:'armor', name:'Leather Armor', equip:false, level:0, prof:'Light', dexcap:4, skillpenalty:-1, strength:10, itembonus:1, traits:[], },
    { type:'armor', name:'Studded Leather Armor', equip:false, level:0, prof:'Light', dexcap:3, skillpenalty:-1, strength:12, itembonus:2, traits:[], },
    { type:'armor', name:'Chain Shirt', equip:false, level:0, prof:'Light', dexcap:3, skillpenalty:-1, strength:12, itembonus:2, traits:['Flexible', 'Noisy'], },
    { type:'armor', name:'Hide Armor', equip:false, level:0, prof:'Medium', dexcap:2, skillpenalty:-2, speedpenalty:-5, strength:14, itembonus:3, traits:[], },
    { type:'armor', name:'Scale Mail', equip:false, level:0, prof:'Medium', dexcap:2, skillpenalty:-2, speedpenalty:-5, strength:14, itembonus:3, traits:[], },
    { type:'armor', name:'Chain Mail', equip:false, level:0, prof:'Medium', dexcap:1, skillpenalty:-2, speedpenalty:-5, strength:16, itembonus:4, traits:['Flexible', 'Noisy'], },
    { type:'armor', name:'Breastplate', equip:false, level:0, prof:'Medium', dexcap:1, skillpenalty:-2, speedpenalty:-5, strength:16, itembonus:4, traits:[], },
    { type:'armor', name:'Splint Mail', equip:false, level:0, prof:'Heavy', dexcap:1, skillpenalty:-3, speedpenalty:-10, strength:16, itembonus:5, traits:[], },
    { type:'armor', name:'Half Plate', equip:false, level:0, prof:'Heavy', dexcap:1, skillpenalty:-3, speedpenalty:-10, strength:16, itembonus:5, traits:[], },
    { type:'armor', name:'Full Plate', equip:false, level:0, prof:'Heavy', dexcap:0, skillpenalty:-3, speedpenalty:-10, strength:18, itembonus:6, traits:['Bulwark'], },
    { type:'armor', name:'Hellknight Plate', equip:false, level:0, prof:'Heavy', dexcap:0, skillpenalty:-3, speedpenalty:-10, strength:18, itembonus:6, traits:['Bulwark', 'Uncommon'], },
    { type:'shield', name:'Buckler', equip:false, itembonus:1, },
    { type:'shield', name:'Wooden Shield', equip:false, itembonus:2, },
    { type:'shield', name:'Steel Shield', equip:false, itembonus:2, },
    { type:'shield', name:'Tower Shield', equip:false, speedpenalty:-5, itembonus:2, coverbonus:2, effects:[], },
  ]
  //The trait list is immutable and may be loaded from a database in the future. Functions look up information from here in case an item has a trait.
  //Some traits have special functions named after an information they affect, e.g. attack() or dmgbonus(). These get called by the haveModifiers() function.
  $scope.trait_db = [
    { name:'Agile', showon:'', desc:'The multiple attack penalty you take with this weapon on the second attack on your turn is -4 instead of -5, and -8 instead of -10 on the third and subsequent attacks in the turn.', have:function() { return $scope.trait_db.have(this) }, },
    { name:'Attached', showon:'', desc:'An attached weapon must be combined with another piece of gear to be used. The trait lists what type of item the weapon must be attached to. You must be wielding or wearing the item the weapon is attached to in order to attack with it. For example, shield spikes are attached to a shield, allowing you to attack with the spikes instead of a shield bash, but only if you\'re wielding the shield. An attached weapon is usually bolted onto or built into the item it\'s attached to, and typically an item can have only one weapon attached to it. An attached weapon can be affixed to an item with 10 minutes of work and a successful DC 10 Crafting check; this includes the time needed to remove the weapon from a previous item, if necessary. If an item is destroyed, its attached weapon can usually be salvaged.', have:function() { return $scope.trait_db.have(this) }, },
    { name:'Backstabber', showon:'', desc:'When you hit a flat-footed creature, this weapon deals 1 precision damage in addition to its normal damage. The precision damage increases to 2 if the weapon is a +3 weapon.', have:function() { return $scope.trait_db.have(this) }, },
    { name:'Backswing', showon:'', desc:'You can use the momentum from a missed attack with this weapon to lead into your next attack. After missing with this weapon on your turn, you gain a +1 circumstance bonus to your next attack with this weapon before the end of your turn.', have:function() { return $scope.trait_db.have(this) }, },
    { name:'Brutal', showon:'', desc:'A ranged attack with this trait uses its Strength modifier instead of Dexterity on the attack roll.', have:function() { return $scope.trait_db.have(this) }, attack:function() {return $scope.abilities.byName("Strength").mod();}, },
    { name:'Deadly', showon:'', desc:'On a critical hit, the weapon adds a weapon damage die of the listed size. Roll this after doubling the weapon\'s damage. This increases to two dice if the weapon has a greater striking rune and three dice if the weapon has a major striking rune. For instance, a rapier with a greater striking rune deals 2d8 extra piercing damage on a critical hit. An ability that changes the size of the weapon\'s normal damage dice doesn\'t change the size of its deadly die.', have:function() { return $scope.trait_db.have(this) }, },
    { name:'Disarm', showon:'', desc:'You can use this weapon to Disarm with the Athletics skill even if you don\'t have a free hand. This uses the weapon\'s reach (if different from your own) and adds the weapon\'s item bonus to attack rolls (if any) as an item bonus to the Athletics check. If you critically fail a check to Disarm using the weapon, you can drop the weapon to take the effects of a failure instead of a critical failure. On a critical success, you still need a free hand if you want to take the item.', have:function() { return $scope.trait_db.have(this) }, },
    { name:'Dwarf', showon:'', desc:'A creature with this trait is a member of the dwarf ancestry. Dwarves are stout folk who often live underground and typically have darkvision. An ability with this trait can be used or selected only by dwarves. An item with this trait is created and used by dwarves.', have:function() { return $scope.trait_db.have(this) }, },
    { name:'Elf', showon:'', desc:'A creature with this trait is a member of the elf ancestry. Elves are mysterious people with rich traditions of magic and scholarship who typically have low-light vision. An ability with this trait can be used or selected only by elves. A weapon with this trait is created and used by elves.', have:function() { return $scope.trait_db.have(this) }, },
    { name:'Fatal', showon:'', desc:'The fatal trait includes a die size. On a critical hit, the weapon\'s damage die increases to that die size instead of the normal die size, and the weapon adds one additional damage die of the listed size.', have:function() { return $scope.trait_db.have(this) }, },
    { name:'Finesse', showon:'', desc:'You can use your Dexterity modifier instead of your Strength modifier on attack rolls using this melee weapon. You still use your Strength modifier when calculating damage.', have:function() { return $scope.trait_db.have(this) }, attack:function() {if ($scope.abilities.byName("Dexterity").mod() > $scope.abilities.byName("Strength").mod()) {return $scope.abilities.byName("Dexterity").mod();}}, },
    { name:'Forceful', showon:'', desc:'This weapon becomes more dangerous as you build momentum. When you attack with it more than once on your turn, the second attack gains a circumstance bonus to damage equal to the number of weapon damage dice, and each subsequent attack gains a circumstance bonus to damage equal to double the number of weapon damage dice.', have:function() { return $scope.trait_db.have(this) }, },
    { name:'Free-Hand', showon:'', desc:'This weapon doesn\'t take up your hand, usually because it is built into your armor. A free-hand weapon can\'t be Disarmed. You can use the hand covered by your free-hand weapon to wield other items, perform manipulate actions, and so on. You can\'t attack with a free-hand weapon if you\'re wielding anything in that hand or otherwise using that hand. When you\'re not wielding anything and not otherwise using the hand, you can use abilities that require you to have a hand free as well as those that require you to be wielding a weapon in that hand. Each of your hands can have only one free-hand weapon on it.', have:function() { return $scope.trait_db.have(this) }, },
    { name:'Gnome', showon:'', desc:'A creature with this trait is a member of the gnome ancestry. Gnomes are small people skilled at magic who seek out new experiences and usually have low-light vision. An ability with this trait can be used or selected only by gnomes. A weapon with this trait is created and used by gnomes.', have:function() { return $scope.trait_db.have(this) }, },
    { name:'Goblin', showon:'', desc:'A creature with this trait can come from multiple tribes of creatures, including goblins, hobgoblins, and bugbears. Goblins tend to have darkvision. An ability with this trait can be used or chosen only by goblins. A weapon with this trait is created and used by goblins.', have:function() { return $scope.trait_db.have(this) }, },
    { name:'Grapple', showon:'Athletics', desc:'You can use this weapon to Grapple with the Athletics skill even if you don\'t have a free hand. This uses the weapon\'s reach (if different from your own) and adds the weapon\'s item bonus to attack rolls as an item bonus to the Athletics check. If you critically fail a check to Grapple using the weapon, you can drop the weapon to take the effects of a failure instead of a critical failure.', have:function() { return $scope.trait_db.have(this) }, },
    { name:'Halfling', showon:'', desc:'A creature with this trait is a member of the halfling ancestry. These small people are friendly wanderers considered to be lucky. An ability with this trait can be used or selected only by halflings. A weapon with this trait is created and used by halflings.', have:function() { return $scope.trait_db.have(this) }, },
    { name:'Jousting', showon:'', desc:'The weapon is suited for mounted combat with a harness or similar means. When mounted, if you moved at least 10 feet on the action before your attack, add a circumstance bonus to damage for that attack equal to the number of damage dice for the weapon. In addition, while mounted, you can wield the weapon in one hand, changing the damage die to the listed value.', have:function() { return $scope.trait_db.have(this) }, },
    { name:'Monk', showon:'', desc:'Many monks learn to use these weapons.', have:function() { return $scope.trait_db.have(this) }, },
    { name:'Nonlethal', showon:'', desc:'Attacks with this weapon are nonlethal, and are used to knock creatures unconscious instead of kill them. You can use a nonlethal weapon to make a lethal attack with a -2 circumstance penalty.', have:function() { return $scope.trait_db.have(this) }, },
    { name:'Orc', showon:'', desc:'Orcs craft and use these weapons.', have:function() { return $scope.trait_db.have(this) }, },
    { name:'Parry', showon:'', desc:'This weapon can be used defensively to block attacks. While wielding this weapon, if your proficiency with it is trained or better, you can spend an Interact action to position your weapon defensively, gaining a +1 circumstance bonus to AC until the start of your next turn.', have:function() { return $scope.trait_db.have(this) }, },
    { name:'Propulsive', showon:'', desc:'You add half your Strength modifier (if positive) to damage rolls with a propulsive ranged weapon. If you have a negative Strength modifier, you add your full Strength modifier instead.', have:function() { return $scope.trait_db.have(this) }, dmgbonus:function() {return Math.floor($scope.abilities.byName("Strength").mod() / (($scope.abilities.byName("Strength").mod() > 0) ? 2 : 1));}, },
    { name:'Range', showon:'', desc:'These attacks will either list a finite range or a range increment, which follows the normal rules for range increments.', have:function() { return $scope.trait_db.have(this) }, },
    { name:'Ranged Trip', showon:'Athletics', desc:'This weapon can be used to Trip with the Athletics skill at a distance up to the weapon\'s first range increment. The skill check takes a -2 circumstance penalty. You can add the weapon\'s item bonus to attack rolls as a bonus to the check. As with using a melee weapon to trip, a ranged trip doesn\'t deal any damage when used to Trip. This trait usually only appears on a thrown weapon.', have:function() { return $scope.trait_db.have(this) }, },
    { name:'Reach', showon:'', desc:'Natural attacks with this trait can be used to attack creatures up to the listed distance away instead of only adjacent creatures. Weapons with this trait are long and can be used to attack creatures up to 10 feet away instead of only adjacent creatures. For creatures that already have reach with the limb or limbs that wield the weapon, the weapon increases their reach by 5 feet.', have:function() { return $scope.trait_db.have(this) }, },
    { name:'Shove', showon:'Athletics', desc:'You can use this weapon to Shove with the Athletics skill even if you don\'t have a free hand. This uses the weapon\'s reach (if different from your own) and adds the weapon\'s item bonus to attack rolls as an item bonus to the Athletics check. If you critically fail a check to Shove using the weapon, you can drop the weapon to take the effects of a failure instead of a critical failure.', have:function() { return $scope.trait_db.have(this) }, },
    { name:'Sweep', showon:'Athletics', desc:'This weapon makes wide sweeping or spinning attacks, making it easier to attack multiple enemies. When you attack with this weapon, you gain a +1 circumstance bonus to your attack roll if you already attempted to attack a different target this turn using this weapon.', have:function() { return $scope.trait_db.have(this) }, },
    { name:'Tethered', showon:'', desc:'This weapon is attached to a length of rope or chain that allows you to retrieve it after it has left your hand. If you have a free hand while wielding this weapon, you can use an Interact action to pull the weapon back into your grasp after you have thrown it as a ranged attack or after it has been disarmed (unless it is being held by another creature).', have:function() { return $scope.trait_db.have(this) }, },
    { name:'Thrown', showon:'', desc:'You can throw this weapon as a ranged attack, and it is a ranged weapon when thrown. A thrown weapon adds your Strength modifier to damage just like a melee weapon does. When this trait appears on a melee weapon, it also includes the range increment. Ranged weapons with this trait use the range increment specified in the weapon\'s Range entry.', have:function() { return $scope.trait_db.have(this) }, dmgbonus:function() {return $scope.abilities.byName("Strength").mod();}, },
    { name:'Trip', showon:'Athletics', desc:'You can use this weapon to Trip with the Athletics skill even if you don\'t have a free hand. This uses the weapon\'s reach (if different from your own) and adds the weapon\'s item bonus to attack rolls as an item bonus to the Athletics check. If you critically fail a check to Trip using the weapon, you can drop the weapon to take the effects of a failure instead of a critical failure.', have:function() { return $scope.trait_db.have(this) }, },
    { name:'Twin', showon:'', desc:'These weapons are used as a pair, complementing each other. When you attack with a twin weapon, you add a circumstance bonus to the damage roll equal to the weapon\'s number of damage dice if you have previously attacked with a different weapon of the same type this turn. The weapons must be of the same type to benefit from this trait, but they don\'t need to have the same runes.', have:function() { return $scope.trait_db.have(this) }, },
    { name:'Two-Hand', showon:'', desc:'This weapon can be wielded with two hands. Doing so changes its weapon damage die to the indicated value. This change applies to all the weapon\'s damage dice, such as those from striking runes.', have:function() { return $scope.trait_db.have(this) }, },
    { name:'Unarmed', showon:'', desc:'An unarmed attack uses your body rather than a manufactured weapon. An unarmed attack isn\'t a weapon, though it\'s categorized with weapons for weapon groups, and it might have weapon traits. Since it\'s part of your body, an unarmed attack can\'t be Disarmed. It also doesn\'t take up a hand, though a fist or other grasping appendage follows the same rules as a free-hand weapon.', have:function() { return $scope.trait_db.have(this) }, },
    { name:'Versatile', showon:'', desc:'A versatile weapon can be used to deal a different type of damage than that listed in the Damage entry. This trait indicates the alternate damage type. For instance, a piercing weapon that is versatile S can be used to deal piercing or slashing damage. You choose the damage type each time you make an attack.', have:function() { return $scope.trait_db.have(this) }, },
    { name:'Volley', showon:'', desc:'This ranged weapon is less effective at close distances. Your attacks against targets that are at a distance within the range listed take a -2 penalty.', have:function() { return $scope.trait_db.have(this) }, },
    { name:'Bulwark', showon:'Reflex', desc:'The armor covers you so completely that it provides benefits against some damaging effects. On Reflex saves to avoid a damaging effect, such as a fireball, you add a +3 modifier instead of your Dexterity modifier.', have:function() { return $scope.trait_db.have(this) }, },
    { name:'Comfort', showon:'', desc:'The armor is so comfortable that you can rest normally while wearing it.', have:function() { return $scope.trait_db.have(this) }, },
    { name:'Flexible', showon:'', desc:'The armor is flexible enough that it doesn\'t hinder most actions. You don\'t apply its check penalty to Acrobatics or Athletics checks.', have:function() { return $scope.trait_db.have(this) }, },
    { name:'Noisy', showon:'', desc:'This armor is loud and likely to alert others to your presence. The armor\'s check penalty applies to Stealth checks even if you meet the required Strength score.', have:function() { return $scope.trait_db.have(this) }, },
  ]
  //The feats list is full of feats that don't do anything yet. Others just add a little hint to a property like a skill or have an active effect.
  //Feats that require or affect a Lore skill get expanded or copied when a new Lore skill gets added, so this list can vary in the runtime
  //canChoose() is a function where all the -req fields are evaluated. specialreq is for feats that have uncommon requirements (such as "no Deity selected") and needs to be a string that contains a true/false evaluation
  $scope.feat_db = [
    { name:'Adopted Ancestry: Dwarf', desc:'Gain access to ancestry feats from another ancestry.', levelreq:1, traits:['General'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Adopted Ancestry: Elf', desc:'Gain access to ancestry feats from another ancestry.', levelreq:1, traits:['General'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Adopted Ancestry: Gnome', desc:'Gain access to ancestry feats from another ancestry.', levelreq:1, traits:['General'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Adopted Ancestry: Goblin', desc:'Gain access to ancestry feats from another ancestry.', levelreq:1, traits:['General'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Adopted Ancestry: Halfling', desc:'Gain access to ancestry feats from another ancestry.', levelreq:1, traits:['General'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Adopted Ancestry: Orc', desc:'Gain access to ancestry feats from another ancestry.', levelreq:1, traits:['General'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Armor Proficiency: Light armor', desc:'Become trained in a type of armor.', levelreq:1, showon:'light', traits:['General'], effects:['Light =2'], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Armor Proficiency: Medium armor', desc:'Become trained in a type of armor.', levelreq:1, armorreq:'Light, 2', showon:'medium', traits:['General'], effects:['Medium =2'], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Armor Proficiency: Heavy armor', desc:'Become trained in a type of armor.', levelreq:1, armorreq:'Medium, 2', showon:'heavy', traits:['General'], effects:['Heavy =2'], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Breath Control', desc:'Hold your breath longer and gain benefits against inhaled threats.', levelreq:1, showon:'fortitude', traits:['General'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Canny Acumen: Perception', desc:'Become an expert in a saving throw or Perception.', levelreq:1, traits:['General'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Canny Acumen: Fortitude', desc:'Become an expert in a saving throw or Perception.', levelreq:1, traits:['General'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Canny Acumen: Reflex', desc:'Become an expert in a saving throw or Perception.', levelreq:1, traits:['General'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Canny Acumen: Will', desc:'Become an expert in a saving throw or Perception.', levelreq:1, traits:['General'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Diehard', desc:'Die at dying 5, rather than dying 4.', levelreq:1, showon:'health', traits:['General'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Fleet', desc:'Increase your Speed by 5 feet.', levelreq:1, showon:'speed', traits:['General'], effects:['speed +5'], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Incredible Initiative', desc:'+2 to initiative rolls.', levelreq:1, showon:'perception', traits:['General'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Ride', desc:'Automatically succeed at commanding your mount to move.', levelreq:1, showon:'nature', traits:['General'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Shield Block', desc:'Ward off a blow with your shield.', levelreq:1, showon:'defense', traits:['General'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Toughness', desc:'Increase your maximum HP and reduce the DCs of recovery checks.', levelreq:1, showon:'health', traits:['General'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Weapon Proficiency: Simple Weapons', desc:'Become trained in a weapon type.', levelreq:1, showon:'weaponProfs', traits:['General'], effects:['Simple =2'], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Weapon Proficiency: Martial Weapons', desc:'Become trained in a weapon type.', levelreq:1, weaponreq:'Simple, 2', showon:'', traits:['General'], effects:['Martial =2'], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Weapon Proficiency: Advanced Weapon', desc:'Become trained in a weapon type.', levelreq:1, weaponreq:'Martial, 2', showon:'', traits:['General'], effects:[], todo:'generate for each advanced weapon', have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Ancestral Paragon', desc:'Gain a 1st-level ancestry feat.', levelreq:3, traits:['General'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Untrained Improvisation', desc:'Become more adept at using untrained skills.', levelreq:3, traits:['General'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Different Worlds', desc:'Create a second identity for yourself with a different name, history, and background.', levelreq:1, traits:['General', 'Uncommon'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Godless Healing', desc:'With limited access to divine healing magic, Rahadoumi often become adept at using ordinary medicine for when dangerous situations arise.', levelreq:2, featreq:'Battle Medicine', specialreq:'$scope.character.deity==""', showon:'medicine', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Incredible Investiture', desc:'Invest up to 12 magic items.', levelreq:11, abilityreq:'Charisma, 16', showon:'items', traits:['General'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Fast Recovery', desc:'Regain more HP from rest, recover faster from disease and poisons.', levelreq:1, abilityreq:'Constitution, 14', showon:'health, fortitude', traits:['General'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Feather Step', desc:'Step into difficult terrain.', levelreq:1, abilityreq:'Dexterity, 14', showon:'speed', traits:['General'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Automatic Knowledge: Arcana', desc:'Recall Knowledge as a free action once per round.', levelreq:2, skillreq:'Arcana, 4', featreq:'Assurance: Arcana', showon:'arcana', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Automatic Knowledge: Crafting', desc:'Recall Knowledge as a free action once per round.', levelreq:2, skillreq:'Crafting, 4', featreq:'Assurance: Crafting', showon:'crafting', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Automatic Knowledge: Lore', desc:'Recall Knowledge as a free action once per round.', levelreq:2, lorebase:true, skillreq:'Lore, 4', featreq:'Assurance: Lore', showon:'Lore', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Automatic Knowledge: Medicine', desc:'Recall Knowledge as a free action once per round.', levelreq:2, skillreq:'Medicine, 4', featreq:'Assurance: Medicine', showon:'medicine', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Automatic Knowledge: Nature', desc:'Recall Knowledge as a free action once per round.', levelreq:2, skillreq:'Nature, 4', featreq:'Assurance: Nature', showon:'nature', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Automatic Knowledge: Occultism', desc:'Recall Knowledge as a free action once per round.', levelreq:2, skillreq:'Occultism, 4', featreq:'Assurance: Occultism', showon:'occultism', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Automatic Knowledge: Religion', desc:'Recall Knowledge as a free action once per round.', levelreq:2, skillreq:'Religion, 4', featreq:'Assurance: Religion', showon:'religion', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Automatic Knowledge: Society', desc:'Recall Knowledge as a free action once per round.', levelreq:2, skillreq:'Society, 4', featreq:'Assurance: Society', showon:'society', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Nimble Crawl', desc:'Crawl at a faster rate.', levelreq:2, skillreq:'Acrobatics, 4', showon:'acrobatics', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Eye of the Arclords', desc:'The Arclords of Nex have achieved a unique mastery of magic.', levelreq:2, skillreq:'Arcana, 4', featreq:'Arcane Sense', showon:'arcana', traits:['General', 'Skill', 'Uncommon'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Magical Shorthand', desc:'Expert in Arcana, Nature, Occultism, Learn spells quickly and at a reduced cost.', levelreq:2, skillreq:'Arcana, 4|Nature, 4|Occultism, 4|Religion, 4', showon:'arcana, nature, occultism, religion', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Powerful Leap', desc:'Jump farther and higher.', levelreq:2, skillreq:'Athletics, 4', showon:'athletics', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Rapid Mantel', desc:'Pull yourself onto ledges quickly.', levelreq:2, skillreq:'Athletics, 4', showon:'athletics', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Magical Crafting', desc:'Craft magic items.', levelreq:2, skillreq:'Crafting, 4', showon:'crafting', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Tweak Appearances', desc:'You can alter a creature\'s clothing to improve their social impact.', levelreq:2, skillreq:'Crafting, 4', showon:'crafting', traits:['General', 'Skill', 'Uncommon'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Backup Disguise', desc:'You have a specific disguise that you keep at the ready, worn underneath your outer garment.', levelreq:2, skillreq:'Deception, 4', showon:'deception', traits:['General', 'Skill', 'Uncommon'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Confabulator', desc:'Reduce the bonuses against your repeated lies.', levelreq:2, skillreq:'Deception, 4', showon:'deception', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Quick Disguise', desc:'Set up a disguise in only half the time.', levelreq:2, skillreq:'Deception, 4', showon:'deception', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Sow Rumor', desc:'You spread rumors, which may or may not be true, about a specific subject.', levelreq:2, skillreq:'Deception, 4', showon:'deception', traits:['General', 'Secret', 'Skill', 'Uncommon'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Glad-Hand', desc:'Make an Impression on a target you\'ve just met.', levelreq:2, skillreq:'Diplomacy, 4', showon:'diplomacy', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Lasting Coercion', desc:'Coerce a target into helping you longer.', levelreq:2, skillreq:'Intimidation, 4', showon:'intimidation', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Unmistakable Lore', desc:'Recall Knowledge about your Lore more effectively.', levelreq:2, skillreq:"Lore, 2", showon:'Lore', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Continual Recovery', desc:'Treat Wounds on a patient more often.', levelreq:2, skillreq:'Medicine, 4', showon:'medicine', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Robust Recovery', desc:'Greater benefits from Treat Disease and Treat Poison.', levelreq:2, skillreq:'Medicine, 4', showon:'medicine', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Ward Medic', desc:'Treat several patients at once.', levelreq:2, skillreq:'Medicine, 4', showon:'medicine', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Bonded Animal', desc:'An animal becomes permanently helpful to you.', levelreq:2, skillreq:'Nature, 4', showon:'nature', traits:['General', 'Downtime', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Connections', desc:'Leverage your connections for favors and meetings.', levelreq:2, skillreq:'Society, 4', featreq:'Courtly Graces', showon:'society', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Quiet Allies', desc:'Roll a single Stealth check when sneaking with allies.', levelreq:2, skillreq:'Stealth, 4', showon:'stealth', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Wilderness Spotter', desc:'Use Survival for your Initiative when in a specific terrain.', levelreq:2, skillreq:'Survival, 4', showon:'survival', traits:['General', 'Skill', 'Uncommon'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Wary Disarmament', desc:'+2 to AC or saves against devices or traps you trigger while disarming.', levelreq:2, skillreq:'Thievery, 4', showon:'thievery', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Skill Training', desc:'Become trained in a skill.', levelreq:1, abilityreq:'Intelligence, 12', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Unified Theory', desc:'Use Arcana for checks for all magical traditions.', levelreq:15, skillreq:'Arcana, 8', showon:'arcana', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Cloud Jump', desc:'Jump impossible distances.', levelreq:15, skillreq:'Athletics, 8', showon:'athletics', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Craft Anything', desc:'Ignore most requirements for crafting items.', levelreq:15, skillreq:'Crafting, 8', showon:'crafting', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Reveal Machinations', desc:'You convince a creature that you played a minor but recurring role in its life.', levelreq:15, skillreq:'Deception, 8', showon:'deception', traits:['General', 'Rare', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Legendary Negotiation', desc:'Quickly parley with foes.', levelreq:15, skillreq:'Diplomacy, 8', showon:'diplomacy', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Scare to Death', desc:'Scare a target so much, they might die.', levelreq:15, skillreq:'Intimidation, 8', showon:'intimidation', traits:['General', 'Death', 'Emotion', 'Fear', 'Incapacitation', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Legendary Professional', desc:'Gain renown for your Lore.', levelreq:15, skillreq:"Lore, 8", showon:'lore', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Legendary Medic', desc:'Remove disease or the blinded, deafened, doomed, or drained condition.', levelreq:15, skillreq:'Medicine, 8', showon:'medicine', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Legendary Performer', desc:'Gain renown for your Performance Virtuosic Performer.', levelreq:15, skillreq:'Performance, 8', featreq:'Virtuosic Performer', showon:'performer', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Divine Guidance', desc:'Find guidance in the writings of your faith.', levelreq:15, skillreq:'Religion, 8', showon:'religion', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Legendary Codebreaker', desc:'Quickly Decipher Writing using Society.', levelreq:15, skillreq:'Society, 8', showon:'society', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Legendary Linguist', desc:'Create pidgin languages to communicate with anyone.', levelreq:15, skillreq:'Society, 8', featreq:'Multilingual', showon:'society', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Legendary Sneak', desc:'Hide and Sneak without cover or being concealed.', levelreq:15, skillreq:'Stealth, 8', featreq:'Swift Sneak', showon:'stealth', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Legendary Survivalist', desc:'Survive extreme conditions.', levelreq:15, skillreq:'Survival, 8', showon:'survival', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Legendary Thief', desc:'Steal what would normally be impossible to steal.', levelreq:15, skillreq:'Thievery, 8', featreq:'Pickpocket', showon:'thievery', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Kip Up', desc:'Stand up for free without triggering reactions.', levelreq:7, skillreq:'Acrobatics, 6', showon:'acrobatics', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Quick Recognition', desc:'Master in Arcana, Nature, Occultism, Identify spells as a free action.', levelreq:7, skillreq:'Arcana, 6 OR Nature, 6 OR Occultism, 6 OR Religion, 6', featreq:'Recognize Spell', showon:'arcana, nature, occultism, religion', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Quick Climber', desc:'Climb swiftly.', levelreq:7, skillreq:'Athletics, 6', showon:'athletics', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Quick Swim', desc:'Swim quickly.', levelreq:7, skillreq:'Athletics, 6', showon:'athletics', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Wall Jump', desc:'Jump of walls.', levelreq:7, skillreq:'Athletics, 6', showon:'athletics', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Inventor', desc:'Use Crafting to create item formulas.', levelreq:7, skillreq:'Crafting, 6', showon:'crafting', traits:['General', 'Downtime', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Impeccable Crafter', desc:'Specialty Crafting Craft items more efficiently.', levelreq:7, skillreq:'Crafting, 6', featreq:'Specialty Crafting', showon:'crafting', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Slippery Secrets', desc:'Evade attempts to uncover your true nature.', levelreq:7, skillreq:'Deception, 6', showon:'deception', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Shameless Request', desc:'Make Requests of others with lesser consequences.', levelreq:7, skillreq:'Diplomacy, 6', showon:'diplomacy', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Entourage', desc:'You have a small group of admirers who tend to follow you around while you’re in civilized settlements.', levelreq:7, skillreq:'Diplomacy, 6', featreq:'Hobnobber', showon:'diplomacy', traits:['General', 'Rare', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Battle Cry', desc:'Demoralizes foes when you roll for initiative.', levelreq:7, skillreq:'Intimidation, 6', showon:'intimidation', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Terrified Retreat', desc:'Cause foes you Demoralize to flee.', levelreq:7, skillreq:'Intimidation, 6', showon:'intimidation', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Bizarre Magic', desc:'Your magic becomes more difficult to identify.', levelreq:7, skillreq:'Occultism, 6', showon:'occultism', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Expeditious Search', desc:'Search areas in half the time.', levelreq:7, skillreq:'Perception, 6', showon:'perception', traits:['General'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Foil Senses', desc:'Take precautions against special senses.', levelreq:7, skillreq:'Stealth, 6', showon:'stealth', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Swift Sneak', desc:'Move your full Speed while you Sneak.', levelreq:7, skillreq:'Stealth, 6', showon:'stealth', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Planar Survival', desc:'Use Survival to Subsist on different planes.', levelreq:7, skillreq:'Survival, 6', showon:'survival', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Quick Unlock', desc:'Pick a Lock with 1 action.', levelreq:7, skillreq:'Thievery, 6', showon:'thievery', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Intimidating Prowess', desc:'Gain a bonus to physically Demoralize a target.', levelreq:2, abilityreq:'Strength, 16', skillreq:'Intimidation, 4', showon:'intimidation', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Dubious Knowledge', desc:'Learn true and erroneous knowledge on failed check.', levelreq:1, skillreq:'Arcana, 2|Crafting, 2|Lore, 2|Medicine, 2|Nature, 2|Occultism, 2|Religion, 2|Society, 2', showon:'arcana, crafting, lore, medicine, nature, occultism, religion, society', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Cat Fall', desc:'Treat falls as shorter than they are.', levelreq:1, skillreq:'Acrobatics, 2', showon:'acrobatics', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Quick Squeeze', desc:'Move swiftly as you Squeeze.', levelreq:1, skillreq:'Acrobatics, 2', showon:'acrobatics', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Steady Balance', desc:'Maintain your balance in adverse conditions.', levelreq:1, skillreq:'Acrobatics, 2', showon:'acrobatics', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Arcane Sense', desc:'Cast detect magic at will as an arcane innate spell.', levelreq:1, skillreq:'Arcana, 2', showon:'arcana', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Quick Identification', desc:'Identify Magic in 1 minute or less.', levelreq:1, skillreq:'Arcana, 2|Nature, 2|Occultism, 2|Religion, 2', showon:'arcana, nature, occultism, religion', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Recognize Spell', desc:'Identify a spell as a reaction as it\'s being cast.', levelreq:1, skillreq:'Arcana, 2|Nature, 2|Occultism, 2|Religion, 2', showon:'arcana, nature, occultism, religion', traits:['General', 'Secret', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Trick Magic Item', desc:'Activate a magic item you normally can\'t activate.', levelreq:1, skillreq:'Arcana, 2|Nature, 2|Occultism, 2|Religion, 2', showon:'arcana, nature, occultism, religion', traits:['General', 'Manipulate', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Assurance: Acrobatics', desc:'Receive a fixed result on a skill check.', levelreq:1, skillreq:'Acrobatics, 2', showon:'acrobatics', traits:['General', 'Fortune', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Assurance: Arcana', desc:'Receive a fixed result on a skill check.', levelreq:1, skillreq:'Arcana, 2', showon:'arcana', traits:['General', 'Fortune', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Assurance: Athletics', desc:'Receive a fixed result on a skill check.', levelreq:1, skillreq:'Athletics, 2', showon:'athletics', traits:['General', 'Fortune', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Assurance: Crafting', desc:'Receive a fixed result on a skill check.', levelreq:1, skillreq:'Crafting, 2', showon:'crafting', traits:['General', 'Fortune', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Assurance: Deception', desc:'Receive a fixed result on a skill check.', levelreq:1, skillreq:'Deception, 2', showon:'deception', traits:['General', 'Fortune', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Assurance: Diplomacy', desc:'Receive a fixed result on a skill check.', levelreq:1, skillreq:'Diplomacy, 2', showon:'diplomacy', traits:['General', 'Fortune', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Assurance: Intimidation', desc:'Receive a fixed result on a skill check.', levelreq:1, skillreq:'Intimidation, 2', showon:'intimidation', traits:['General', 'Fortune', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Assurance: Lore', desc:'Receive a fixed result on a skill check.', levelreq:1, lorebase:true, skillreq:'Lore, 2', showon:'Lore', traits:['General', 'Fortune', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Assurance: Medicine', desc:'Receive a fixed result on a skill check.', levelreq:1, skillreq:'Medicine, 2', showon:'medicine', traits:['General', 'Fortune', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Assurance: Nature', desc:'Receive a fixed result on a skill check.', levelreq:1, skillreq:'Nature, 2', showon:'nature', traits:['General', 'Fortune', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Assurance: Occultism', desc:'Receive a fixed result on a skill check.', levelreq:1, skillreq:'Occultism, 2', showon:'occultism', traits:['General', 'Fortune', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Assurance: Performance', desc:'Receive a fixed result on a skill check.', levelreq:1, skillreq:'Performance, 2', showon:'performance', traits:['General', 'Fortune', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Assurance: Religion', desc:'Receive a fixed result on a skill check.', levelreq:1, skillreq:'Religion, 2', showon:'religion', traits:['General', 'Fortune', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Assurance: Society', desc:'Receive a fixed result on a skill check.', levelreq:1, skillreq:'Society, 2', showon:'society', traits:['General', 'Fortune', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Assurance: Stealth', desc:'Receive a fixed result on a skill check.', levelreq:1, skillreq:'Stealth, 2', showon:'stealth', traits:['General', 'Fortune', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Assurance: Survival', desc:'Receive a fixed result on a skill check.', levelreq:1, skillreq:'Survival, 2', showon:'survival', traits:['General', 'Fortune', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Assurance: Thievery', desc:'Receive a fixed result on a skill check.', levelreq:1, skillreq:'Thievery, 2', showon:'thievery', traits:['General', 'Fortune', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Combat Climber', desc:'Fight more effectively as you Climb.', levelreq:1, skillreq:'Athletics, 2', showon:'athletics', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Hefty Hauler', desc:'Increase your Bulk limits by 2.', levelreq:1, skillreq:'Athletics, 2', showon:'athletics', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Quick Jump', desc:'High Jump or Long Jump as a single action.', levelreq:1, skillreq:'Athletics, 2', showon:'athletics', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Titan Wrestler', desc:'Disarm, Grapple, Shove, or Trip larger creatures.', levelreq:1, skillreq:'Athletics, 2', showon:'athletics', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Underwater Marauder', desc:'Fight more effectively underwater.', levelreq:1, skillreq:'Athletics, 2', showon:'athletics', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Alchemical Crafting', desc:'Craft alchemical items.', levelreq:1, skillreq:'Crafting, 2', showon:'crafting', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Quick Repair', desc:'Repair items quickly.', levelreq:1, skillreq:'Crafting, 2', showon:'crafting', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Snare Crafting', desc:'Craft snares.', levelreq:1, skillreq:'Crafting, 2', showon:'crafting', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Specialty Crafting', desc:'Gain bonuses to Craft certain items.', levelreq:1, skillreq:'Crafting, 2', showon:'crafting', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Charming Liar', desc:'Improve a target\'s attitude with your lies.', levelreq:1, skillreq:'Deception, 2', showon:'deception', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Lengthy Diversion', desc:'Remain hidden after you Create a Diversion.', levelreq:1, skillreq:'Deception, 2', showon:'deception', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Lie to Me', desc:'Use Deception to detect lies.', levelreq:1, skillreq:'Deception, 2', showon:'deception', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Secret Speech', desc:'Learn the secret language of a society.', levelreq:1, skillreq:'Deception, 2', showon:'deception', traits:['General', 'Skill', 'Uncommon'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Bargain Hunter', desc:'Earn Income by searching for deals.', levelreq:1, skillreq:'Diplomacy, 2', showon:'diplomacy', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Group Impression', desc:'Make an Impression on multiple targets at once.', levelreq:1, skillreq:'Diplomacy, 2', showon:'diplomacy', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Hobnobber', desc:'Gather Information rapidly.', levelreq:1, skillreq:'Diplomacy, 2', showon:'diplomacy', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Group Coercion', desc:'Coerce multiple targets simultaneously.', levelreq:1, skillreq:'Intimidation, 2', showon:'intimidation', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Intimidating Glare', desc:'Demoralize a creature without speaking.', levelreq:1, skillreq:'Intimidation, 2', showon:'intimidation', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Quick Coercion', desc:'Coerce a creature quickly.', levelreq:1, skillreq:'Intimidation, 2', showon:'intimidation', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Additional Lore', desc:'Become trained in another Lore subcategory.', levelreq:1, skillreq:'Lore, 2', showon:'', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Experienced Professional', desc:'Prevent critical failures when Earning Income.', levelreq:1, skillreq:'Lore, 2', showon:'lore', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Battle Medicine', desc:'Heal yourself or an ally in battle.', levelreq:1, skillreq:'Medicine, 2', showon:'medicine', traits:['General', 'Healing', 'Manipulate', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Natural Medicine', desc:'Use Nature to Treat Wounds.', levelreq:1, skillreq:'Nature, 2', showon:'nature', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Train Animal', desc:'Teach an animal a trick.', levelreq:1, skillreq:'Nature, 2', showon:'nature', traits:['General', 'Downtime', 'Manipulate', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Oddity Identification', desc:'+2 to Occultism checks to Identify Magic with certain traits.', levelreq:1, skillreq:'Occultism, 2', showon:'occultism', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Fascinating Performance', desc:'Perform to fascinate observers.', levelreq:1, skillreq:'Performance, 2', showon:'performance', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Impressive Performance', desc:'Make an Impression with Performance.', levelreq:1, skillreq:'Performance, 2', showon:'performance', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Virtuosic Performer', desc:'+1 with a certain type of performance.', levelreq:1, skillreq:'Performance, 2', showon:'performance', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Student of the Canon', desc:'More accurately recognize the tenets of your faith or philosophy.', levelreq:1, skillreq:'Religion, 2', showon:'religion', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Courtly Graces', desc:'Use Society to get along in noble society.', levelreq:1, skillreq:'Society, 2', showon:'society', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Multilingual', desc:'Learn two new languages.', levelreq:1, skillreq:'Society, 2', showon:'society', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Read Lips', desc:'Read the lips of people you can see.', levelreq:1, skillreq:'Society, 2', showon:'society', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Sign Language', desc:'Learn sign languages.', levelreq:1, skillreq:'Society, 2', showon:'society', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Streetwise', desc:'Use Society to Gather Information and Recall Knowledge.', levelreq:1, skillreq:'Society, 2', showon:'society', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Experienced Smuggler', desc:'Conceal items from observers more effectively.', levelreq:1, skillreq:'Stealth, 2', showon:'stealth', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Terrain Stalker', desc:'Sneak in certain terrain without attempting a check.', levelreq:1, skillreq:'Stealth, 2', showon:'stealth', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Experienced Tracker', desc:'Track at your full Speed at a –5 penalty.', levelreq:1, skillreq:'Survival, 2', showon:'survival', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Forager', desc:'Forage for supplies to provide for multiple creatures.', levelreq:1, skillreq:'Survival, 2', showon:'survival', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Survey Wildlife', desc:'Identify nearby creatures through signs and clues.', levelreq:1, skillreq:'Survival, 2', showon:'survival', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Terrain Expertise', desc:'+1 to Survival checks in certain terrain.', levelreq:1, skillreq:'Survival, 2', showon:'survival', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Pickpocket', desc:'Steal or Palm an Object more effectively.', levelreq:1, skillreq:'Thievery, 2', showon:'thievery', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
    { name:'Subtle Theft', desc:'Your thefts are harder to notice.', levelreq:1, skillreq:'Thievery, 2', showon:'thievery', traits:['General', 'Skill'], effects:[], have:false, canChoose:function(){return $scope.feat_db.canChoose(this);} },
  ]

  $scope.newLore = "";
  //The result of effects() is stored in effectsData to avoid infdig from stability checks (and running effects() too much).
  //Only the effects list should call effects(), all other functions can use effectsData instead.
  $scope.effectsData = [];

  //scope functions
  $scope.initNotes = function(objects) {
    //Only used when the page is loaded. In the given objects, if there is a note, enable showing the note.
    angular.forEach (objects, function (obj) {
      obj.showNotes = obj.note ? true : false;
    });
  };
  //all these functions allow getting an entry from a list by its name instead of its index. This is always strict.
  //If there are multiple entries with the same name, only the first is used, so make sure you don't use duplicate names or don't use them in functions that should affect all of them.
  //Pathfinder avoids duplicate names, but you can add the same item to your inventory multiple times.
  $scope.abilities.byName = function($name) {
    return $filter('filter')($scope.abilities, {name:$name}, true)[0];
  };
  $scope.skills.byName = function($name) {
    return $filter('filter')($scope.skills, {name:$name}, true)[0];
  };
  $scope.saves.byName = function($name) {
    return $filter('filter')($scope.saves, {name:$name}, true)[0];
  };
  $scope.feat_db.byName = function($name) {
    return $filter('filter')($scope.feat_db, {name:$name}, true)[0];
  };
  $scope.weaponProfs.byName = function($name) {
    return $filter('filter')($scope.weaponProfs, {name:$name}, true)[0];
  };
  $scope.armorProfs.byName = function($name) {
    return $filter('filter')($scope.armorProfs, {name:$name}, true)[0];
  };
  $scope.items.byName = function($name) {
    return $filter('filter')($scope.items, {name:$name}, true)[0];
  };
  $scope.item_db.byName = function($name) {
    return $filter('filter')($scope.item_db, {name:$name}, true)[0];
  };
  $scope.trait_db.byName = function($name) {
  //When getting a Trait by name, only the first word is searched. Traits are always one word, but a weapon may have "Thrown 10ft" instead of just "Thrown".
    return $filter('filter')($scope.trait_db, {name:$name.split(" ")[0]}, true)[0];
  };
  $scope.abilities.effectiveAbility = function(ability) {
  //Calculates the ability with all active effects
    //Get all active effects on the ability
    itembonus = $scope.getEffects(ability);
    //Add the effect bonus to the base value - parseInt'ed because it's from a textbox - and return it
    return parseInt(ability.basevalue) + itembonus;
  };
  $scope.abilities.mod = function(ability) {
  //Calculates the ability modifier from the effective ability in the usual d20 fashion - 0-1 > -5; 2-3 > -4; ... 10-11 > 0; 12-13 > 1 etc.
    return Math.floor((ability.value()-10)/2)
  }
  $scope.AC.effectiveAC = function(ac) {
  //Calculates the armor class from armor and all effects gained from raised shields or weapons
  //This is only called from the AC's value() method, and the AC is passed for easy function calls
    //Applies the charArmorDefense filter to the first (and only) worn armor to get the basic passive armor class
    armor = $filter('filter')($scope.items, {type:"armor",equip:true})[0];
    acbonus = $filter('charArmorDefense')(armor, $scope.level, $scope.abilities, $scope.armorProfs);
    //Adds all active effects on AC
    acbonus += $scope.getEffects(ac);
    return acbonus;
  }
  $scope.getEffects = function($affectedObj) {
  //Gets the sum of all effects on this object and writes the list into its effects property
  //Requires the passed object to have both a name and an effect property
    result = 0;
    //reset the object's effects property
    $affectedObj.effects.length = 0;
    //If any effect in $scope.effectsData has the object's name as a target and is marked as applicable, add it to the effect bonus and list its value and source in the object's own effects property
    angular.forEach ($filter('filter')($scope.effectsData, {target:$affectedObj.name,apply:true}, true), function(effect) {
      //parseInt the effect's value for the likely case it's a string like "+1"
      result += parseInt(effect.value);
      $affectedObj.effects.push(effect.value + " (" + effect.source + ")");
    });
    return result;
  }
  $scope.trait_db.have = function(trait) {
  //Is there any equipped item that has this trait? Incidentally uses the haveTrait() function that asks if that one item has this trait - you can see where this is going.
  //Returns true if any ( some() ) of the equipped items can say yes to having the trait
    itemsEquipped = $filter('filter')($scope.items, {equip:true})
    return itemsEquipped.some(function(item){return app.haveTrait(item,trait.name)}) && true;
  };
  $scope.feat_db.canChoose = function(feat) {
  //This function evaluates ALL the possible requirements for taking a feat
  //Returns true only if all the requirements are true. If the feat doesn't have a requirement, it is always true.
    //First of all, never list feats that only show on the "Lore" skill - these are templates and never used directly
    //Copies are made in $scope.generateLore() individually for every unique lore, and these may show up on this list
    if (feat.showon == "Lore") {
      return false;
    }
    //If the feat has a levelreq, check if the level beats that.
    levelreq = (feat.levelreq) ? ($scope.level >= feat.levelreq) : true;
    //If the feat has an abilityreq, split it into the ability and the requirement (they come in strings like "Dexterity, 12"), then check if that ability's value() meets the requirement. 
    abilityreq = (feat.abilityreq) ? ($scope.abilities.byName(feat.abilityreq.split(",")[0]).value() >= parseInt(feat.abilityreq.split(",")[1])) : true;
    //If the feat has a skillreq, first split it into all different requirements (they come in strings like "Athletics, 2|Acrobatics, 2" or just "Acrobatics, 2")
    //Then check if any one of these requirements (split into the skill and the number) are met by the skill's level
    //These are always OR requirements, you never need two skills for a feat.
    if (feat.skillreq) {
      skillreqs = feat.skillreq.split("|");
      skillreq = skillreqs.some(function(requirement){return $scope.skills.byName(requirement.split(",")[0]).level >= parseInt(requirement.split(",")[1])}) && true;
    } else {skillreq = true;}
    //If the feat has a weaponreq, split it and check if the named weapon proficiency's level meets the number
    weaponreq = (feat.weaponreq) ? ($scope.weaponProfs.byName(feat.weaponreq.split(",")[0]).level >= parseInt(feat.weaponreq.split(",")[1])) : true;
    //If the feat has an armorreq, split it and check if the named armor proficiency's level meets the number
    armorreq = (feat.armorreq) ? ($scope.armorProfs.byName(feat.armorreq.split(",")[0]).level >= parseInt(feat.armorreq.split(",")[1])) : true;
    //Lastly, if the feat has a specialreq, it comes as a string that contains a condition. Evaluate the condition to find out if the requirement is met.
    specialreq = (feat.specialreq) ? (eval(feat.specialreq)) : true;
    //Return true if all are true
    return levelreq && abilityreq && skillreq && weaponreq && armorreq && specialreq;
  }
  $scope.effects = function() {
  //This is a terrible, horrible, no good, very bad function, but it is absolutely necessary.
  //It goes over every equipped item and taken feat, reads their "effects" and turns them into standardized effect data that is ultimately stored in $scope.effectsData
  //That wouldn't be so bad, but there are so many exceptions. Like skill penalties that don't apply if you meet a strength requirement, unless the item also has a certain trait,
  // and speed penalties that still apply even then, but in a lessened form, and shield bonuses that only apply if the shield is raised, and get higher if you also take cover.
  //These exceptions all need to be handled, and the function will likely become much longer as the application develops.
  //For this reason, we are only calling it from the global effects list, and everybody else can go and check effectsData instead, where the result is stored.
  //effectsData only gets updated if the data has changed, to avoid infinite digest.
    effects = [];
    itemeffects = [];
    feateffects = [];
    //Start off with checking ALL equipped items and push their standardized effects into itemeffects.
    //All effects are stored as {type, target, value, source, penalty, (apply)}
    //Apply is decided later according to bonus types and if there is a higher bonus of the same type,
    // but if you set apply:false here, you can get an effect that is always listed as not applied (such as a skill penalty whose strength requirement has been met)
    angular.forEach ($filter('filter')($scope.items, {equip:true}), function(item) {
      //If an item has a simple instruction in effects, such as "Strength +2", split it into the affected target and the change (keeping the + or - in front),
      // then mark the effect as a penalty if the change is negative.
      angular.forEach (item.effects, function(effect) {
        split = effect.split(" ");
        itemeffects.push({type:'item', target:split[0], value:split[1], source:item.name, penalty:(parseInt(split[1]) < 0) ? true : false})
      });
      //If an item is a shield that is raised, add its item bonus to AC with a + in front. If you are also taking cover while the shield is raised, add that bonus as well.
      //Don't put the shield bonus into "effects"!
      if (item.type == "shield" && item.raised) {
        shieldbonus = item.itembonus;
        if (item.takecover) {
          shieldbonus += item.coverbonus;
        }
        itemeffects.push({type:'circumstance', target:"AC", value:"+"+shieldbonus, source:item.name, penalty:false})
      }
      //If an item is a weapon that is raised, add +1 to AC.
      if (item.type == "weapon" && item.raised) {
        itemeffects.push({type:'circumstance', target:"AC", value:"+1", source:item.name, penalty:false})
      }
      //Now the exceptions begin. If an item has a skillpenalty or a speedpenalty, check if Strength meets its strength requirement
      //- unless it doesn't have a strength requirement, like a tower shield. In that case, the penalty just applies. Always.
      Strength = $scope.abilities.byName("Strength").value();
      if (item.skillpenalty) {
        if (!item.strength || item.strength > Strength) {
        //You are not strong enough to act freely in this armor.
          //If the item has the Flexible trait, its penalty doesn't apply to Acrobatics and Athletics.
          //We push this as an apply:false effect to each so you can see that (and why) you were spared from it.
          //We also add a note to the source for clarity.
          if (app.haveTrait(item,"Flexible")) {
              itemeffects.push({type:'item', target:"Acrobatics", value:item.skillpenalty, source:item.name + " (Flexible)", penalty:true, apply:false});
              itemeffects.push({type:'item', target:"Athletics", value:item.skillpenalty, source:item.name + " (Flexible)", penalty:true, apply:false});
          } else {
              itemeffects.push({type:'item', target:"Acrobatics", value:item.skillpenalty, source:item.name, penalty:true});
              itemeffects.push({type:'item', target:"Athletics", value:item.skillpenalty, source:item.name, penalty:true});
          }
          //These two always apply unless you are strong enough.
          itemeffects.push({type:'item', target:"Stealth", value:item.skillpenalty, source:item.name, penalty:true});
          itemeffects.push({type:'item', target:"Thievery", value:item.skillpenalty, source:item.name, penalty:true});
        } else {
        //If you ARE strong enough, we push some not applying effects so you can feel good about that
          itemeffects.push({type:'item', target:"Acrobatics", value:item.skillpenalty, source:item.name + " (Strength)", penalty:true, apply:false});
          itemeffects.push({type:'item', target:"Athletics", value:item.skillpenalty, source:item.name + " (Strength)", penalty:true, apply:false});
          itemeffects.push({type:'item', target:"Thievery", value:item.skillpenalty, source:item.name + " (Strength)", penalty:true, apply:false});
          //UNLESS the item is also Noisy, in which case you do get the stealth penalty because you are dummy thicc and the clap of your ass cheeks keeps alerting the guards.
          if (app.haveTrait(item,"Noisy")) {
            itemeffects.push({type:'item', target:"Stealth", value:item.skillpenalty, source:item.name + " (Noisy)", penalty:true});
          } else {
            itemeffects.push({type:'item', target:"Stealth", value:item.skillpenalty, source:item.name + " (Strength)", penalty:true, apply:false});
          }
        }
      }
      if (item.speedpenalty) {
        if (!item.strength || item.strength > Strength) {
        //You are not strong enough to move unhindered in this armor. You get a speed penalty.
          itemeffects.push({type:'untyped', target:"Speed", value:item.speedpenalty, source:item.name, penalty:true});
        } else {
          if (parseInt(item.speedpenalty) < -5) {
          //You are strong enough, but if the armor is particularly heavy, your penalty is only lessened.
          //In this case we push both the avoided and the actual effect so you can feel at least a little good about yourself.
            itemeffects.push({type:'untyped', target:"Speed", value:(item.speedpenalty+5), source:item.name, penalty:true});
            itemeffects.push({type:'untyped', target:"Speed", value:item.speedpenalty, source:item.name + " (Strength)", penalty:true, apply:false});
          } else {
          //If you are strong enough and the armor only gave -5ft penalty, you get a fully avoided effect to gaze at.
            itemeffects.push({type:'untyped', target:"Speed", value:item.speedpenalty, source:item.name + " (Strength)", penalty:true, apply:false});
          }
        }
      }
    });
    //Feat effects are thankfully simple - so far. We check the "effects" property of every taken feat, split it up and push it as a new feateffect,
    // same as we did with items before the exceptions came.
    angular.forEach ($filter('filter')($scope.feat_db, {have:true}), function(feat) {
      angular.forEach (feat.effects, function(effect) {
        split = effect.split(" ");
        feateffects.push({type:'untyped', target:split[0], value:split[1], source:feat.name, penalty:(parseInt(split[1]) < 0) ? true : false})
      });
    });
    //Now we push itemeffects and feateffects into effects together.
    //Somehow, push.apply() gives us one array of objects, and push() gives us an array of two arrays of objects, so we use the former.
    effects.push.apply(effects,itemeffects);
    effects.push.apply(effects,feateffects);
    //The bonus types are hardcoded. If Paizo ever adds a new bonus type, this is where we need to change it.
    types = ["item", "circumstance", "status", "proficiency", "untyped"];
    //This is what we built the unique filter for. From all the effects, get every target only once, so we know all the targets and don't get duplicates from the upcoming loops.
    targets = $filter('unique')(effects, 'target').map(function(x){return x.target});
    //Now go over all the bonus types. If one target is affected by two bonuses of the same type, only the bigger one is applied. The same goes for penalties.
    angular.forEach(types, function($type) {
      if ($type == 'untyped') {
      //If a penalty is untyped, it always applies, unless we already marked it as apply:false. Only penalties can be untyped.
      //We actually see untyped bonuses in feats, so we apply them here, too.
        angular.forEach($filter('filter')(effects, {type:'untyped', apply:'!'+false}),function(effect){
          effect.apply = true;
        });
      } else {
      //For all bonus types except untyped, check all targets:
        angular.forEach(targets, function($target){
          //Get all the active effects for the target of the current bonus type
          bonuseffects = $filter('filter')(effects, {type:$type, target:$target, penalty:false, apply:'!'+false});
          if (bonuseffects.length > 0) {
          //If we have any bonuses for this target and this type, figure out which one is the largest and only get that one.
            maxvalue = Math.max.apply(Math, bonuseffects.map(function(x){return parseInt(x.value)}));
            //Then apply the first effect with that value, that target and that type. The actual effect may vary if two of the same bonuses exist, but it doesn't matter.
            $filter('filter')(bonuseffects, {value:maxvalue})[0].apply = true;
          }
          penaltyeffects = $filter('filter')(effects, {type:$type, target:$target, penalty:true, apply:'!'+false});
          //If we have any PENALTIES for this target and this type, we proceed as with bonuses, only we pick the lowest number (that is, the worst penalty).
          if (penaltyeffects.length > 0) {
            minvalue = Math.min.apply(Math, penaltyeffects.map(function(x){return parseInt(x.value)}));
            $filter('filter')(penaltyeffects, {value:minvalue})[0].apply = true;
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
  $scope.equipArmor = function(armor) {
    if (armor.equip == true) {
      angular.forEach($filter('filter')($scope.items, {type:armor.type}), function(item) {
        item.equip = false
      });
      armor.equip = true;
    }
  };
  $scope.itemget = function(item) {
    var newitem = {};
    angular.copy(item, newitem);
    newitem.id = Date.now();
    newitem.equip = true;
    if (newitem.type == "armor" || newitem.type == "shield") {$scope.equipArmor(newitem)};
    $scope.items.push(newitem);
  };
  $scope.itemdrop = function(item) {
    $scope.items.splice($scope.items.indexOf(item), 1)
    $scope.equipBasics();
  };
  $scope.equipBasics = function() {
    if ($filter('filter')($scope.items, {type:'armor', equip:true}).length == 0) {
      if ($filter('filter')($scope.items, {type:'armor'}).length == 0) {
        $scope.itemget($scope.item_db.byName("Unarmored"));
      }
      $scope.items.byName("Unarmored").equip = true;
      $scope.equipArmor($scope.items.byName("Unarmored"));
    }
    if ($filter('filter')($scope.items, {type:'weapon', equip:true}).length == 0) {
      if ($filter('filter')($scope.items, {type:'weapon'}).length == 0) {
        $scope.itemget($scope.item_db.byName("Fist")) 
      }
      $scope.items.byName("Fist").equip = true;
    }
  }
  $scope.generateLore = function(newLore) {
    newLoreName = "Lore: "+newLore+" Lore";
    if (newLore != "" && !$scope.skills.byName(newLoreName)) {
      $scope.skills.push({ name:newLoreName, level:0, ability:"Intelligence", note:'', effects:[], })
      angular.forEach($filter('filter')($scope.feat_db, {skillreq:"Lore",lorebase:'!'+true}), function(feat){
        skillreqs = feat.skillreq.split("|");
        angular.forEach(skillreqs, function(requirement) {
          if (requirement.split(",")[0] == "Lore") {
            feat.skillreq += "|"+newLoreName+","+requirement.split(",")[1];
          }
        });
      });
      angular.forEach($filter('filter')($scope.feat_db, {showon:"Lore",lorebase:'!'+true}), function(feat){
        feat.showon += ", "+newLoreName;
      });
      newFeats = [];
      angular.forEach($filter('filter')($scope.feat_db, {lorebase:true}), function(feat){
        newFeat = {};
        angular.copy(feat, newFeat);
        newFeat.name = newFeat.name.replace("Lore", newLoreName)
        newFeat.skillreq = (newFeat.skillreq) ? newFeat.skillreq.replace("Lore", newLoreName) : "";
        newFeat.featreq = (newFeat.featreq) ? newFeat.featreq.replace("Lore", newLoreName) : "";
        newFeat.showon = newFeat.showon.replace("Lore", newLoreName);
        newFeat.lorebase = false;
        newFeats.push(newFeat);
      });
      if (newFeats.length > 0) {
        $scope.feat_db.push.apply($scope.feat_db,newFeats);
      }
    }
  }
  $scope.removeLore = function(oldLore) {
    angular.forEach($filter('filter')($scope.feat_db, {skillreq:oldLore.name}), function(feat){
      skillreqs = feat.skillreq.split("|");
      angular.forEach(skillreqs, function(requirement) {
        if (requirement.split(",")[0] == oldLore.name) {
          feat.skillreq = feat.skillreq.replace("|"+oldLore.name+","+requirement.split(",")[1],"");
        }
      });
    });
    angular.forEach($filter('filter')($scope.feat_db, {showon:oldLore.name}), function(feat){
      feat.showon = feat.showon.replace(", "+oldLore.name,"");
    });
    angular.forEach($filter('filter')($scope.feat_db, {name:oldLore.name}), function(feat){
      $scope.feat_db.splice($scope.feat_db.indexOf(feat),1);
    });
    $scope.skills.splice($scope.skills.indexOf(oldLore),1);
  }
  $scope.initNotes($scope.skills);
  $scope.initNotes($scope.saves);
  $scope.equipBasics();
});