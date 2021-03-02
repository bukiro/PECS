/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { GridIconComponent } from './gridIcon.component';

describe('GridIconComponent', () => {
  let component: GridIconComponent;
  let fixture: ComponentFixture<GridIconComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GridIconComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GridIconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
