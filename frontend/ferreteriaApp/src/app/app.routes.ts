import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'auth/login',
    loadComponent: () =>
      import('./auth/pages/login/login.page').then((m) => m.LoginPage),
  },

  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shell/app-shell.component').then((m) => m.AppShellComponent),
    children: [
      {
        path: 'dashboard',
        data: { title: 'Dashboard', subtitle: 'Ferretería July' },
        loadComponent: () =>
          import('./dashboard/pages/dashboard.page').then(
            (m) => m.DashboardPage,
          ),
      },
      {
        path: 'productos',
        data: { title: 'Productos', subtitle: 'Gestión de catálogo' },
        loadComponent: () =>
          import('./productos/pages/productos.page').then(
            (m) => m.ProductosPage,
          ),
      },
      {
        path: 'ventas',
        data: { title: 'Ventas', subtitle: 'Operaciones comerciales' },
        loadComponent: () =>
          import('./ventas/pages/ventas.page').then((m) => m.VentasPage),
      },
      {
        path: 'inventario',
        data: { title: 'Inventario', subtitle: 'Control de stock' },
        loadComponent: () =>
          import('./inventario/pages/inventario.page').then(
            (m) => m.InventarioPage,
          ),
      },
      {
        path: 'usuarios',
        data: { title: 'Usuarios', subtitle: 'Administración de personal' },
        loadComponent: () =>
          import('./usuarios/pages/usuarios.page').then((m) => m.UsuariosPage),
      },
      {
        path: 'reportes',
        data: { title: 'Reportes', subtitle: 'Análisis y métricas' },
        loadComponent: () =>
          import('./reportes/pages/reportes.page').then((m) => m.ReportesPage),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
      },
    ],
  },

  {
    path: '',
    redirectTo: 'app/dashboard',
    pathMatch: 'full',
  },

  {
    path: '**',
    redirectTo: 'auth/login',
  },
];
