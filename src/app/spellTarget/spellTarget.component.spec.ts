/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { SpellTargetComponent } from './spellTarget.component';

describe('SpellTargetComponent', () => {
  let component: SpellTargetComponent;
  let fixture: ComponentFixture<SpellTargetComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SpellTargetComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SpellTargetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
