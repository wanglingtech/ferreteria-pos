import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule, MenuController } from '@ionic/angular';
import { SiderbarComponent } from './siderbar.component';
import { Router } from '@angular/router';

describe('SiderbarComponent', () => {
  let component: SiderbarComponent;
  let fixture: ComponentFixture<SiderbarComponent>;
  let mockMenuCtrl: jasmine.SpyObj<MenuController>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(waitForAsync(() => {
    mockMenuCtrl = jasmine.createSpyObj('MenuController', ['close']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      declarations: [SiderbarComponent],
      imports: [IonicModule.forRoot()],
      providers: [
        { provide: MenuController, useValue: mockMenuCtrl },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SiderbarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have menu items', () => {
    const menuItems = fixture.nativeElement.querySelectorAll('ion-item');
    expect(menuItems.length).toBeGreaterThan(0);
  });

  it('should close menu on item click', async () => {
    mockMenuCtrl.close.and.returnValue(Promise.resolve(true));

    if (component.navigateToDashboard) {
      await component.navigateToDashboard();
    }

    expect(mockMenuCtrl.close).toHaveBeenCalled();
  });

  it('should navigate on menu selection', async () => {
    mockMenuCtrl.close.and.returnValue(Promise.resolve(true));

    if (component.navigateToDashboard) {
      await component.navigateToDashboard();
      expect(mockRouter.navigate).toHaveBeenCalled();
    }
  });

  it('should display menu title', () => {
    fixture.detectChanges();
    const title = fixture.nativeElement.querySelector('ion-title');
    expect(title).toBeTruthy();
  });

  it('should have brand logo area', () => {
    fixture.detectChanges();
    const logoArea = fixture.nativeElement.querySelector('.menu-header');
    expect(logoArea).toBeTruthy();
  });
});
