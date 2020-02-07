var app = angular.module('charApp', []);

app.config(function($compileProvider){
  $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|javascript):/);
});

//app functions

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

//filter
app.filter('halve', function($filter) {
//halves and rounds down the value - standard for Pathfinder
  return function(x) {
    return Math.floor((x)/2);
  };
});
app.filter('unique', function() {
//This filter was stolen and I don't fully understand all of its methods.
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
  //$scope.Level, $scope.Abilities, $scope.feat_db and $scope.Effects() must be passed
  return function(x, $level, $abilities, $feats, $effects) {
    effectBonus=0;
    x.effects.length = 0;
    //Add character level if the character is trained or better with the Skill
    var charLevel = ((x.level > 0) ? $level : ($feats.byName("Untrained Proficiency").have) && Math.floor($level/2));
    //Add the Ability modifier identified by the skill's ability property
    var abilityMod = $abilities.byName(x.ability).mod();
    //If any effect in $scope.Effects() has this skill as a target and is marked as applicable, add it to the effect bonus and list its value and source in the skill's own effects property
    //parseInt the effect's value in case it's a "+1" string
    angular.forEach ($filter('filter')($effects, {target:x.name,apply:true}), function(effect) {
        effectBonus += parseInt(effect.value);
        x.effects.push(effect.value + " (" + effect.source + ")");
    });
    //Add up all modifiers and the skill proficiency, parseInt the effect bonus just in case, then return the sum
    var skillResult = charLevel + x.level + abilityMod + parseInt(effectBonus);
    return skillResult;
  };
});

