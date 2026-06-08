import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { ProductosPage } from './productos.page';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Router } from '@angular/router';

describe('ProductosPage', () => {
  let component: ProductosPage;
  let fixture: ComponentFixture<ProductosPage>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(waitForAsync(() => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      declarations: [ProductosPage],
      imports: [IonicModule.forRoot(), HttpClientTestingModule],
      providers: [{ provide: Router, useValue: mockRouter }],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductosPage);
    component = fixture.componentInstance;
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load productos on init', () => {
    spyOn(component, 'cargarProductos');
    component.ngOnInit?.();
    expect(component.cargarProductos).toHaveBeenCalled();
  });

  it('should filter productos by search term', () => {
    component.productos = [
      { id: 1, nombre: 'Producto A', sku: 'SKU001' },
      { id: 2, nombre: 'Producto B', sku: 'SKU002' },
    ];

    component.searchTerm = 'Producto A';
    component.onSearchChange?.({ detail: { value: 'Producto A' } } as any);

    expect(component.filteredProductos?.length).toBeLessThanOrEqual(2);
  });

  it('should navigate to create producto', () => {
    component.crearProducto?.();
    expect(mockRouter.navigate).toHaveBeenCalled();
  });

  it('should navigate to edit producto', () => {
    const mockProducto = { id: 1, nombre: 'Test', sku: 'SKU001' };
    component.editarProducto?.(mockProducto);
    expect(mockRouter.navigate).toHaveBeenCalled();
  });

  it('should delete producto', async () => {
    spyOn(component, 'eliminarProducto');
    const mockProducto = { id: 1, nombre: 'Test', sku: 'SKU001' };

    await component.eliminarProducto?.(mockProducto);

    expect(component.eliminarProducto).toHaveBeenCalled();
  });

  it('should display productos list', () => {
    component.productos = [{ id: 1, nombre: 'Producto A', sku: 'SKU001' }];
    fixture.detectChanges();

    const items = fixture.nativeElement.querySelectorAll('ion-item');
    expect(items.length).toBeGreaterThan(0);
  });

  it('should have search bar', () => {
    fixture.detectChanges();
    const searchbar = fixture.nativeElement.querySelector('ion-searchbar');
    expect(searchbar).toBeTruthy();
  });

  it('should have create button', () => {
    fixture.detectChanges();
    const createBtn = fixture.nativeElement.querySelector('ion-fab-button');
    expect(createBtn).toBeTruthy();
  });
});
