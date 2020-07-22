/* tslint:disable:no-unused-variable */
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { DebugElement } from '@angular/core';

import { DiceIcons_D12Component } from './diceIcons_D12.component';

describe('DiceIcons_D12Component', () => {
  let component: DiceIcons_D12Component;
  let fixture: ComponentFixture<DiceIcons_D12Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DiceIcons_D12Component ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DiceIcons_D12Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