//controller
app.controller('charCtrl', function($scope,$filter) {
  $scope.level = 7;
  //The effective AC is called as a function and includes the worn armor and all raised shields and Parry weapons.
  $scope.AC = {name:'AC', value:function() {return $scope.AC.effectiveAC()}, effects:[] }
  //The actual abilities with all modifiers are called as a function, as well as the Ability modifier (which is calculated from the value).
  $scope.abilities = [
    { name:'Strength', basevalue:17, value:function() {return $scope.abilities.effectiveAbility(this)}, mod:function() { return $scope.abilities.mod(this) }, effects:[] },
    { name:'Dexterity', basevalue:13, value:function() {return $scope.abilities.effectiveAbility(this)}, mod:function() { return $scope.abilities.mod(this) }, effects:[] },
    { name:'Constitution', basevalue:14, value:function() {return $scope.abilities.effectiveAbility(this)}, mod:function() { return $scope.abilities.mod(this) }, effects:[] },
    { name:'Intelligence', basevalue:10, value:function() {return $scope.abilities.effectiveAbility(this)}, mod:function() { return $scope.abilities.mod(this) }, effects:[] },
    { name:'Wisdom', basevalue:13, value:function() {return $scope.abilities.effectiveAbility(this)}, mod:function() { return $scope.abilities.mod(this) }, effects:[] },
    { name:'Charisma', basevalue:9, value:function() {return $scope.abilities.effectiveAbility(this)}, mod:function() { return $scope.abilities.mod(this) }, effects:[] },
  ];
  //There is only one perception skill, but by making it an array we can apply the same calculations as with the other skills
  //All proficiencies are directly named as 0,2,4,6,8, which is their real modifier
  $scope.perception = [{ name:'Perception', level:2, ability:"Wisdom", note:'+2 initiative', effects:[],}];
  $scope.skills = [
    { name:'Acrobatics', level:0, ability:"Dexterity", note:'', effects:[], },
    { name:'Arcana', level:0, ability:"Intelligence", note:'', effects:[], },
    { name:'Athletics', level:4, ability:"Strength", note:'+2 jumping', effects:[], },
    { name:'Crafting', level:0, ability:"Intelligence", note:'', effects:[], },
    { name:'Deception', level:0, ability:"Charisma", note:'', effects:[], },
    { name:'Diplomacy', level:0, ability:"Charisma", note:'', effects:[], },
    { name:'Intimidation', level:0, ability:"Charisma", note:'', effects:[], },
    { name:'Lore', level:2, ability:"Intelligence", note:'', effects:[], },
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
    { name:'Simple', level:2  },
    { name:'Martial', level:4 },
    { name:'Unarmed', level:0 },
  ]
  $scope.armorProfs = [
    { name:'Light', level:4  },
    { name:'Medium', level:0 },
    { name:'Heavy', level:0 },
    { name:'Unarmored', level:4 },
  ]
  $scope.items = []
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
  //The feats list is still very basic
  $scope.feat_db = [
      { name:'Untrained Proficiency', desc:'use half your level for untrained skills', have:false},
      { name:'Will Mastery', showon:'Will', desc:'will save success will become critical success', have:true},
    ]
  $scope.effectsData = [];
    $scope.effectsTargets = [];

//scope functions
  $scope.initNotes = function(objects) {
    angular.forEach (objects, function (obj) {
      obj.showNotes = obj.note ? true : false;
    });
  };
  $scope.abilities.byName = function($name) {
    return $filter('filter')($scope.abilities, {name:$name})[0];
  };
  $scope.abilities.effectiveAbility = function(ability) {
    itembonus=0;
    ability.effects.length = 0;
    angular.forEach ($filter('filter')($scope.effectsData, {target:ability.name,apply:true}), function(effect) {
        itembonus += parseInt(effect.value);
        ability.effects.push(effect.value + " (" + effect.source + ")");
    });
    return parseInt(ability.basevalue) + parseInt(itembonus);
  };
  $scope.abilities.mod = function(ability) {
    return Math.floor((ability.value()-10)/2)
  }
  $scope.AC.effectiveAC = function() {
    var ac = 0;
    angular.forEach($filter('filter')($scope.items, {type:"armor",equip:true}), function(armor) {
      ac += $filter('charArmorDefense')(armor, $scope.level, $scope.abilities, $scope.armorProfs);
    });
    $scope.AC.effects.length = 0;
    angular.forEach ($filter('filter')($scope.effectsData, {target:"AC",apply:true}), function(effect) {
        ac += parseInt(effect.value);
        $scope.AC.effects.push(effect.value + " (" + effect.source + ")");
    });
    return ac;
  }
  $scope.skills.byName = function($name) {
    return $filter('filter')($scope.skills, {name:$name})[0];
  };
  $scope.saves.byName = function($name) {
    return $filter('filter')($scope.saves, {name:$name})[0];
  };
  $scope.feat_db.byName = function($name) {
    return $filter('filter')($scope.feat_db, {name:$name})[0];
  };
  $scope.weaponProfs.byName = function($name) {
    return $filter('filter')($scope.weaponProfs, {name:$name})[0];
  };
  $scope.armorProfs.byName = function($name) {
    return $filter('filter')($scope.armorProfs, {name:$name})[0];
  };
  $scope.items.byName = function($name) {
    return $filter('filter')($scope.items, {name:$name})[0];
  };
  $scope.item_db.byName = function($name) {
    return $filter('filter')($scope.item_db, {name:$name})[0];
  };
  $scope.trait_db.byName = function($name) {
    return $filter('filter')($scope.trait_db, {name:$name.split(" ")[0]})[0];
  };
  $scope.trait_db.have = function(trait) {
    itemsEquipped = $filter('filter')($scope.items, {equip:true})
    return itemsEquipped.some(function(item){return app.haveTrait(item,trait.name)}) && true;
  };
  $scope.effects = function() {
      effects = [];
      itemeffects = [];
      angular.forEach ($filter('filter')($scope.items, {equip:true}), function(item) {
        angular.forEach (item.effects, function(effect) {
          split = effect.split(" ");
          itemeffects.push({type:'item', target:split[0], value:split[1], source:item.name, penalty:(parseInt(split[1]) < 0) ? true : false})
        });
        if (item.type == "shield" && item.raised) {
          shieldbonus = item.itembonus;
          if (item.takecover) {
            shieldbonus += item.coverbonus;
          }
          itemeffects.push({type:'circumstance', target:"AC", value:"+"+shieldbonus, source:item.name, penalty:false})
        }
        if (item.type == "weapon" && item.raised) {
          itemeffects.push({type:'circumstance', target:"AC", value:"+1", source:item.name, penalty:false})
        }
        if (item.skillpenalty || item.speedpenalty) {
            Strength = $scope.abilities.byName("Strength").value();
            if (item.skillpenalty) {
                if (item.strength > Strength) {
                    if (app.haveTrait(item,"Flexible")) {
                        itemeffects.push({type:'item', target:"Acrobatics", value:item.skillpenalty, source:item.name + " (Flexible)", penalty:true, apply:false});
                        itemeffects.push({type:'item', target:"Athletics", value:item.skillpenalty, source:item.name + " (Flexible)", penalty:true, apply:false});
                    } else {
                        itemeffects.push({type:'item', target:"Acrobatics", value:item.skillpenalty, source:item.name, penalty:true});
                        itemeffects.push({type:'item', target:"Athletics", value:item.skillpenalty, source:item.name, penalty:true});
                    }
                    itemeffects.push({type:'item', target:"Stealth", value:item.skillpenalty, source:item.name, penalty:true});
                    itemeffects.push({type:'item', target:"Thievery", value:item.skillpenalty, source:item.name, penalty:true});
                } else {
                    itemeffects.push({type:'item', target:"Acrobatics", value:item.skillpenalty, source:item.name + " (Strength)", penalty:true, apply:false});
                    itemeffects.push({type:'item', target:"Athletics", value:item.skillpenalty, source:item.name + " (Strength)", penalty:true, apply:false});
                    if (app.haveTrait(item,"Noisy")) {
                      itemeffects.push({type:'item', target:"Stealth", value:item.skillpenalty, source:item.name + " (Noisy)", penalty:true});
                    } else {
                      itemeffects.push({type:'item', target:"Stealth", value:item.skillpenalty, source:item.name + " (Strength)", penalty:true, apply:false});
                    }
                    itemeffects.push({type:'item', target:"Thievery", value:item.skillpenalty, source:item.name + " (Strength)", penalty:true, apply:false});
                }
            }
            if (item.speedpenalty) {
                if (item.strength > Strength || item.type == "shield") {
                    itemeffects.push({type:'untyped', target:"Speed", value:item.speedpenalty, source:item.name, penalty:true});
                } else {
                  if (parseInt(item.speedpenalty) < -5) {
                    itemeffects.push({type:'untyped', target:"Speed", value:(item.speedpenalty+5), source:item.name, penalty:true});
                    itemeffects.push({type:'untyped', target:"Speed", value:item.speedpenalty, source:item.name + " (Strength)", penalty:true, apply:false});
                  } else {
                    itemeffects.push({type:'untyped', target:"Speed", value:item.speedpenalty, source:item.name + " (Strength)", penalty:true, apply:false});
                  }
                }
            }
        }
      });
      effects.push.apply(effects,itemeffects);
      types = $filter('unique')(itemeffects, 'type').map(function(x){return x.type});
      targets = $filter('unique')(itemeffects, 'target').map(function(x){return x.target});
      angular.forEach(types, function($type) {
        if ($type == 'untyped') {
          angular.forEach($filter('filter')(effects, {type:'untyped', apply:'!'+false}),function(effect){
            effect.apply = true;
          });
        } else {
          angular.forEach(targets, function($target){
            bonuses = $filter('filter')(effects, {type:$type, target:$target, penalty:false, apply:'!'+false});
            if (bonuses.length > 0) {
              maxvalue = Math.max.apply(Math, bonuses.map(function(x){return parseInt(x.value)}));
              $filter('filter')(bonuses, {value:maxvalue})[0].apply = true;
            }
            penalties = $filter('filter')(effects, {type:$type, target:$target, penalty:true, apply:'!'+false});
            if (penalties.length > 0) {
              minvalue = Math.min.apply(Math, penalties.map(function(x){return parseInt(x.value)}));
              $filter('filter')(penalties, {value:minvalue})[0].apply = true;
            }
          });
        }
      });
      if (angular.toJson($scope.effectsData) === angular.toJson(effects)) {
        return $scope.effectsData;
      } else {
        $scope.effectsData = effects;
        return $scope.effectsData;
      }
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
    Object.assign(newitem,item);
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
  $scope.initNotes($scope.skills);
  $scope.initNotes($scope.perception);
  $scope.initNotes($scope.saves);
  $scope.equipBasics();
});