import { TestBed } from '@angular/core/testing';

import { FiltersStatesService } from './filters-states.service';

describe('FiltersStatesService', () => {
  let service: FiltersStatesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FiltersStatesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
