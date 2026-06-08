import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule, ToastController } from '@ionic/angular';
import { NotificationsModalComponent } from './notifications-modal.component';
import {
  NotificationService,
  Notification,
} from '../../core/services/notification.service';
import { of } from 'rxjs';

describe('NotificationsModalComponent', () => {
  let component: NotificationsModalComponent;
  let fixture: ComponentFixture<NotificationsModalComponent>;
  let mockNotificationService: jasmine.SpyObj<NotificationService>;
  let mockToastCtrl: jasmine.SpyObj<ToastController>;

  const mockNotifications: Notification[] = [
    {
      id: 1,
      type: 'producto_creado',
      title: 'Nuevo producto',
      message: 'Se creó un nuevo producto',
      isRead: false,
      createdAt: new Date().toISOString(),
      data: {},
    },
    {
      id: 2,
      type: 'usuario_creado',
      title: 'Nuevo usuario',
      message: 'Se creó un nuevo usuario',
      isRead: true,
      createdAt: new Date().toISOString(),
      data: {},
    },
  ];

  beforeEach(waitForAsync(() => {
    mockNotificationService = jasmine.createSpyObj(
      'NotificationService',
      [
        'cargarNotificaciones',
        'marcarComoLeida',
        'marcarTodasComoLeidas',
        'eliminarNotificacion',
        'eliminarNotificaciones',
        'eliminarTodas',
      ],
      {
        notifications$: of(mockNotifications),
      },
    );

    mockToastCtrl = jasmine.createSpyObj('ToastController', ['create']);

    TestBed.configureTestingModule({
      declarations: [NotificationsModalComponent],
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: ToastController, useValue: mockToastCtrl },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationsModalComponent);
    component = fixture.componentInstance;
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should open modal', () => {
    component.open();
    expect(component.isOpen).toBe(true);
  });

  it('should close modal', () => {
    component.close();
    expect(component.isOpen).toBe(false);
  });

  it('should load notifications on init', () => {
    component.ngOnInit();
    expect(mockNotificationService.cargarNotificaciones).toHaveBeenCalled();
  });

  it('should display list of notifications', () => {
    component.notifications = mockNotifications;
    fixture.detectChanges();

    const items = fixture.nativeElement.querySelectorAll('ion-item');
    expect(items.length).toBe(2);
  });

  it('should mark notification as read', async () => {
    mockNotificationService.marcarComoLeida.and.returnValue(Promise.resolve());

    await component.marcarComoLeida(mockNotifications[0]);

    expect(mockNotificationService.marcarComoLeida).toHaveBeenCalledWith(1);
  });

  it('should delete single notification', async () => {
    mockNotificationService.eliminarNotificacion.and.returnValue(
      Promise.resolve(),
    );

    await component.eliminarUna(mockNotifications[0]);

    expect(mockNotificationService.eliminarNotificacion).toHaveBeenCalledWith(
      1,
    );
  });

  it('should toggle notification selection', () => {
    component.toggleSeleccion(mockNotifications[0]);
    expect(component.selectedIds.has(1)).toBe(true);

    component.toggleSeleccion(mockNotifications[0]);
    expect(component.selectedIds.has(1)).toBe(false);
  });

  it('should mark all notifications as read', async () => {
    mockNotificationService.marcarTodasComoLeidas.and.returnValue(
      Promise.resolve(),
    );

    await component.marcarTodasLeidas();

    expect(mockNotificationService.marcarTodasComoLeidas).toHaveBeenCalled();
  });

  it('should delete selected notifications', async () => {
    component.selectedIds.add(1);
    component.selectedIds.add(2);

    mockNotificationService.eliminarNotificaciones.and.returnValue(
      Promise.resolve(),
    );

    await component.eliminarSeleccionadas();

    expect(mockNotificationService.eliminarNotificaciones).toHaveBeenCalledWith(
      [1, 2],
    );
  });

  it('should delete all notifications', async () => {
    mockNotificationService.eliminarTodas.and.returnValue(Promise.resolve());

    await component.eliminarTodas();

    expect(mockNotificationService.eliminarTodas).toHaveBeenCalled();
  });

  it('should return correct icon for producto_creado', () => {
    const icon = component.getNotificationIcon('producto_creado');
    expect(icon).toBe('cube-outline');
  });

  it('should return correct icon for usuario_creado', () => {
    const icon = component.getNotificationIcon('usuario_creado');
    expect(icon).toBe('person-add-outline');
  });

  it('should return correct icon for venta_registrada', () => {
    const icon = component.getNotificationIcon('venta_registrada');
    expect(icon).toBe('cart-outline');
  });

  it('should return default icon for unknown type', () => {
    const icon = component.getNotificationIcon('unknown_type');
    expect(icon).toBe('notifications-outline');
  });

  it('should show toast notification on action', async () => {
    const mockToast = jasmine.createSpyObj('HTMLIonToastElement', ['present']);
    mockToastCtrl.create.and.returnValue(Promise.resolve(mockToast));

    component.mostrarMensaje('Test message', 'success');

    expect(mockToastCtrl.create).toHaveBeenCalled();
  });

  it('should display empty state when no notifications', () => {
    component.notifications = [];
    fixture.detectChanges();

    const emptyLabel = fixture.nativeElement.querySelector('ion-label');
    expect(emptyLabel?.textContent).toContain('No hay notificaciones');
  });
});
