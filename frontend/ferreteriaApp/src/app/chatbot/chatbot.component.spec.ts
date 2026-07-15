// ============================================================
// PRUEBAS UNITARIAS - CHATBOT COMPONENT
// ============================================================
// Objetivo: Verificar el comportamiento del asistente virtual.
// ============================================================

import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
  waitForAsync,
} from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ModalController, ToastController } from '@ionic/angular/standalone';
import { DomSanitizer } from '@angular/platform-browser';
import { AlertController } from '@ionic/angular';

import { ChatbotComponent } from './chatbot.component';
import { ChatbotApiService } from './services/chatbot-api.service';
import { AuthSessionService } from '../core/services/auth-session.service';

describe('ChatbotComponent', () => {
  let component: ChatbotComponent;
  let fixture: ComponentFixture<ChatbotComponent>;

  let mockChatbotApi: jasmine.SpyObj<ChatbotApiService>;
  let mockModalCtrl: jasmine.SpyObj<ModalController>;
  let mockToastCtrl: jasmine.SpyObj<ToastController>;
  let mockAuthSession: jasmine.SpyObj<AuthSessionService>;
  let mockSanitizer: jasmine.SpyObj<DomSanitizer>;
  let mockAlertCtrl: jasmine.SpyObj<AlertController>;

  beforeEach(waitForAsync(() => {
    mockChatbotApi = jasmine.createSpyObj('ChatbotApiService', ['sendMessage']);
    mockModalCtrl = jasmine.createSpyObj('ModalController', [
      'create',
      'dismiss',
    ]);
    mockToastCtrl = jasmine.createSpyObj('ToastController', ['create']);
    mockAuthSession = jasmine.createSpyObj('AuthSessionService', [
      'getCurrentUser',
    ]);
    mockSanitizer = jasmine.createSpyObj('DomSanitizer', ['sanitize']);
    mockAlertCtrl = jasmine.createSpyObj('AlertController', ['create']);

    mockAuthSession.getCurrentUser.and.returnValue({
      id: 1,
      username: 'admin',
      fullName: 'Admin',
      role: 'ADMIN',
      email: 'admin@test.com',
    });

    mockSanitizer.sanitize.and.callFake((context, value) => value);

    TestBed.configureTestingModule({
      imports: [FormsModule, ChatbotComponent],
      providers: [
        { provide: ChatbotApiService, useValue: mockChatbotApi },
        { provide: ModalController, useValue: mockModalCtrl },
        { provide: ToastController, useValue: mockToastCtrl },
        { provide: AuthSessionService, useValue: mockAuthSession },
        { provide: DomSanitizer, useValue: mockSanitizer },
        { provide: AlertController, useValue: mockAlertCtrl },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(ChatbotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should start with a welcome message', () => {
    expect(component.messages.length).toBe(1);
    expect(component.messages[0].isUser).toBeFalse();
    expect(component.messages[0].text).toContain('¡Hola!');
  });

  it('should open chat and focus input', fakeAsync(() => {
    const setFocusSpy = spyOn(
      component.messageInput,
      'setFocus',
    ).and.returnValue(Promise.resolve());
    component.openChat();
    expect(component.isOpen).toBeTrue();
    tick(300);
    expect(setFocusSpy).toHaveBeenCalled();
  }));

  it('should close chat', () => {
    component.isOpen = true;
    component.closeChat();
    expect(component.isOpen).toBeFalse();
  });

  it('should add user message', () => {
    const initialLength = component.messages.length;
    component.addUserMessage('Hola bot');
    expect(component.messages.length).toBe(initialLength + 1);
    expect(component.messages[initialLength].isUser).toBeTrue();
    expect(component.messages[initialLength].text).toBe('Hola bot');
  });

  it('should add bot message with sanitization', () => {
    const initialLength = component.messages.length;
    const unsafeText = '<b>Hola</b> <script>alert("XSS")</script>';
    component.addBotMessage(unsafeText);
    expect(component.messages.length).toBe(initialLength + 1);
    expect(component.messages[initialLength].text).not.toContain('<script>');
    expect(component.messages[initialLength].text).toContain('<b>Hola</b>');
  });

  it('should validate input signal', () => {
    component.newMessage.set('Hola mundo');
    expect(component.isInputValid()).toBeTrue();

    component.newMessage.set('Hi');
    expect(component.isInputValid()).toBeFalse();

    component.newMessage.set('Hola#');
    expect(component.isInputValid()).toBeFalse();

    component.newMessage.set('12345');
    expect(component.isInputValid()).toBeFalse();
  });

  it('should return input error messages', () => {
    component.newMessage.set('');
    expect(component.getInputError()).toBeNull();

    component.newMessage.set('H');
    expect(component.getInputError()).toContain('2 caracteres');

    component.newMessage.set('Hola#');
    expect(component.getInputError()).toContain('Caracteres no permitidos');

    component.newMessage.set('12345');
    expect(component.getInputError()).toContain('solo números');
  });

  it('should send message and receive text response', fakeAsync(() => {
    const response = { data: { text: 'Respuesta del bot' } };
    mockChatbotApi.sendMessage.and.returnValue(of(response));

    spyOn(component, 'addUserMessage').and.callThrough();
    spyOn(component, 'addBotMessage').and.callThrough();

    component.newMessage.set('Hola');
    component.sendMessage();
    tick(600);

    expect(mockChatbotApi.sendMessage).toHaveBeenCalledWith('Hola');
    expect(component.addBotMessage).toHaveBeenCalledWith(
      'Respuesta del bot',
      undefined,
    );
    expect(component.isLoading).toBeFalse();
    expect(component.isTyping).toBeFalse();
  }));

  it('should handle chart response', fakeAsync(() => {
    const response = {
      data: {
        type: 'chart',
        title: 'Gráfico',
        labels: ['Ene'],
        data: [100],
        chartType: 'line',
      },
    };
    mockChatbotApi.sendMessage.and.returnValue(of(response));

    spyOn(component, 'addBotMessage').and.callThrough();

    component.newMessage.set('gráfico');
    component.sendMessage();
    tick(600);

    expect(component.addBotMessage).toHaveBeenCalledWith(
      'Gráfico',
      undefined,
      jasmine.objectContaining({
        labels: ['Ene'],
        data: [100],
        type: 'line',
      }),
    );
  }));

  it('should handle suggestions response', fakeAsync(() => {
    const response = {
      data: {
        type: 'suggestions',
        text: 'Opciones',
        suggestions: ['ventas', 'productos'],
      },
    };
    mockChatbotApi.sendMessage.and.returnValue(of(response));

    spyOn(component, 'addBotMessage').and.callThrough();

    component.newMessage.set('sugerencias');
    component.sendMessage();
    tick(600);

    expect(component.addBotMessage).toHaveBeenCalledWith(
      'Opciones',
      undefined,
      undefined,
      ['ventas', 'productos'],
    );
  }));

  it('should handle API error', fakeAsync(() => {
    mockChatbotApi.sendMessage.and.returnValue(
      throwError(() => new Error('Error')),
    );

    spyOn(component, 'addBotMessage').and.callThrough();

    component.newMessage.set('test');
    component.sendMessage();
    tick(600);

    expect(component.addBotMessage).toHaveBeenCalledWith(
      jasmine.stringContaining('ocurrió un error'),
    );
    expect(component.isLoading).toBeFalse();
  }));

  it('should not send if input invalid', () => {
    component.newMessage.set('H');
    component.sendMessage();
    expect(mockChatbotApi.sendMessage).not.toHaveBeenCalled();
  });

  it('should not send if loading', () => {
    component.isLoading = true;
    component.newMessage.set('Hola');
    component.sendMessage();
    expect(mockChatbotApi.sendMessage).not.toHaveBeenCalled();
  });

  it('should execute suggestion on click', fakeAsync(() => {
    spyOn(component, 'sendMessage').and.callThrough();
    component.onSuggestionClick('ventas');
    expect(component.newMessage()).toBe('ventas');
    tick();
    expect(component.sendMessage).toHaveBeenCalled();
  }));

  it('should clear chat and show welcome', () => {
    component.messages = [
      { text: 'Hola', isUser: true, timestamp: new Date() },
    ];
    component['clearChat']();
    expect(component.messages.length).toBe(1);
    expect(component.messages[0].text).toContain('¡Hola!');
    expect(localStorage.getItem('chatbot_history')).toBeNull();
  });

  it('should scroll to bottom if container exists', () => {
    const mockElement = { scrollTop: 0, scrollHeight: 100 };
    component.chatContent = { nativeElement: mockElement } as any;
    component['scrollToBottom']();
    expect(mockElement.scrollTop).toBe(100);
  });

  it('should not fail scrolling if container is undefined', () => {
    component.chatContent = undefined as any;
    expect(() => component['scrollToBottom']()).not.toThrow();
  });

  it('should return true for admin user', () => {
    mockAuthSession.getCurrentUser.and.returnValue({
      id: 1,
      username: 'admin',
      fullName: 'Admin',
      role: 'ADMIN',
      email: 'admin@test.com',
    });
    expect(component.isAdmin()).toBeTrue();
  });

  it('should return false for seller user', () => {
    mockAuthSession.getCurrentUser.and.returnValue({
      id: 2,
      username: 'seller',
      fullName: 'Seller',
      role: 'SELLER',
      email: 'seller@test.com',
    });
    expect(component.isAdmin()).toBeFalse();
  });

  it('should destroy charts on ngOnDestroy', () => {
    const mockChart = jasmine.createSpyObj('Chart', ['destroy']);
    component['chartInstances'].set(0, mockChart);
    component.ngOnDestroy();
    expect(mockChart.destroy).toHaveBeenCalled();
  });
});
