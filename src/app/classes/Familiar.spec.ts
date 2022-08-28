import { Familiar } from './Familiar';

fdescribe('Familiar', () => {
    it('should compile at least', () => {
        expect(new Familiar()).toBeTruthy();
    });
});
