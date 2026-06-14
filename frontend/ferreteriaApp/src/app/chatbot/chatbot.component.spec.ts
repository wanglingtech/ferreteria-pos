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

import { ChatbotComponent } from './chatbot.component';
import {
  ChatbotApiService,
  ChatResponse,
} from './services/chatbot-api.service';

// Mock del servicio de API
class MockChatbotApiService {
  sendMessage(message: string) {
    return of({
      data: { text: 'Respuesta de prueba', saleData: null },
    });
  }
}

// Mock de ModalController
class MockModalController {
  create() {
    return Promise.resolve({ present: () => {}, dismiss: () => {} });
  }
  dismiss() {}
}

// Mock de ToastController
class MockToastController {
  create() {
    return Promise.resolve({ present: () => {} });
  }
}

describe('ChatbotComponent', () => {
  let component: ChatbotComponent;
  let fixture: ComponentFixture<ChatbotComponent>;
  let chatbotApiMock: MockChatbotApiService;

  beforeEach(waitForAsync(() => {
    chatbotApiMock = new MockChatbotApiService();

    TestBed.configureTestingModule({
      imports: [FormsModule, ChatbotComponent],
      providers: [
        { provide: ChatbotApiService, useValue: chatbotApiMock },
        { provide: ModalController, useClass: MockModalController },
        { provide: ToastController, useClass: MockToastController },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChatbotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('debería crear el componente', () => {
    expect(component).toBeTruthy();
  });

  it('debería inicializar con un mensaje de bienvenida', () => {
    expect(component.messages.length).toBe(1);
    expect(component.messages[0].isUser).toBeFalse();
    expect(component.messages[0].text).toContain('¡Hola!');
  });

  it('debería abrir el chat y enfocar el input', fakeAsync(() => {
    const setFocusSpy = spyOn(
      component.messageInput,
      'setFocus',
    ).and.returnValue(Promise.resolve());
    component.openChat();
    expect(component.isOpen).toBeTrue();
    tick(300);
    expect(setFocusSpy).toHaveBeenCalled();
  }));

  it('debería cerrar el chat', () => {
    component.isOpen = true;
    component.closeChat();
    expect(component.isOpen).toBeFalse();
  });

  it('debería agregar un mensaje de usuario', () => {
    const initialLength = component.messages.length;
    component.addUserMessage('Hola bot');
    expect(component.messages.length).toBe(initialLength + 1);
    expect(component.messages[initialLength].isUser).toBeTrue();
    expect(component.messages[initialLength].text).toBe('Hola bot');
  });

  it('debería agregar un mensaje del bot', () => {
    const initialLength = component.messages.length;
    component.addBotMessage('Respuesta del bot', null);
    expect(component.messages.length).toBe(initialLength + 1);
    expect(component.messages[initialLength].isUser).toBeFalse();
    expect(component.messages[initialLength].text).toBe('Respuesta del bot');
  });

  it('debería enviar un mensaje y recibir respuesta', fakeAsync(() => {
    spyOn(component, 'addUserMessage').and.callThrough();
    spyOn(component, 'addBotMessage').and.callThrough();
    component.newMessage = 'Hola bot';
    component.sendMessage();
    tick(600); // espera el setTimeout y la respuesta

    expect(component.addUserMessage).toHaveBeenCalledWith('Hola bot');
    expect(component.addBotMessage).toHaveBeenCalled();
    expect(component.isLoading).toBeFalse();
    expect(component.isTyping).toBeFalse();
  }));

  it('debería manejar error al enviar mensaje', fakeAsync(() => {
    const errorMock = { error: { message: 'Error de servidor' } };
    spyOn(chatbotApiMock, 'sendMessage').and.returnValue(
      throwError(() => errorMock),
    );
    component.newMessage = 'Mensaje que falla';
    component.sendMessage();
    tick(600);
    expect(component.messages.some((m) => m.text.includes('error'))).toBeTrue();
    expect(component.isLoading).toBeFalse();
    expect(component.isTyping).toBeFalse();
  }));

  it('debería ejecutar sugerencia al hacer clic', fakeAsync(() => {
    spyOn(component, 'sendMessage').and.callThrough();
    component.onSuggestionClick('gráfico ventas');
    expect(component.newMessage).toBe('gráfico ventas');
    tick();
    expect(component.sendMessage).toHaveBeenCalled();
  }));

  it('debería descargar PDF llamando al método correspondiente', async () => {
    const ventaMock = {
      code: 'V-123',
      createdAt: new Date(),
      customerName: 'Cliente Test',
      seller: { fullName: 'Vendedor' },
      items: [
        {
          product: { name: 'Producto' },
          quantity: 1,
          unitPrice: 10,
          lineTotal: 10,
        },
      ],
      subtotal: 10,
      igv: 1.8,
      total: 11.8,
    };
    spyOn(component, 'createTempSaleElement').and.returnValue(
      document.createElement('div'),
    );
    spyOn(component, 'addBotMessage');
    await component.downloadPdf(ventaMock);
    expect(component.addBotMessage).toHaveBeenCalledWith(
      jasmine.stringContaining('✅ PDF de la venta V-123 descargado.'),
    );
  });

  it('debería alternar el estado del chat correctamente', () => {
    component.isOpen = false;
    component.toggleChat(); // Nota: no hay método toggleChat, usamos open/close
    component.openChat();
    expect(component.isOpen).toBeTrue();
    component.closeChat();
    expect(component.isOpen).toBeFalse();
  });
});
