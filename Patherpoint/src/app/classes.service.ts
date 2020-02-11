import { Injectable } from '@angular/core';
import { Class } from './Class';
import { Level } from './Level';

@Injectable({
    providedIn: 'root'
})
export class ClassesService {

    classes: Class[] = [
        new Class("---", []),
        new Class(
            "Monk",
            [ "Strength", "Dexterity" ],
            "",
            [new Level(
                1,
                [],
                4,
                0,
                [
                    { name:"simple", rank:2 },
                    { name:"unarmed", rank:2 },
                ],
                [
                    { name:"unarmored", rank:4}
                ],
                [{ name:"Monk", rank:2 }],
                [ "Flurry of Blows" ],
                1,
                0,
                [],
                0,
                0,
                [],
                0,
                0,
                [],
                4,
                0
            ),
            new Level(
                2,
                [],
                0,
                0,
                [],
                [],
                [],
                [],
                1,
                0,
                [],
                1,
                0,
                [],
                0,
                0,
                [],
                0,
                0
            ),
            new Level(
                3,
                [],
                0,
                0,
                [],
                [],
                [],
                [],
                0,
                0,
                [],
                0,
                0,
                [],
                1,
                0,
                [],
                1,
                0
            )]
        )
    ]

constructor() { }

    get_Classes(name: string = "") {
        if (name == "") {
            return this.classes;
        } else {
            return this.classes.filter($class => $class.name == name )
        }
        
    }

}
