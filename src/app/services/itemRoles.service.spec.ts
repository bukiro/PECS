/* tslint:disable:no-unused-variable */

import { TestBed, async, inject } from '@angular/core/testing';
import { ItemRolesService } from './itemRoles.service';

describe('Service: ItemCapabilities', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ItemRolesService]
    });
  });

  it('should ...', inject([ItemRolesService], (service: ItemRolesService) => {
    expect(service).toBeTruthy();
  }));
});
