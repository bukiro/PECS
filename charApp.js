var app = angular.module('charApp', []);

app.config(function($compileProvider){
  $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|file|javascript):/);
});

//app functions
app.haveTrait = function($obj, $trait) {
    return $obj.traits.findIndex(function (element) {
      return element.indexOf($trait) === 0;
    }) >= 0;
}

//filter
app.filter('halve', function($filter) {
  return function(x) {
    return Math.floor((x)/2);
  };
});
app.filter('charAttack', function($filter) {
  return function(x, $level, $abilities, $weaponProfs, $range) {
    var charLevel = (((x.level > 0) || ($weaponProfs.byName(x.prof).level > 0)) && $level);
    var profLevel = Math.max(x.level, $weaponProfs.byName(x.prof).level);
    var str = $abilities.byName("Strength").mod();
    var dex = $abilities.byName("Dexterity").mod();
    var abilityMod = (($range == "Ranged" && (!app.haveTrait(x, "Brutal"))) || ((app.haveTrait(x, "Finesse") && dex > str))) ? dex : str;
    var attackResult = charLevel + profLevel + x.itembonus + abilityMod;
    return attackResult;
  };
});
app.filter('charDefense', function($filter) {
    return function(x, $level, $abilities, $armorProfs) {
      var charLevel = (((x.level > 0) || ($armorProfs.byName(x.prof).level > 0)) && $level);
      var profLevel = Math.max(x.level, $armorProfs.byName(x.prof).level);
      var dex = $abilities.byName("Dexterity").mod();
      var dexBonus = Math.min(dex, x.dexcap)
      var defenseResult = 10 + charLevel + profLevel + dexBonus + x.itembonus;
      return defenseResult;
    };
  });
app.filter('charWeaponDamage', function($filter) {
  return function(x, $abilities, $range) {
    var baseDice = x.dicenum + "d" + x.dicesize;
    var abilityDmg = "";
    var str = $abilities.byName('Strength').mod();
    switch ( $range ) {
      case 'Melee':
        abilityDmg = " + " + str;
        break;
      case 'Ranged':
        abilityDmg = (app.haveTrait(x,"Thrown")) ? " + " + $abilities.byName('Strength').mod() : (app.haveTrait(x,"Propulsive")) ? " + " + ((str >= 0) ? Math.floor(str / 2) : str) : "";
        break;
    }
    var dmgResult = baseDice + abilityDmg;
    return dmgResult;
  };
});
app.filter('charSkill', function($filter) {
  return function(x, $level, $abilities, $feats, $effects) {
    var charLevel = ((x.level > 0) ? $level : ($feats.byName("Untrained Proficiency").have) && Math.floor($level/2));
    var abilityMod = $abilities.byName(x.ability).mod();
    itembonus=0;
    x.effects.length = 0;
    angular.forEach ($filter('filter')($effects, {target:x.name}), function(effect) {
        itembonus += parseInt(effect.value, 10);
        x.effects.push(effect.value + " (" + effect.source + ")");
    });
    var skillResult = charLevel + x.level + abilityMod + parseInt(itembonus,10);
    return skillResult;
  };
});

