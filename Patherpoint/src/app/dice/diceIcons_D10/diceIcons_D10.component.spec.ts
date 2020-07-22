/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { DiceIcons_D10Component } from './diceIcons_D10.component';

describe('DiceIcons_D10Component', () => {
  let component: DiceIcons_D10Component;
  let fixture: ComponentFixture<DiceIcons_D10Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DiceIcons_D10Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DiceIcons_D10Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
