import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewChecked,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  ModalController,
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
} from 'ionicons/icons';
import { ChatbotApiService } from './services/chatbot-api.service';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { firstValueFrom } from 'rxjs';

interface Message {
  text: string;
  isUser: boolean;
  timestamp: Date;
  saleData?: any;
  actions?: ('pdf' | 'image')[];
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
  ],
})
export class ChatbotComponent implements AfterViewChecked, OnInit {
  @ViewChild('chatContent') chatContent!: ElementRef;
  @ViewChild('messageInput', { read: IonInput }) messageInput!: IonInput; // ✅ corregido

  isOpen = false;
  messages: Message[] = [];
  newMessage = '';
  isLoading = false;
  isTyping = false;

  constructor(
    private chatbotApi: ChatbotApiService,
    private modalCtrl: ModalController,
  ) {
    addIcons({
      chatbubbleEllipsesOutline,
      sendOutline,
      closeOutline,
      documentTextOutline,
      imageOutline,
      downloadOutline,
      logoElectron,
    });
  }

  ngOnInit() {
    this.loadConversationHistory();
    if (this.messages.length === 0) {
      this.addBotMessage(
        '¡Hola! Soy tu asistente inteligente. Pregúntame sobre ventas, clientes o productos. Escribe "ayuda" para conocer mis funciones.',
      );
    }
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  openChat() {
    this.isOpen = true;
    setTimeout(() => {
      this.messageInput?.setFocus(); // ✅ funciona ahora
    }, 300);
  }

  closeChat() {
    this.isOpen = false;
  }

  onModalDismiss() {
    this.isOpen = false;
  }

  addUserMessage(text: string) {
    this.messages.push({ text, isUser: true, timestamp: new Date() });
    this.saveConversationHistory();
  }

  addBotMessage(text: string, saleData?: any) {
    const msg: Message = {
      text,
      isUser: false,
      timestamp: new Date(),
      saleData,
    };
    if (saleData) msg.actions = ['pdf', 'image'];
    this.messages.push(msg);
    this.saveConversationHistory();
  }

  async sendMessage() {
    const msg = this.newMessage.trim();
    if (!msg || this.isLoading) return;

    this.addUserMessage(msg);
    this.newMessage = '';
    this.isLoading = true;
    this.isTyping = true;

    // Simular "escribiendo" mientras se recibe respuesta
    setTimeout(async () => {
      try {
        const response = await firstValueFrom(this.chatbotApi.sendMessage(msg));
        const data = response.data;
        this.isTyping = false;
        this.addBotMessage(data.text, data.saleData);
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
              <td style="padding:8px;">S/ ${Number(item.lineTotal).toFixed(2)}</td>
            </tr>`,
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
        console.warn(e);
      }
    }
  }

  private scrollToBottom() {
    if (this.chatContent) {
      this.chatContent.nativeElement.scrollTop =
        this.chatContent.nativeElement.scrollHeight;
    }
  }
}
