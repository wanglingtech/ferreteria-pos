import {
  Component,
  ElementRef,
  ViewChild,
  AfterViewChecked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonInput,
  IonButton,
  IonIcon,
  IonSpinner,
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
} from 'ionicons/icons';
import { ChatbotApiService } from './services/chatbot-api.service';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface Message {
  text: string;
  isUser: boolean;
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
    IonSpinner,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonFooter,
    IonFab,
    IonFabButton,
  ],
})
export class ChatbotComponent implements AfterViewChecked {
  @ViewChild('chatContent') chatContent!: ElementRef;
  isOpen = false;
  messages: Message[] = [];
  newMessage = '';
  isLoading = false;

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
    });
    this.messages.push({
      text: '¡Hola! Soy tu asistente inteligente. Pregúntame sobre ventas, clientes o productos. Escribe "ayuda" para conocer mis funciones.',
      isUser: false,
    });
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  toggleChat() {
    this.isOpen = !this.isOpen;
  }

  async sendMessage() {
    const msg = this.newMessage.trim();
    if (!msg) return;

    this.messages.push({ text: msg, isUser: true });
    this.newMessage = '';
    this.isLoading = true;

    this.chatbotApi.sendMessage(msg).subscribe({
      next: (response) => {
        const data = response.data;
        const botMsg: Message = {
          text: data.text,
          isUser: false,
          saleData: data.saleData,
        };
        if (data.saleData) {
          botMsg.actions = ['pdf', 'image'];
        }
        this.messages.push(botMsg);
        this.isLoading = false;
      },
      error: () => {
        this.messages.push({
          text: 'Lo siento, ocurrió un error. Inténtalo de nuevo.',
          isUser: false,
        });
        this.isLoading = false;
      },
    });
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
      this.messages.push({
        text: `✅ PDF de la venta ${venta.code} descargado.`,
        isUser: false,
      });
    } catch (error) {
      console.error(error);
      this.messages.push({
        text: '❌ No se pudo generar el PDF.',
        isUser: false,
      });
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
      this.messages.push({
        text: `✅ Imagen de la venta ${venta.code} descargada.`,
        isUser: false,
      });
    } catch (error) {
      console.error(error);
      this.messages.push({
        text: '❌ No se pudo generar la imagen.',
        isUser: false,
      });
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
              <tr>
                <td style="padding:8px; border-bottom:1px solid #e2e8f0;">${item.product.name}</td>
                <td style="padding:8px; border-bottom:1px solid #e2e8f0;">${item.quantity}</td>
                <td style="padding:8px; border-bottom:1px solid #e2e8f0;">S/ ${Number(item.unitPrice).toFixed(2)}</td>
                <td style="padding:8px; border-bottom:1px solid #e2e8f0;">S/ ${Number(item.lineTotal).toFixed(2)}</td>
              </tr>
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

  private scrollToBottom() {
    if (this.chatContent) {
      this.chatContent.nativeElement.scrollTop =
        this.chatContent.nativeElement.scrollHeight;
    }
  }

  closeModal() {
    this.modalCtrl.dismiss();
  }
}