//controller
app.controller('charCtrl', function($scope,$filter) {
  $scope.level = 7;


  $scope.abilities = [
    { name:'Strength', basevalue:17, value:function() {return $scope.abilities.effectiveAbility(this)}, mod:function() { return $scope.abilities.mod(this) }, effects:[] },
    { name:'Dexterity', basevalue:13, value:function() {return $scope.abilities.effectiveAbility(this)}, mod:function() { return $scope.abilities.mod(this) }, effects:[] },
    { name:'Constitution', basevalue:14, value:function() {return $scope.abilities.effectiveAbility(this)}, mod:function() { return $scope.abilities.mod(this) }, effects:[] },
    { name:'Intelligence', basevalue:10, value:function() {return $scope.abilities.effectiveAbility(this)}, mod:function() { return $scope.abilities.mod(this) }, effects:[] },
    { name:'Wisdom', basevalue:13, value:function() {return $scope.abilities.effectiveAbility(this)}, mod:function() { return $scope.abilities.mod(this) }, effects:[] },
    { name:'Charisma', basevalue:9, value:function() {return $scope.abilities.effectiveAbility(this)}, mod:function() { return $scope.abilities.mod(this) }, effects:[] },
  ];
  $scope.perception = [{ name:'Perception', level:2, ability:"Wisdom", note:'+2 initiative', effects:[],}];
  $scope.skills = [
    { name:'Acrobatics', level:0, ability:"Dexterity", note:'', effects:[], },
    { name:'Athletics', level:4, ability:"Strength", note:'+2 jumping', effects:[],},
    { name:'Alcohol Lore', level:2, ability:"Intelligence", note:'', effects:[],},
    { name:'Cartography Lore', level:2, ability:"Intelligence", note:'', effects:[],},
    { name:'Stealth', level:2, ability:"Dexterity", note:'', effects:[],},
  ];
  $scope.saves = [
    { name:'Fortitude', level:2, ability:"Constitution", note:'', effects:[], },
    { name:'Reflex', level:6, ability:"Dexterity", note:'', effects:[], },
    { name:'Will', level:4, ability:"Wisdom", note:'+2 vs enchantment', effects:[], },
  ];
  $scope.feats = [
    { name:'Untrained Proficiency', desc:'use half your level for untrained skills', have:false},
    { name:'Will Mastery', showon:'Will', desc:'will save success will become critical success', have:true},
  ]
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
  $scope.items = [
  ]
  $scope.item_db = [
    { type:'weapon', name:'dagger', equip:true, level:0, prof:'Simple', dicenum:1, dicesize:4, melee:5, itembonus:0, thrown:10, traits:["Thrown 10ft", "Agile", "Finesse"] },
    { type:'weapon', name:'+1 short sword of Strength', equip:true, level:0, prof:'Martial', dicenum:1, dicesize:6, melee:5, itembonus:1, traits:[], effects:["Strength +10"], },
    { type:'weapon', name:"longbow of Dexterity", equip:true, level:0, prof:'Martial', dicenum:1, dicesize:8, ranged:30, itembonus:0, traits:["Volley 30ft"], effects:["Dexterity +10"], },
    { type:'armor', name:'unarmored', equip:true, level:0, prof:'Unarmored', itembonus:0, dexcap:5, traits:[], },
    { type:'armor', name:'leather armor', equip:true, level:0, prof:'Light', itembonus:1, dexcap:4, skillpenalty:-1, speedpenalty:-5, Strength:10, traits:[], },
    { type:'armor', name:'chain mail', equip:true, level:0, prof:'Medium', itembonus:4, dexcap:1, skillpenalty:-2, speedpenalty:-5, Strength:16, traits:["Flexible", "Noisy"], },
    { type:'armor', name:'full plate', equip:true, level:0, prof:'Medium', itembonus:6, dexcap:0, skillpenalty:-3, speedpenalty:-10, Strength:18, traits:["Bulwark"], },
    { type:'weapon', name:'composite longbow', equip:true, level:0, prof:'Martial', dicenum:1, dicesize:8, ranged:30, itembonus:0, propulsive:1, traits:["Propulsive", "Deadly d10", "Volley 30ft"], },
  ]
  $scope.traits = [
    { name:'Agile', showon:'', desc:'The multiple attack penalty you take with this weapon on the second attack on your turn is -4 instead of -5, and -8 instead of -10 on the third and subsequent attacks in the turn.', have:function() { return $scope.traits.have(this) }, },
    { name:'Attached', showon:'', desc:'An attached weapon must be combined with another piece of gear to be used. The trait lists what type of item the weapon must be attached to. You must be wielding or wearing the item the weapon is attached to in order to attack with it. For example, shield spikes are attached to a shield, allowing you to attack with the spikes instead of a shield bash, but only if you\'re wielding the shield. An attached weapon is usually bolted onto or built into the item it\'s attached to, and typically an item can have only one weapon attached to it. An attached weapon can be affixed to an item with 10 minutes of work and a successful DC 10 Crafting check; this includes the time needed to remove the weapon from a previous item, if necessary. If an item is destroyed, its attached weapon can usually be salvaged.', have:function() { return $scope.traits.have(this) }, },
    { name:'Backstabber', showon:'', desc:'When you hit a flat-footed creature, this weapon deals 1 precision damage in addition to its normal damage. The precision damage increases to 2 if the weapon is a +3 weapon.', have:function() { return $scope.traits.have(this) }, },
    { name:'Backswing', showon:'', desc:'You can use the momentum from a missed attack with this weapon to lead into your next attack. After missing with this weapon on your turn, you gain a +1 circumstance bonus to your next attack with this weapon before the end of your turn.', have:function() { return $scope.traits.have(this) }, },
    { name:'Brutal', showon:'', desc:'A ranged attack with this trait uses its Strength modifier instead of Dexterity on the attack roll.', have:function() { return $scope.traits.have(this) }, },
    { name:'Deadly', showon:'', desc:'On a critical hit, the weapon adds a weapon damage die of the listed size. Roll this after doubling the weapon\'s damage. This increases to two dice if the weapon has a greater striking rune and three dice if the weapon has a major striking rune. For instance, a rapier with a greater striking rune deals 2d8 extra piercing damage on a critical hit. An ability that changes the size of the weapon\'s normal damage dice doesn\'t change the size of its deadly die.', have:function() { return $scope.traits.have(this) }, },
    { name:'Disarm', showon:'', desc:'You can use this weapon to Disarm with the Athletics skill even if you don\'t have a free hand. This uses the weapon\'s reach (if different from your own) and adds the weapon\'s item bonus to attack rolls (if any) as an item bonus to the Athletics check. If you critically fail a check to Disarm using the weapon, you can drop the weapon to take the effects of a failure instead of a critical failure. On a critical success, you still need a free hand if you want to take the item.', have:function() { return $scope.traits.have(this) }, },
    { name:'Dwarf', showon:'', desc:'A creature with this trait is a member of the dwarf ancestry. Dwarves are stout folk who often live underground and typically have darkvision. An ability with this trait can be used or selected only by dwarves. An item with this trait is created and used by dwarves.', have:function() { return $scope.traits.have(this) }, },
    { name:'Elf', showon:'', desc:'A creature with this trait is a member of the elf ancestry. Elves are mysterious people with rich traditions of magic and scholarship who typically have low-light vision. An ability with this trait can be used or selected only by elves. A weapon with this trait is created and used by elves.', have:function() { return $scope.traits.have(this) }, },
    { name:'Fatal', showon:'', desc:'The fatal trait includes a die size. On a critical hit, the weapon\'s damage die increases to that die size instead of the normal die size, and the weapon adds one additional damage die of the listed size.', have:function() { return $scope.traits.have(this) }, },
    { name:'Finesse', showon:'', desc:'You can use your Dexterity modifier instead of your Strength modifier on attack rolls using this melee weapon. You still use your Strength modifier when calculating damage.', have:function() { return $scope.traits.have(this) }, },
    { name:'Forceful', showon:'', desc:'This weapon becomes more dangerous as you build momentum. When you attack with it more than once on your turn, the second attack gains a circumstance bonus to damage equal to the number of weapon damage dice, and each subsequent attack gains a circumstance bonus to damage equal to double the number of weapon damage dice.', have:function() { return $scope.traits.have(this) }, },
    { name:'Free-Hand', showon:'', desc:'This weapon doesn\'t take up your hand, usually because it is built into your armor. A free-hand weapon can\'t be Disarmed. You can use the hand covered by your free-hand weapon to wield other items, perform manipulate actions, and so on. You can\'t attack with a free-hand weapon if you\'re wielding anything in that hand or otherwise using that hand. When you\'re not wielding anything and not otherwise using the hand, you can use abilities that require you to have a hand free as well as those that require you to be wielding a weapon in that hand. Each of your hands can have only one free-hand weapon on it.', have:function() { return $scope.traits.have(this) }, },
    { name:'Gnome', showon:'', desc:'A creature with this trait is a member of the gnome ancestry. Gnomes are small people skilled at magic who seek out new experiences and usually have low-light vision. An ability with this trait can be used or selected only by gnomes. A weapon with this trait is created and used by gnomes.', have:function() { return $scope.traits.have(this) }, },
    { name:'Goblin', showon:'', desc:'A creature with this trait can come from multiple tribes of creatures, including goblins, hobgoblins, and bugbears. Goblins tend to have darkvision. An ability with this trait can be used or chosen only by goblins. A weapon with this trait is created and used by goblins.', have:function() { return $scope.traits.have(this) }, },
    { name:'Grapple', showon:'Athletics', desc:'You can use this weapon to Grapple with the Athletics skill even if you don\'t have a free hand. This uses the weapon\'s reach (if different from your own) and adds the weapon\'s item bonus to attack rolls as an item bonus to the Athletics check. If you critically fail a check to Grapple using the weapon, you can drop the weapon to take the effects of a failure instead of a critical failure.', have:function() { return $scope.traits.have(this) }, },
    { name:'Halfling', showon:'', desc:'A creature with this trait is a member of the halfling ancestry. These small people are friendly wanderers considered to be lucky. An ability with this trait can be used or selected only by halflings. A weapon with this trait is created and used by halflings.', have:function() { return $scope.traits.have(this) }, },
    { name:'Jousting', showon:'', desc:'The weapon is suited for mounted combat with a harness or similar means. When mounted, if you moved at least 10 feet on the action before your attack, add a circumstance bonus to damage for that attack equal to the number of damage dice for the weapon. In addition, while mounted, you can wield the weapon in one hand, changing the damage die to the listed value.', have:function() { return $scope.traits.have(this) }, },
    { name:'Monk', showon:'', desc:'Many monks learn to use these weapons.', have:function() { return $scope.traits.have(this) }, },
    { name:'Nonlethal', showon:'', desc:'Attacks with this weapon are nonlethal, and are used to knock creatures unconscious instead of kill them. You can use a nonlethal weapon to make a lethal attack with a -2 circumstance penalty.', have:function() { return $scope.traits.have(this) }, },
    { name:'Orc', showon:'', desc:'Orcs craft and use these weapons.', have:function() { return $scope.traits.have(this) }, },
    { name:'Parry', showon:'', desc:'This weapon can be used defensively to block attacks. While wielding this weapon, if your proficiency with it is trained or better, you can spend an Interact action to position your weapon defensively, gaining a +1 circumstance bonus to AC until the start of your next turn.', have:function() { return $scope.traits.have(this) }, },
    { name:'Propulsive', showon:'', desc:'You add half your Strength modifier (if positive) to damage rolls with a propulsive ranged weapon. If you have a negative Strength modifier, you add your full Strength modifier instead.', have:function() { return $scope.traits.have(this) }, },
    { name:'Range', showon:'', desc:'These attacks will either list a finite range or a range increment, which follows the normal rules for range increments.', have:function() { return $scope.traits.have(this) }, },
    { name:'Ranged Trip', showon:'Athletics', desc:'This weapon can be used to Trip with the Athletics skill at a distance up to the weapon\'s first range increment. The skill check takes a -2 circumstance penalty. You can add the weapon\'s item bonus to attack rolls as a bonus to the check. As with using a melee weapon to trip, a ranged trip doesn\'t deal any damage when used to Trip. This trait usually only appears on a thrown weapon.', have:function() { return $scope.traits.have(this) }, },
    { name:'Reach', showon:'', desc:'Natural attacks with this trait can be used to attack creatures up to the listed distance away instead of only adjacent creatures. Weapons with this trait are long and can be used to attack creatures up to 10 feet away instead of only adjacent creatures. For creatures that already have reach with the limb or limbs that wield the weapon, the weapon increases their reach by 5 feet.', have:function() { return $scope.traits.have(this) }, },
    { name:'Shove', showon:'Athletics', desc:'You can use this weapon to Shove with the Athletics skill even if you don\'t have a free hand. This uses the weapon\'s reach (if different from your own) and adds the weapon\'s item bonus to attack rolls as an item bonus to the Athletics check. If you critically fail a check to Shove using the weapon, you can drop the weapon to take the effects of a failure instead of a critical failure.', have:function() { return $scope.traits.have(this) }, },
    { name:'Sweep', showon:'Athletics', desc:'This weapon makes wide sweeping or spinning attacks, making it easier to attack multiple enemies. When you attack with this weapon, you gain a +1 circumstance bonus to your attack roll if you already attempted to attack a different target this turn using this weapon.', have:function() { return $scope.traits.have(this) }, },
    { name:'Tethered', showon:'', desc:'This weapon is attached to a length of rope or chain that allows you to retrieve it after it has left your hand. If you have a free hand while wielding this weapon, you can use an Interact action to pull the weapon back into your grasp after you have thrown it as a ranged attack or after it has been disarmed (unless it is being held by another creature).', have:function() { return $scope.traits.have(this) }, },
    { name:'Thrown', showon:'', desc:'You can throw this weapon as a ranged attack, and it is a ranged weapon when thrown. A thrown weapon adds your Strength modifier to damage just like a melee weapon does. When this trait appears on a melee weapon, it also includes the range increment. Ranged weapons with this trait use the range increment specified in the weapon\'s Range entry.', have:function() { return $scope.traits.have(this) }, },
    { name:'Trip', showon:'Athletics', desc:'You can use this weapon to Trip with the Athletics skill even if you don\'t have a free hand. This uses the weapon\'s reach (if different from your own) and adds the weapon\'s item bonus to attack rolls as an item bonus to the Athletics check. If you critically fail a check to Trip using the weapon, you can drop the weapon to take the effects of a failure instead of a critical failure.', have:function() { return $scope.traits.have(this) }, },
    { name:'Twin', showon:'', desc:'These weapons are used as a pair, complementing each other. When you attack with a twin weapon, you add a circumstance bonus to the damage roll equal to the weapon\'s number of damage dice if you have previously attacked with a different weapon of the same type this turn. The weapons must be of the same type to benefit from this trait, but they don\'t need to have the same runes.', have:function() { return $scope.traits.have(this) }, },
    { name:'Two-Hand', showon:'', desc:'This weapon can be wielded with two hands. Doing so changes its weapon damage die to the indicated value. This change applies to all the weapon\'s damage dice, such as those from striking runes.', have:function() { return $scope.traits.have(this) }, },
    { name:'Unarmed', showon:'', desc:'An unarmed attack uses your body rather than a manufactured weapon. An unarmed attack isn\'t a weapon, though it\'s categorized with weapons for weapon groups, and it might have weapon traits. Since it\'s part of your body, an unarmed attack can\'t be Disarmed. It also doesn\'t take up a hand, though a fist or other grasping appendage follows the same rules as a free-hand weapon.', have:function() { return $scope.traits.have(this) }, },
    { name:'Versatile', showon:'', desc:'A versatile weapon can be used to deal a different type of damage than that listed in the Damage entry. This trait indicates the alternate damage type. For instance, a piercing weapon that is versatile S can be used to deal piercing or slashing damage. You choose the damage type each time you make an attack.', have:function() { return $scope.traits.have(this) }, },
    { name:'Volley', showon:'', desc:'This ranged weapon is less effective at close distances. Your attacks against targets that are at a distance within the range listed take a -2 penalty.', have:function() { return $scope.traits.have(this) }, },
    { name:'Bulwark', showon:'Reflex', desc:'The armor covers you so completely that it provides benefits against some damaging effects. On Reflex saves to avoid a damaging effect, such as a fireball, you add a +3 modifier instead of your Dexterity modifier.', have:function() { return $scope.traits.have(this) }, },
    { name:'Comfort', showon:'', desc:'The armor is so comfortable that you can rest normally while wearing it.', have:function() { return $scope.traits.have(this) }, },
    { name:'Flexible', showon:'', desc:'The armor is flexible enough that it doesn\'t hinder most actions. You don\'t apply its check penalty to Acrobatics or Athletics checks.', have:function() { return $scope.traits.have(this) }, },
    { name:'Noisy', showon:'', desc:'This armor is loud and likely to alert others to your presence. The armor\'s check penalty applies to Stealth checks even if you meet the required Strength score.', have:function() { return $scope.traits.have(this) }, },  ]
  $scope.effectsData = [];

  $scope.count = 0;
  $scope.myFunc = function(armor) {
      $scope.count++;
      for (var i = 0; i < $scope.items.length; i++) {
        if ($scope.items.length > 0 && $scope.items[i].type == 'armor') {
          $scope.items.splice(i, 1);
          i--;
        }
      }
      armor.id = Date().now;
      $scope.items.push(armor);
  };

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
    angular.forEach ($filter('filter')($scope.effectsData, {target:ability.name}), function(effect) {
        itembonus += parseInt(effect.value, 10);
        ability.effects.push(effect.value + " (" + effect.source + ")");
    });
    return parseInt(ability.basevalue,10) + parseInt(itembonus,10);
  };
  $scope.abilities.mod = function(ability) {
    return Math.floor((ability.value()-10)/2)
  }
  $scope.skills.byName = function($name) {
    return $filter('filter')($scope.skills, {name:$name})[0];
  };
  $scope.saves.byName = function($name) {
    return $filter('filter')($scope.saves, {name:$name})[0];
  };
  $scope.feats.byName = function($name) {
    return $filter('filter')($scope.feats, {name:$name})[0];
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
  $scope.traits.byName = function($name) {
    return $filter('filter')($scope.traits, {name:$name.split(" ")[0]})[0];
  };
  $scope.traits.have = function(trait) {
    itemsEquipped = $filter('filter')($scope.items, {equip:true})
    return itemsEquipped.some(function(item){return app.haveTrait(item,trait.name)}) && true;
  };
  $scope.effects = function() {
      itemeffects = [];
      angular.forEach ($filter('filter')($scope.items, {equip:true}), function(item) {
        angular.forEach (item.effects, function(effect) {
          split = effect.split(" ");
          itemeffects.push({target:split[0], value:split[1], source:item.name})
        });
        if (item.skillpenalty || item.speedpenalty) {
            Strength = $scope.abilities.byName("Strength").value();
            if (item.skillpenalty) {
                if (item.Strength > Strength) {
                    if (app.haveTrait(item,"Flexible")) {
                        itemeffects.push({target:"Acrobatics", value:"-0", source:item.name + " (Flexible)"});
                        itemeffects.push({target:"Athletics", value:"-0", source:item.name + " (Flexible)"});
                    } else {
                        itemeffects.push({target:"Acrobatics", value:item.skillpenalty, source:item.name});
                        itemeffects.push({target:"Athletics", value:item.skillpenalty, source:item.name});
                    }
                    itemeffects.push({target:"Stealth", value:item.skillpenalty, source:item.name});
                    itemeffects.push({target:"Thievery", value:item.skillpenalty, source:item.name});
                } else {
                    if (app.haveTrait(item,"Noisy")) {
                        itemeffects.push({target:"Stealth", value:item.skillpenalty, source:item.name + " (Noisy)"});
                    }
                }
            }
            if (item.speedpenalty) {
                if (item.Strength > Strength) {
                    itemeffects.push({target:"Speed", value:item.speedpenalty, source:item.name});
                }
            }
        }
      });
      effects = itemeffects;
      if ($scope.effectsData.toString() === effects.toString()) {
        return $scope.effectsData;
      } else {
        $scope.effectsData = effects;
        return $scope.effectsData;
      }
  };
  $scope.equipArmor = function(armor) {
    for (var i = 0; i < $scope.items.length; i++) {
      if ($scope.items.length > 0 && $scope.items[i].type == 'armor') {
        $scope.items.splice(i, 1);
        i--;
      }
    }
    armor.id = Date.now();
    $scope.items.push(armor);
  };
  $scope.equipWeapon = function(weapon) {
    weapon.id = Date.now();
    $scope.items.push(weapon);
  };
  $scope.unequip = function(item) {
    for (var i = 0; i < $scope.items.length; i++) {
      if ($scope.items[i].id == item.id) {
        $scope.items.splice(i, 1);
        i--;
      }
    }
  };
  $scope.initNotes($scope.skills);
  $scope.initNotes($scope.perception);
  $scope.initNotes($scope.saves);
});