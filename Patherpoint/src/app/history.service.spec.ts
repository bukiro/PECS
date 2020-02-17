/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { HistoryService } from './history.service';

describe('Service: Ancestry', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [HistoryService]
    });
  });

  it('should ...', inject([HistoryService], (service: HistoryService) => {
    expect(service).toBeTruthy();
  }));
});
