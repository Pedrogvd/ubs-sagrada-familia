import { TestBed } from '@angular/core/testing';

import { Visits } from './visits';

describe('Visits', () => {
  let service: Visits;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Visits);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
