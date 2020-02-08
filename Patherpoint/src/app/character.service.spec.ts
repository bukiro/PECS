/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { CharacterService } from './character.service';

describe('Service: Character', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CharacterService]
    });
  });

  it('should ...', inject([CharacterService], (service: CharacterService) => {
    expect(service).toBeTruthy();
  }));
});
