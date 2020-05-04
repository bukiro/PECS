/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { SavegameService } from './savegame.service';

describe('Service: Savegame', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [SavegameService]
    });
  });

  it('should ...', inject([SavegameService], (service: SavegameService) => {
    expect(service).toBeTruthy();
  }));
});
