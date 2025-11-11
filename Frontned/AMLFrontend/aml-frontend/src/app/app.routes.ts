import { Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';
import { Layout } from './features/admin/layout/layout';
import { Country } from './features/admin/country/country';
import { AuditLogsComponent } from './features/admin/audit-logs/audit-logs';
import { Rules } from './features/admin/rules/rules';
import { Users } from './features/admin/users/users';
import { KycReview } from './features/admin/kyc-review/kyc-review';
import { Keywords } from './features/admin/keywords/keywords';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/auth/login',
    pathMatch: 'full'
  },
  {
    path: 'auth/login',
    loadComponent: () => import('./features/auth/login/login').then(m => m.Login)
  },
  {
    path: 'auth/register',
    loadComponent: () => import('./features/auth/register/register').then(m => m.RegisterComponent)
  },
  {
    path: 'auth/verify-otp',
    loadComponent: () => import('./features/auth/verify-otp/verify-otp').then(m => m.VerifyOtp)
  },
  {
    path: 'auth/forgot-password',
    loadComponent: () => import('./features/auth/forgot-password/forgot-password').then(m => m.ForgotPassword)
  },
  {
    path: 'auth/reset-password',
    loadComponent: () => import('./features/auth/reset-password/reset-password').then(m => m.ResetPassword)
  },
  {
    path: 'customer',
    loadComponent: () => import('./features/customer/layout/customer-layout').then(m => m.CustomerLayout),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['CUSTOMER'] },
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/customer/dashboard/dashboard').then(m => m.Dashboard)
      },
      {
        path: 'accounts',
        loadComponent: () => import('./features/customer/account/account').then(m => m.Account)
      },
      {
        path: 'transactions',
        loadComponent: () => import('./features/customer/transactions/transactions').then(m => m.Transactions)
      },
      {
        path: 'alerts',
        loadComponent: () => import('./features/customer/alerts/alerts').then(m => m.Alerts)
      },
      {
        path: 'kyc',
        loadComponent: () => import('./features/customer/kyc/kyc').then(m => m.Kyc)
      },
      {
        path: 'profile',
        loadComponent: () => import('./features/customer/profile/profile').then(m => m.Profile)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: 'dashboard',
    redirectTo: '/customer/dashboard',
    pathMatch: 'full'
  },
  {
    path: 'admin',
    component: Layout,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['ADMIN'] },
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/admin/dashboard/dashboard').then(m => m.Dashboard) },
      { path: 'countries', component: Country },
      { path: 'audit-logs', component: AuditLogsComponent },
      { path: 'rules', component: Rules },
      { path: 'users', component: Users },
      { path: 'reports', loadComponent: () => import('./features/admin/reports/reports').then(m => m.Reports) },
      { path: 'kyc-review', component: KycReview },
      { path: 'keywords', component: Keywords },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  {
    path: 'compliance',
    loadComponent: () => import('./features/compliance/layout/compliance-layout').then(m => m.ComplianceLayout),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['COMPLIANCE_OFFICER', 'ADMIN'] },
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/compliance/dashboard/dashboard').then(m => m.Dashboard)
      },
      {
        path: 'alerts',
        loadComponent: () => import('./features/compliance/alerts/alerts').then(m => m.Alerts)
      },
      {
        path: 'alerts/:id',
        loadComponent: () => import('./features/compliance/alerts/alerts').then(m => m.Alerts)
      },
      {
        path: 'transactions',
        loadComponent: () => import('./features/compliance/transactions/transactions').then(m => m.Transactions)
      },
      {
        path: 'sar',
        loadComponent: () => import('./features/compliance/sar/sar').then(m => m.Sar)
      },
      {
        path: 'tickets',
        loadComponent: () => import('./features/compliance/tickets/tickets').then(m => m.Tickets)
      },
      {
        path: 'customer-alert-history',
        loadComponent: () => import('./features/compliance/customer-alert-history/customer-alert-history').then(m => m.CustomerAlertHistory)
      },
      {
        path: 'customer-alert-history/:customerId',
        loadComponent: () => import('./features/compliance/customer-alert-history/customer-alert-history').then(m => m.CustomerAlertHistory)
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '**',
    redirectTo: '/auth/login'
  }
];
