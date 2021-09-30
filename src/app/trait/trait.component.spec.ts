/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { TraitComponent } from './trait.component';

describe('TraitComponent', () => {
  let component: TraitComponent;
  let fixture: ComponentFixture<TraitComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TraitComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TraitComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
