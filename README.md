# Pathfinder Excessive Character Sheet (P.E.C.S.)

A character management tool for Pathfinder RPG 2e

PECS aims to help you keep track of every mechanical aspect of your characters - from classes and feats to inventory to the conditions you are currently under. Like every character sheet ever. But PECS goes an excessive amount of steps further: You will find that equipping a weapon gives you attacks, carrying too much loot makes you encumbered, and casting a spell not only uses up a spell slot, but also grants you its bonuses and penalties - you and your party members, should they accept them. And if you are like me and keep forgetting that this one feat gives you a bonus to that one skill under these very specific circumstances - PECS will be happy to remind you with its interconnected tagging system. You can probably even tick a box on the tag and see that bonus appear on your Athletics modifier for as long as you need to Wrestle that Titan™.

Prepare spells, gain conditions, Bless your comrades and take a battle stance. Or turn into a dinosaur and see your AC soar and your new Jaws attack get calculated with that bonus that you have on Unarmed Attacks. You can even roll your attack and damage with the press of a button (each). Or go into manual mode and gain complete control over your bonuses and penalties, spell slots and activity cooldowns. Want to use your Orc Ferocity in every battle? Now you can! (But it's cheating!)

You can create new items on the fly, or if you're the one running the server, you can add custom content of every kind - ancestries, classes, items, feats... start at src/assets/json and go from there!

PECS was gratefully created under the [Paizo Inc. Community Use Policy](https://paizo.com/community/communityuse) and the [Open Gaming License v1.0a](https://paizo.com/pathfinder/compatibility/ogl), and is neither endorsed nor recognized bz Paizo. It is completely free.

# Working demo [HERE](http://bukiro.github.io/PECS-Demo)

# Hosting

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 11.1.4. It is intended for you and your group of players and will probably not scale well to a public website. You can host the server for your group, or everyone can run their own. If you want to cast spells on your party members or look at their character sheets, each server needs to connect to the same database.

Before you can run the app, you need to provide a config.json with your database connector URL in src/. See `src/config.json.example` for an example and `Database.md` for details.

Run `ng serve` for a dev server, navigate to `http://localhost:4200` and never bother to go productive. Alternatively, run `ng build` to build the project, with the `--prod` flag for a production build. CAUTION: Definitely use `--optimization=false` and configure your initial budget with `"maximumError": "15mb"` in angular.json. PECS is a very complex piece of code and does not take kindly to minification.

A modern computer or tablet should have no issues running PECS in a browser, but mind that it requires some processing power and has a lot of on-screen content, so the mobile version is to be enjoyed on a provisionary basis. PECS looks best in the Edge browser.

# Database

If you want to keep your characters, you need a database. The demo uses a mongodb database, but you can probably make it work with another product, as long as you have a connector URL that handles the necessary queries. See `Database.md` for details, or just go ahead and use [my PECS-MongoDB connector](https://github.com/bukiro/PECS-MongoDB-Connector).

# Integration with Foundry VTT

You can send your dice rolls from PECS straight to your Foundry VTT session, provided you have both open in the same browser - and the FVTT server has the [External Dice Roll Connector module](https://github.com/bukiro/external-dice-roll-connector) installed.

# State of development

I generally avoid content from the Advanced Character Guide for now, while there is still core content to do.

You can build characters from level 1 through 20, with the following classes and ancestries fully implemented:

- [ ] Alchemist (feats and mechanics missing)
- [x] Barbarian
- [x] Bard
- [ ] Champion (feats missing)
- [ ] Cleric (domain spells missing)
- [x] Druid
- [x] Fighter
- [x] Monk
- [x] Ranger
- [x] Rogue
- [x] Sorcerer
- [x] Wizard
- [x] Dwarf
- [x] Elf
- [ ] Gnome (feats missing)
- [x] Goblin
- [x] Halfling
- [x] Human
- [x] Half-Orc
- [ ] Hobgoblin (feats missing)
- [ ] Leshy (feats missing)
- [x] Lizardfolk
- [ ] Shoony

Basic equipment items are implemented, as well as weapon, shield and armor materials. Magic items and consumables are finished as follows:

- [ ] Weapons
- [ ] Armors
- [ ] Shields
- [ ] Worn Items
- [ ] Held Items
- [x] Alchemical Bombs and Consumable Bombs
- [x] Potions
- [x] Alchemical Elixirs
- [x] Alchemical Tools
- [x] Oils
- [x] Scrolls
- [ ] Talismans
- [ ] Ammunition
- [x] Adventuring Gear
- [x] Materials
- [x] Runes

Spells are implemented up to and including `5th level`.