// ============================================================
// CHATBOT COMPONENT - ASISTENTE VIRTUAL CON COMANDOS Y GRÁFICOS
// ============================================================

import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewChecked,
  OnInit,
  OnDestroy,
  computed,
  signal,
  inject,
  SecurityContext,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import {
  IonContent,
  IonInput,
  IonButton,
  IonIcon,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonFooter,
  IonFab,
  IonFabButton,
  IonChip,
  IonLabel,
  IonButtons,
  ModalController,
  ToastController,
  AlertController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  chatbubbleEllipsesOutline,
  sendOutline,
  closeOutline,
  documentTextOutline,
  imageOutline,
  downloadOutline,
  logoElectron,
  barChartOutline,
  peopleOutline,
  cubeOutline,
  notificationsOutline,
  cloudDownloadOutline,
  flashOutline,
  trashOutline,
  alertCircleOutline,
} from 'ionicons/icons';
import { ChatbotApiService } from './services/chatbot-api.service';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { firstValueFrom } from 'rxjs';
import { Chart, registerables } from 'chart.js';
import { AuthSessionService } from '../core/services/auth-session.service';

Chart.register(...registerables);

/**
 * Interfaz que define la estructura de un mensaje en el chat.
 */
interface Message {
  text: string; // Contenido del mensaje (puede contener HTML)
  isUser: boolean; // true si es del usuario, false si es del bot
  timestamp: Date; // Fecha/hora del mensaje
  saleData?: any; // Datos de venta (para mostrar botones de PDF/Imagen)
  actions?: ('pdf' | 'image')[]; // Acciones disponibles para este mensaje
  chartData?: any; // Datos para renderizar un gráfico
  suggestions?: string[]; // Sugerencias rápidas para el usuario
}

@Component({
  selector: 'app-chatbot',
  standalone: true,
  templateUrl: './chatbot.component.html',
  styleUrls: ['./chatbot.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonInput,
    IonButton,
    IonIcon,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonFooter,
    IonFab,
    IonFabButton,
    IonChip,
    IonLabel,
    IonButtons,
  ],
})
export class ChatbotComponent implements AfterViewChecked, OnInit, OnDestroy {
  // ============================================================
  // 1. REFERENCIAS A ELEMENTOS DEL DOM
  // ============================================================
  @ViewChild('chatContent') chatContent!: ElementRef;
  @ViewChild('messageInput', { read: IonInput }) messageInput!: IonInput;

  // ============================================================
  // 2. INYECCIÓN DE DEPENDENCIAS
  // ============================================================
  private authService = inject(AuthSessionService);
  private sanitizer = inject(DomSanitizer);

  // ============================================================
  // 3. ESTADO DEL COMPONENTE
  // ============================================================
  isOpen = false; // Indica si el modal del chat está abierto
  messages: Message[] = []; // Lista de mensajes del chat
  newMessage = signal<string>(''); // Señal con el texto del mensaje actual
  isLoading = false; // Indica si se está enviando un mensaje
  isTyping = false; // Indica si el bot está "escribiendo"
  private chartInstances: Map<number, Chart> = new Map(); // Gráficos activos

  // ============================================================
  // 4. COMPUTED: VALIDACIÓN DEL INPUT
  // ============================================================
  /**
   * Señal computada que valida si el mensaje actual es válido para enviar.
   */
  isInputValid = computed(() => {
    const msg = this.newMessage().trim();
    if (!msg || msg.length < 2) return false;
    const regex = /^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ0-9\s\-'\.()?!,;:]+$/;
    return regex.test(msg) && !/^[0-9\s]+$/.test(msg);
  });

  /**
   * Devuelve un mensaje de error si el input no es válido.
   */
  getInputError(): string | null {
    const msg = this.newMessage().trim();
    if (!msg) return null;
    if (msg.length < 2) return 'El mensaje debe tener al menos 2 caracteres.';
    const regex = /^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ0-9\s\-'\.()?!,;:]+$/;
    if (!regex.test(msg)) {
      return 'Caracteres no permitidos: solo letras, números, espacios y puntuación básica (.,!?;:-).';
    }
    if (/^[0-9\s]+$/.test(msg)) {
      return 'El mensaje no puede ser solo números y espacios.';
    }
    return null;
  }

