import { TestBed } from '@angular/core/testing';

import { OpsShowedService } from './ops-showed.service';

describe('OpsShowedService', () => {
  let service: OpsShowedService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OpsShowedService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
