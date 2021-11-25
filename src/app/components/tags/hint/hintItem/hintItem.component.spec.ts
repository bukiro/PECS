/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { HintItemComponent } from './hintItem.component';

describe('HintItemComponent', () => {
  let component: HintItemComponent;
  let fixture: ComponentFixture<HintItemComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HintItemComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HintItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
