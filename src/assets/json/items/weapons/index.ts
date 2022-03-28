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
export { default as core } from './core.json';
export { default as advancedPlayersGuide } from './advancedPlayersGuide.json';
export { default as bestiary } from './bestiary.json';
export { default as characterGuide } from './characterGuide.json';
export { default as godsAndMagic } from './godsAndMagic.json';
export { default as pathfinder145 } from './pathfinder145.json';
export { default as pathfinder146 } from './pathfinder146.json';
export { default as pathfinder149 } from './pathfinder149.json';
export { default as pathfinder151 } from './pathfinder151.json';
export { default as pathfinder154 } from './pathfinder154.json';
export { default as PFSGuide } from './PFSGuide.json';
export { default as worldGuide } from './worldGuide.json';
