import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { IonCard, IonCardContent, IonContent, IonText } from '@ionic/angular/standalone';

@Component({
  selector: 'app-usuarios-page',
  standalone: true,
  templateUrl: './usuarios.page.html',
  styleUrls: ['./usuarios.page.scss'],
  imports: [CommonModule, IonContent, IonCard, IonCardContent, IonText],
})
export class UsuariosPage {}
