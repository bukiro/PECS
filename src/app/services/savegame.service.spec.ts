/* tslint:disable:no-unused-variable */

import { TestBed, inject, waitForAsync } from '@angular/core/testing';
import { SavegameService } from 'src/app/services/savegame.service';

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
