export class Domain {
    public name = '';
    public desc = '';
    public domainSpell = '';
    public advancedDomainSpell = '';
    public sourceBook = '';

    public recast(): Domain {
        return this;
    }
}
