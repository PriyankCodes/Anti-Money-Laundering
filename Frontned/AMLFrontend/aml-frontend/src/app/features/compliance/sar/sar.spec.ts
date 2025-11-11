import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Sar } from './sar';

describe('Sar', () => {
  let component: Sar;
  let fixture: ComponentFixture<Sar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Sar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Sar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
