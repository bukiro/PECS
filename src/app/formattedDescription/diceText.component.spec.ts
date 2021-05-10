/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { DiceTextComponent } from './diceText.component';

describe('DiceTextComponent', () => {
  let component: DiceTextComponent;
  let fixture: ComponentFixture<DiceTextComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DiceTextComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DiceTextComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
