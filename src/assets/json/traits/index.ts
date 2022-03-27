//For custom content, create extensions.json in this directory to import custom json files. These files' names should start with "custom_".
//For updates and conflicting content, use the "overridePriority" attribute in each object (higher value overrides lower value).
//Example extensions.json:
/*
[
    {
        "name": "my_campaign",
        "filename": "custom_my_campaign.json"
    }
]
*/

//Since _extensionFileName is already set in these JSON files, they can be directly exported.
//import { default as core } from './core.json';
//core.forEach((obj: any) => obj._extensionFileName = "core");
//export { core as core };
export { default as pecs } from './pecs.json';
export { default as core } from './core.json';
export { default as advancedPlayersGuide } from './advancedPlayersGuide.json';
export { default as ancestryGuide } from './ancestryGuide.json';
export { default as azarketiAncestry } from './azarketiAncestry.json';
export { default as bestiary } from './bestiary.json';
export { default as bestiary2 } from './bestiary2.json';
export { default as bestiary3 } from './bestiary3.json';
export { default as characterGuide } from './characterGuide.json';
export { default as gamemasteryGuide } from './gamemasteryGuide.json';
export { default as godsAndMagic } from './godsAndMagic.json';
export { default as legends } from './legends.json';
export { default as mwangiExpanse } from './mwangiExpanse.json';
export { default as pathfinder145 } from './pathfinder145.json';
export { default as pathfinder146 } from './pathfinder146.json';
export { default as pathfinder147 } from './pathfinder147.json';
export { default as pathfinder148 } from './pathfinder148.json';
export { default as pathfinder150 } from './pathfinder150.json';
export { default as pathfinder151 } from './pathfinder151.json';
export { default as pathfinder153 } from './pathfinder153.json';
export { default as pathfinder160 } from './pathfinder160.json';
export { default as pathfinder167 } from './pathfinder167.json';
export { default as pathfinder168 } from './pathfinder168.json';
export { default as pathfinder173 } from './pathfinder173.json';
export { default as worldGuide } from './worldGuide.json';
