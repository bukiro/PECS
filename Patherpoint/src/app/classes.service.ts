import { Injectable } from '@angular/core';
import { Class } from './Class';
import { Level } from './Level';

@Injectable({
    providedIn: 'root'
})
export class ClassesService {

    classes: Class[] = [
        new Class(
            "Monk",
            [ "Strength", "Dexterity" ],
            "",
            [new Level(
                1,
                [],
                4,
                0,
                [{ name:"Monk", rank:2 }],
                [],
                1,
                0,
                1,
                0,
                0,
                0,
                0,
                0,
                [
                    { name:"Fortitude", source:"class" },
                    { name:"Fortitude", source:"class" },
                    { name:"Reflex", source:"class" },
                    { name:"Reflex", source:"class" },
                    { name:"Will", source:"class" },
                    { name:"Will", source:"class" },
                    { name:"Perception", source:"class" },
                    { name:"Simple", source:"class" },
                    { name:"Unarmed", source:"class" },
                    { name:"Unarmored", source:"class" },
                    { name:"Unarmored", source:"class" },
                    { name:"Monk", source:"feat", type:"weapon" }
                ],
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
                0,
                0,
                1,
                0,
                1,
                0,
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
                0,
                0,
                0,
                0,
                0,
                0,
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
        return this.classes.filter($class => $class.name == name || name == "")
    }

}
