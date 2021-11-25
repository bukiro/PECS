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

import { default as core } from './core.json';

core.forEach((obj: any) => obj._extensionFileName = "core");

export { core as core };