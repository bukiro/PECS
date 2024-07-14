import { Weapon } from 'src/app/classes/items/weapon';

export const attackEffectPhrases = (
    phrase: string,
    context: {
        weapon: Weapon;
        range: string;
        prof: string;
        traits: Array<string>;
        isFavoredWeapon: boolean;
    },
): Array<string> => [
    phrase,
    `${ context.weapon.name } ${ phrase }`,
    //"Longsword ", "Fist " etc.
    `${ context.weapon.weaponBase } ${ phrase }`,
    //"Sword ", "Club "
    `${ context.weapon.group } ${ phrase }`,
    //"Unarmed Attacks ", "Simple Weapons " etc.
    `${ context.prof } ${ phrase }`,
    //"Unarmed ", "Simple " etc.
    `${ context.prof.split(' ')[0] } ${ phrase }`,
    //"Weapons " (also "Attacks ", but that's unlikely to be needed)
    `${ context.prof.split(' ')[1] } ${ phrase }`,
    //"Simple Sword ", "Martial Club " etc.
    `${ context.prof.split(' ')[0] } ${ context.weapon.group } ${ phrase }`,
    //"Simple Longsword ", "Unarmed Fist " etc.
    `${ context.prof.split(' ')[0] } ${ context.weapon.weaponBase } ${ phrase }`,
    //"Melee ", "Ranged "
    `${ context.range } ${ phrase }`,
]
    .concat(context.traits.map(trait => {
        //Add any traits, i.e. "Monk ", "Gnome ", but don't include any added ranges.
        if (trait.includes(' ft')) {
            return `${ trait.split(' ')[0] } ${ phrase }`;
        } else {
            return `${ trait } ${ phrase }`;
        }
    }))
    .concat(
        context.traits.includes('Agile') ? [] : [
            `Non-Agile ${ phrase }`,
        ],
    )
    .concat(
        context.isFavoredWeapon ? [
            `Favored Weapon ${ phrase }`,
            //"Simple Favored Weapon ", "Unarmed Favored Weapon " etc.
            `${ context.prof.split(' ')[0] } Favored Weapon ${ phrase }`,
            //"Melee Favored Weapon ", "Ranged Favored Weapon " etc.
            `${ context.range } Favored Weapon ${ phrase }`,
        ] : [],
    );
