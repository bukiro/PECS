# Pathfinder Excessive Character Sheet (P.E.C.S.)

A character management tool for Pathfinder RPG 2e

PECS is, at its heart, a character sheet. It aims to help you keep track of every mechanical aspect of your characters - from classes and feats to inventory to the conditions you are currently under. Like every character sheet ever. But PECS goes an excessive amount of steps further: You will find that equipping a weapon gives you attacks, carrying too much loot makes you encumbered, and casting a spell not only uses up a spell slot, but also grants you its bonuses and penalties - you and your party members, should they accept them. And if you are like the author and keep forgetting that this one feat gives you a bonus to that one skill under these very specific circumstances - PECS will be happy to remind you with its interconnected tagging system. You can probably even tick a box and see that bonus appear on your Athletics modifier for as long as you need to Wrestle that Titan™.

Prepare spells, gain conditions, Bless your comrades and take a battle stance. Or turn into a dinosaur and see your AC soar and your new Jaws attack get calculated with that bonus that you have on Unarmed Attacks. You can even roll your attack and damage with the press of a button (each). Or go into manual mode and gain complete control over your bonuses and penalties, spell slots and activity cooldowns. Want to use your Orc Ferocity in every battle? Now you can! (But it's cheating!)

You can create new items on the fly, or if you're the one running the server, you can add custom content of every kind - ancestries, classes, items, feats... start at src/assets/json and go from there!

PECS was gratefully created under the [Paizo Inc. Community Use Policy](https://paizo.com/community/communityuse) and the Open Gaming License v1.0a, and is neither endorsed nor recognized bz Paizo. It is completely free.

# Working demo [HERE](http://bukiro.github.io/PECS-Demo)

# Hosting

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 11.1.4. It is intended for you and your group of players and will probably not scale well. You can host the server for your group, or everyone can run their own. If you want to cast spells on your party members or look at their character sheets, each server needs to connect to the same database.

Before you can run the app, you need to provide a config.json with your database connector URL in src/. See `src/config.json.example` for an example and `Database.md` for details.

Run `ng serve` for a dev server, navigate to `http://localhost:4200` and never bother to go productive. Alternatively, run `ng build` to build the project, with the `--prod` flag for a production build. CAUTION: Definitely use `--optimization=false` and configure your initial budget with `"maximumError": "15mb"` in angular.json. PECS is a very complex piece of code and does not take kindly to minification.

If you don't want to install Node and Angular, get the current production build from my [demo](http://bukiro.github.io/PECS-Demo) and run it as a webserver.

A modern computer or tablet should have no issues running PECS in a browser, but mind that it requires some processing power and has way too much on-screen content for a smartphone. PECS looks best in the Edge browser.

# Database

If you want to keep your characters, you need a database. The demo uses a mongodb database, but you can probably make it work with another product, as long as you have a connector URL that handles the necessary queries. See `Database.md` for details, or just go ahead and use [my PECS-MongoDB connector](https://github.com/bukiro/PECS-MongoDB-Connector).