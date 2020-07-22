/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { DiceIcons_D20Component } from './diceIcons_D20.component';

describe('DiceIcons_D20Component', () => {
  let component: DiceIcons_D20Component;
  let fixture: ComponentFixture<DiceIcons_D20Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DiceIcons_D20Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DiceIcons_D20Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
