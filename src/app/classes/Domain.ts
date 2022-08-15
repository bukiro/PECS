export class Domain {
    public name = '';
    public desc = '';
    public domainSpell = '';
    public advancedDomainSpell = '';
    public sourceBook = '';

    public recast(): Domain {
        return this;
    }

    public clone(): Domain {
        return Object.assign<Domain, Domain>(new Domain(), JSON.parse(JSON.stringify(this))).recast();
    }
}
