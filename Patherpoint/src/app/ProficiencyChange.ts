export class ProficiencyChange {
    //For feats like "treat Advanced Goblin Sword as Martial Weapons", enter
    // trait:"Goblin", proficiency:"Advanced Weapons", public group:"Sword", result:"Martial Weapons"
    public result: "Unarmed Attacks"|"Simple Weapons"|"Martial Weapons"|"Advanced Weapons" = "Simple Weapons";
    public proficiency: "Unarmed Attacks"|"Simple Weapons"|"Martial Weapons"|"Advanced Weapons"|"" = "";
    public name: string = "";
    public group: string = "";
    public trait: string = "";
}
