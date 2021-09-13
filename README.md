# Pathfinder Excessive Character Sheet (P.E.C.S.)

A character management tool for Pathfinder RPG 2e

PECS aims to help you keep track of every mechanical aspect of your characters - from classes and feats to inventory to the conditions you are currently under. Like every character sheet ever. But PECS goes an excessive amount of steps further: You will find that equipping a weapon gives you attacks, carrying too much loot makes you encumbered, and casting a spell not only uses up a spell slot, but also grants you its bonuses and penalties - you and your party members, should they accept them. And if you are like me and keep forgetting that this one feat gives you a bonus to that one skill under these very specific circumstances - PECS will be happy to remind you with its interconnected tagging system. You can probably even tick a box on the tag and see that bonus appear on your Athletics modifier for as long as you need to Wrestle that Titan™.

Prepare spells, gain conditions, Bless your comrades and take a battle stance. Or turn into a dinosaur and see your AC soar and your new Jaws attack get calculated with that bonus that you have on Unarmed Attacks. You can even roll your attack and damage with the press of a button (each). Or go into manual mode and gain complete control over your bonuses and penalties, spell slots and activity cooldowns. Want to use your Orc Ferocity in every battle? Now you can! (But it's cheating!)

You can create new items on the fly, or if you're the one running the server, you can add custom content of every kind - ancestries, classes, items, feats... start at src/assets/json and go from there!

PECS was gratefully created under the [Paizo Inc. Community Use Policy](https://paizo.com/community/communityuse) and the [Open Gaming License v1.0a](https://paizo.com/pathfinder/compatibility/ogl), and is neither endorsed nor recognized bz Paizo. It is completely free.

A modern computer or tablet should have no issues running PECS in a browser and is largely responsive for mobile. PECS looks best in the Edge browser and has some issues in Safari.

PECS is not a public website, but is intended to be hosted by you for yourself and your group of players.

# Working demo [HERE](http://bukiro.github.io/PECS-Demo)

# Running PECS

The simple way is to download the latest [release](https://github.com/bukiro/PECS/releases/latest), unpack it and just run pecs.exe or pecs on Windows or Linux. This will start an HTTP server that people can visit in their browser. If you have SSL certificate files, you can run the server in HTTPS as well. You can optionally protect your instance with a password.

Remember to open and/or forward your firewall ports. If everyone is running their own instance, and you want to cast spells on your party members or look at their character sheets, you also need to run a MongoDB database, and each instance needs to be configured to connect to that same database using the config.json file.

# Running PECS in Node.js

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 11.1.4. If you run it in Node.js directly for some reason, it does not serve a database for your characters or an effect exchange service for play. In that case, you need to configure a database connection in `src/assets/config.json` in order to save characters and exchange effects (see `src/assets/config.json.example` for an example). The database connection needs to be able to handle certain web queries - see `Database.md` for details, or just go ahead and use [my PECS Data Service](https://github.com/bukiro/PECS-Data-Service). The service is available as a Windows and Linux executable. PECS 1.0.10 requires at least version 1.0.4 of the service.

With the releases available, you only need to run PECS in Node.js if you want to test development or don't trust my executables. The executables were compiled with [nexe](https://github.com/nexe/nexe) from the .js file in the same package.

Install PECS with git and Node.js:

```
git clone https://github.com/bukiro/PECS
npm install
```

Run `ng serve` for a dev server, navigate to `http://localhost:4200` and never bother to go productive. Alternatively, run `ng build --prod --optimization=false` flag for a production build. CAUTION: You MUST use `--optimization=false`. PECS is a very complex piece of code and does not take kindly to minification.

# Integration with Foundry VTT

You can send your dice rolls from PECS straight to your Foundry VTT session, provided you have both open in the same browser - and the FVTT server has the [External Dice Roll Connector module](https://github.com/bukiro/external-dice-roll-connector) installed. Enter the URL of your FVTT session in the PECS settings (in-app), and you can choose whether the dice are rolled in PECS first or directly in Foundry.

# Custom Content

You can place any custom content in JSON format in the appropriate folder in /src/assets/json, and let the app know that there is content to load by also placing an extensions.json file in the same folder. The extensions.json file should have the following format, and only files listed here are used in the app. If you are updating or expanding existing content, you should use the "overridePriority" attribute in each conflicting new object - objects with a higher value override those with a lower value.

```
[
    {
        "name": "my_campaign",
        "filename": "custom_my_campaign.json"
    }
]
```

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

Non-magic equipment items are fully implemented, as well as weapon, shield and armor materials. Magic items and consumables are finished as follows:

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

# Contributing

If you'd like to contribute missing content, feel free to take a look at the files in `/src/assets/json`, and if you really want to deal with THAT, [drop me a line](mailto:pecs-dev@outlook.com)! If you don't have the time or the nerve, but really want me to feel good about my work, I am of course happy to take donations on [ko-fi](https://ko-fi.com/bukiro) and [patreon](https://patreon.com/bukiro).