  // ============================================================
  // 5. CONSTRUCTOR
  // ============================================================
  constructor(
    private chatbotApi: ChatbotApiService,
    private modalCtrl: ModalController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
  ) {
    addIcons({
      chatbubbleEllipsesOutline,
      sendOutline,
      closeOutline,
      documentTextOutline,
      imageOutline,
      downloadOutline,
      logoElectron,
      barChartOutline,
      peopleOutline,
      cubeOutline,
      notificationsOutline,
      cloudDownloadOutline,
      flashOutline,
      trashOutline,
      alertCircleOutline,
    });
  }

  // ============================================================
  // 6. CICLO DE VIDA
  // ============================================================
  ngOnInit() {
    this.loadConversationHistory();
    if (this.messages.length === 0) {
      this.addBotMessage(
        '¡Hola! Soy tu asistente inteligente. Puedo ayudarte con ventas, productos, gráficos, notificaciones y más. Escribe "sugerencias" para ver opciones.',
      );
    }
  }

  /**
   * Se ejecuta después de cada cambio en la vista.
   * Hace scroll automático al final del chat SOLO si el componente está visible.
   * ✅ CORREGIDO: verifica que `chatContent` exista antes de acceder a `nativeElement`.
   */
  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  ngOnDestroy() {
    this.chartInstances.forEach((chart) => chart.destroy());
  }

  // ============================================================
  // 7. MÉTODOS DE UTILIDAD
  // ============================================================
  isAdmin(): boolean {
    const user = this.authService.getCurrentUser();
    return user?.role === 'ADMIN';
  }

  // ============================================================
  // 8. CONTROL DEL MODAL
  // ============================================================
  openChat() {
    this.isOpen = true;
    setTimeout(() => this.messageInput?.setFocus(), 300);
  }

  closeChat() {
    this.isOpen = false;
  }

  onModalDismiss() {
    this.isOpen = false;
  }

  // ============================================================
  // 9. GESTIÓN DE MENSAJES
  // ============================================================
  addUserMessage(text: string) {
    this.messages.push({ text, isUser: true, timestamp: new Date() });
    this.saveConversationHistory();
  }

  /**
   * Añade un mensaje del bot con sanitización de HTML para prevenir XSS.
   */
  addBotMessage(
    text: string,
    saleData?: any,
    chartData?: any,
    suggestions?: string[],
  ) {
    // Sanitizar el texto: elimina cualquier elemento o atributo peligroso
    const sanitizedText =
      this.sanitizer.sanitize(SecurityContext.HTML, text) || '';

    const msg: Message = {
      text: sanitizedText,
      isUser: false,
      timestamp: new Date(),
      saleData,
      chartData,
      suggestions,
    };
    if (saleData) msg.actions = ['pdf', 'image'];
    this.messages.push(msg);
    this.saveConversationHistory();
    if (chartData)
      setTimeout(
        () => this.renderChart(this.messages.length - 1, chartData),
        100,
      );
  }

  // ============================================================
  // 10. ENVÍO DE MENSAJES
  // ============================================================
  async sendMessage() {
    if (!this.isInputValid() || this.isLoading) return;

    const msg = this.newMessage().trim();
    this.addUserMessage(msg);
    this.newMessage.set('');
    this.isLoading = true;
    this.isTyping = true;

    setTimeout(async () => {
      try {
        const response = await firstValueFrom(this.chatbotApi.sendMessage(msg));
        const data = response.data as any;
        this.isTyping = false;

        if (data.type === 'chart' && data.labels && data.data) {
          this.addBotMessage(data.title || 'Gráfico de ventas', undefined, {
            labels: data.labels,
            data: data.data,
            borderColor: data.borderColor || '#0a1a5c',
            backgroundColor: data.backgroundColor || 'rgba(10, 26, 92, 0.2)',
            type: data.chartType || 'line',
          });
        } else if (data.type === 'suggestions' && data.suggestions) {
          this.addBotMessage(data.text, undefined, undefined, data.suggestions);
        } else {
          this.addBotMessage(data.text, data.saleData);
        }
      } catch (error) {
        console.error(error);
        this.isTyping = false;
        this.addBotMessage(
          '❌ Lo siento, ocurrió un error. Inténtalo de nuevo.',
        );
      } finally {
        this.isLoading = false;
        setTimeout(() => this.messageInput?.setFocus(), 100);
      }
    }, 600);
  }

  async onSuggestionClick(suggestion: string) {
    this.newMessage.set(suggestion);
    await this.sendMessage();
  }

  // ============================================================
  // 11. LIMPIAR CHAT
  // ============================================================
  async confirmClearChat() {
    const alert = await this.alertCtrl.create({
      header: 'Limpiar conversación',
      message:
        '¿Estás seguro de que deseas borrar todo el historial del chat? Esta acción no se puede deshacer.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Limpiar', handler: () => this.clearChat() },
      ],
    });
    await alert.present();
  }

  private clearChat() {
    this.messages = [];
    this.addBotMessage(
      '¡Hola! Soy tu asistente inteligente. Puedo ayudarte con ventas, productos, gráficos, notificaciones y más. Escribe "sugerencias" para ver opciones.',
    );
    localStorage.removeItem('chatbot_history');
    this.toastCtrl
      .create({
        message: 'Chat limpiado',
        duration: 2000,
        color: 'success',
        position: 'top',
      })
      .then((toast) => toast.present());
  }

  // ============================================================
  // 12. GRÁFICOS
  // ============================================================
  private renderChart(index: number, chartData: any) {
    setTimeout(() => {
      const canvas = document.getElementById(
        `chart-${index}`,
      ) as HTMLCanvasElement;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      if (this.chartInstances.has(index))
        this.chartInstances.get(index)?.destroy();
      const chart = new Chart(ctx, {
        type: chartData.type,
        data: {
          labels: chartData.labels,
          datasets: [
            {
              label: 'Ventas (S/.)',
              data: chartData.data,
              borderColor: chartData.borderColor,
              backgroundColor: chartData.backgroundColor,
              borderWidth: 2,
              fill: chartData.type === 'line',
              tension: 0.3,
            },
          ],
        },
        options: { responsive: true, maintainAspectRatio: true },
      });
      this.chartInstances.set(index, chart);
    }, 100);
  }

  // ============================================================
  // 13. DESCARGA DE PDF E IMAGEN
  // ============================================================
  async downloadPdf(saleData: any) {
    const venta = saleData;
    const element = this.createTempSaleElement(venta);
    document.body.appendChild(element);
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, canvas.height * (80 / canvas.width)],
      });
      const imgWidth = 80;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`venta-${venta.code}.pdf`);
      this.addBotMessage(`✅ PDF de la venta ${venta.code} descargado.`);
    } catch (error) {
      console.error(error);
      this.addBotMessage(
        `❌ No se pudo generar el PDF de la venta ${venta.code}.`,
      );
    } finally {
      document.body.removeChild(element);
    }
  }

  async downloadImage(saleData: any) {
    const venta = saleData;
    const element = this.createTempSaleElement(venta);
    document.body.appendChild(element);
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#ffffff',
      });
      const link = document.createElement('a');
      link.download = `venta-${venta.code}.png`;
      link.href = canvas.toDataURL();
      link.click();
      this.addBotMessage(`✅ Imagen de la venta ${venta.code} descargada.`);
    } catch (error) {
      console.error(error);
      this.addBotMessage(
        `❌ No se pudo generar la imagen de la venta ${venta.code}.`,
      );
    } finally {
      document.body.removeChild(element);
    }
  }

  // ============================================================
  // 14. CONSTRUCCIÓN DEL ELEMENTO TEMPORAL PARA PDF/IMAGEN
  // ============================================================
  private createTempSaleElement(venta: any): HTMLElement {
    const div = document.createElement('div');
    div.style.backgroundColor = 'white';
    div.style.padding = '20px';
    div.style.width = '800px';
    div.style.fontFamily = 'Segoe UI, Arial, sans-serif';
    div.style.borderRadius = '16px';
    div.innerHTML = `
      <div style="text-align: center; border-bottom: 2px solid #0a1a5c; padding-bottom: 12px; margin-bottom: 16px;">
        <img src="assets/logo/logo_ferreteria.png" style="width: 60px; margin-bottom: 8px;" />
        <h3 style="margin:0; color:#0a1a5c;">Ferretería July</h3>
        <p style="font-size:11px; color:#475569;">RUC: 10097428951 | Av. México 118, Comas</p>
      </div>
      <div style="margin-bottom:16px;">
        <p><strong>Venta N°:</strong> ${venta.code}</p>
        <p><strong>Fecha:</strong> ${new Date(venta.createdAt).toLocaleString('es-PE')}</p>
        <p><strong>Cliente:</strong> ${venta.customerName || 'Consumidor Final'}</p>
        <p><strong>Vendedor:</strong> ${venta.seller?.fullName || 'Desconocido'}</p>
      </div>
      <div style="overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse; font-size:12px;">
          <thead><tr style="background:#f1f5f9;"><th>Producto</th><th>Cantidad</th><th>Precio Unit.</th><th>Subtotal</th></tr></thead>
          <tbody>
            ${venta.items
              .map(
                (item: any) => `
              <tr><td style="padding:8px; border-bottom:1px solid #e2e8f0;">${item.product.name}</td>
              <td style="padding:8px;">${item.quantity}</td>
              <td style="padding:8px;">S/ ${Number(item.unitPrice).toFixed(2)}</td>
              <td style="padding:8px;">S/ ${Number(item.lineTotal).toFixed(2)}</td></tr>
            `,
              )
              .join('')}
          </tbody>
        </table>
      </div>
      <div style="text-align:right; margin-top:16px;">
        <p>Subtotal: S/ ${Number(venta.subtotal).toFixed(2)}</p>
        <p>IGV (18%): S/ ${Number(venta.igv).toFixed(2)}</p>
        <p><strong>TOTAL: S/ ${Number(venta.total).toFixed(2)}</strong></p>
      </div>
      <div style="text-align:center; margin-top:20px; font-size:10px; color:#94a3b8;">¡Gracias por su compra!</div>
    `;
    return div;
  }

  // ============================================================
  // 15. PERSISTENCIA DEL HISTORIAL
  // ============================================================
  private saveConversationHistory() {
    const toStore = this.messages.slice(-50).map((m) => ({
      text: m.text,
      isUser: m.isUser,
      timestamp: m.timestamp.toISOString(),
      saleData: m.saleData ? { code: m.saleData.code } : null,
    }));
    localStorage.setItem('chatbot_history', JSON.stringify(toStore));
  }

  private loadConversationHistory() {
    const stored = localStorage.getItem('chatbot_history');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        this.messages = parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp),
          saleData: m.saleData ? { code: m.saleData.code } : null,
          actions: m.saleData ? ['pdf', 'image'] : undefined,
        }));
      } catch (e) {
        console.warn('Error cargando historial del chat:', e);
      }
    }
  }

  // ============================================================
  // 16. SCROLL AUTOMÁTICO
  // ============================================================
  /**
   * Desplaza el contenedor del chat hasta el final para mostrar el último mensaje.
   * `chatContent` y `nativeElement` deben existir antes de acceder.
   * Además, solo ejecuta el scroll si el chat está abierto (opcional, pero evita trabajo innecesario).
   */
  private scrollToBottom() {
    // Verificar que el elemento exista y esté disponible en el DOM
    if (this.chatContent && this.chatContent.nativeElement) {
      // Opcional: solo hacer scroll si el chat está abierto
      // if (!this.isOpen) return;
      this.chatContent.nativeElement.scrollTop =
        this.chatContent.nativeElement.scrollHeight;
    }
  }
}
