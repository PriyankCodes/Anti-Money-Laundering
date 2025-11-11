# AML Frontend - Quick Reference Cheat Sheet

## 🚀 Quick Start Commands

```bash
# Install dependencies
npm install

# Start development server
npm start
# or
ng serve

# Build for production
npm run build
# or
ng build --configuration production

# Run tests
npm test
```

---

## 📁 Project Structure (Quick View)

```
src/app/
├── core/           # Services, guards, interceptors, models
├── features/       # Admin, Auth, Compliance, Customer
├── shared/         # Reusable components (Toast, Dialog)
├── app.ts          # Root component
├── app.config.ts   # App configuration
└── app.routes.ts   # All routes
```

---

## 🔑 Key Files & Their Purpose

| File | Purpose |
|------|---------|
| `app.config.ts` | Application providers, interceptors, icons |
| `app.routes.ts` | All route definitions with guards |
| `auth.guard.ts` | Protects authenticated routes |
| `role.guard.ts` | Enforces role-based access |
| `cors.interceptor.ts` | Adds JWT token to requests |
| `auth.service.ts` | Authentication logic |
| `compliance.service.ts` | Compliance operations |
| `environment.ts` | API URL and config |

---

## 🛣️ Route Structure

```typescript
// Public Routes
/auth/login              → Login page
/auth/register           → Registration
/auth/verify-otp         → OTP verification
/auth/forgot-password    → Password recovery
/auth/reset-password     → Reset password

// Admin Routes (ADMIN role)
/admin/dashboard         → Admin dashboard
/admin/users             → User management
/admin/rules             → Rule configuration
/admin/keywords          → Keyword management
/admin/countries         → Country risk settings
/admin/reports           → Analytics & reports
/admin/audit-logs        → System audit logs
/admin/kyc-review        → KYC approval

// Compliance Routes (COMPLIANCE_OFFICER role)
/compliance/dashboard    → Compliance dashboard
/compliance/alerts       → Alert investigation
/compliance/sar          → SAR generation
/compliance/transactions → Transaction review
/compliance/tickets      → Support tickets
/compliance/customer-alert-history → Customer history

// Customer Routes (CUSTOMER role)
/customer/dashboard      → Customer dashboard
/customer/accounts       → Account overview
/customer/transactions   → Transaction history
/customer/alerts         → Customer alerts
/customer/kyc            → KYC submission
/customer/profile        → Profile management
```

---

## 🔐 Authentication Quick Reference

### Login Flow
```typescript
1. User enters credentials
2. POST /api/auth/login
3. Store token in localStorage
4. Redirect based on role
```

### Token Storage
```typescript
localStorage.setItem('token', token);
localStorage.setItem('email', email);
localStorage.setItem('userId', userId);
localStorage.setItem('role', role);
```

### Token Retrieval
```typescript
const token = localStorage.getItem('token');
```

### Logout
```typescript
localStorage.clear();
router.navigate(['/auth/login']);
```

---

## 🛡️ Guards Usage

### AuthGuard
```typescript
// Checks if user is authenticated
canActivate(): boolean {
  if (!token || isExpired(token)) {
    redirect to login
    return false;
  }
  return true;
}
```

### RoleGuard
```typescript
// Checks if user has required role
canActivate(route): boolean {
  const userRole = getUserRoleFromToken();
  const requiredRoles = route.data['roles'];
  
  if (!hasRole(userRole, requiredRoles)) {
    redirect to appropriate dashboard
    return false;
  }
  return true;
}
```

### Route Configuration
```typescript
{
  path: 'admin',
  canActivate: [AuthGuard, RoleGuard],
  data: { roles: ['ADMIN'] }
}
```

---

## 🌐 API Endpoints Quick Reference

### Authentication
```
POST   /api/auth/login              - Login
POST   /api/auth/register           - Register
POST   /api/auth/verify-otp         - Verify OTP
POST   /api/auth/resend-otp         - Resend OTP
POST   /api/auth/forgot-password    - Forgot password
POST   /api/auth/reset-password     - Reset password
POST   /api/auth/change-password    - Change password
```

### Admin
```
GET    /api/admin/dashboard/stats   - Dashboard statistics
GET    /api/admin/users             - Get all users
POST   /api/admin/users             - Create user
PUT    /api/admin/users/{id}        - Update user
DELETE /api/admin/users/{id}        - Delete user
GET    /api/admin/rules             - Get all rules
POST   /api/admin/rules             - Create rule
PUT    /api/admin/rules/{id}        - Update rule
DELETE /api/admin/rules/{id}        - Delete rule
GET    /api/admin/keywords          - Get keywords
POST   /api/admin/keywords          - Create keyword
DELETE /api/admin/keywords/{id}     - Delete keyword
GET    /api/admin/countries         - Get countries
POST   /api/admin/countries         - Create country
PUT    /api/admin/countries/{id}    - Update country
DELETE /api/admin/countries/{id}    - Delete country
GET    /api/admin/audit-logs        - Get audit logs
GET    /api/admin/kyc/pending       - Get pending KYC
PUT    /api/admin/kyc/{id}/approve  - Approve KYC
PUT    /api/admin/kyc/{id}/reject   - Reject KYC
```

### Compliance
```
GET    /api/compliance/alerts                    - Get all alerts
GET    /api/compliance/alerts/{id}               - Get alert details
GET    /api/compliance/alerts/status/{status}    - Get alerts by status
PUT    /api/compliance/alerts/{id}/investigate   - Investigate alert
POST   /api/compliance/sar                       - Create SAR
GET    /api/compliance/sar                       - Get all SARs
GET    /api/compliance/sar/{id}                  - Get SAR details
GET    /api/compliance/transactions              - Get transactions
GET    /api/compliance/tickets                   - Get tickets
POST   /api/compliance/tickets                   - Create ticket
PUT    /api/compliance/tickets/{id}              - Update ticket
```

### Customer
```
GET    /api/customer/dashboard/stats    - Dashboard stats
GET    /api/customer/accounts           - Get accounts
GET    /api/customer/transactions       - Get transactions
GET    /api/customer/alerts             - Get alerts
GET    /api/customer/kyc                - Get KYC status
POST   /api/customer/kyc/upload         - Upload KYC documents
GET    /api/customer/profile            - Get profile
PUT    /api/customer/profile            - Update profile
```

---

## 🎨 UI Components Quick Reference

### Toast Notifications
```typescript
// Import
import { ToastService } from '@core/services/toast.service';

// Inject
constructor(private toastService: ToastService) {}

// Usage
this.toastService.success('Operation successful!');
this.toastService.error('Operation failed!');
this.toastService.warning('Please review this action');
this.toastService.info('New update available');
```

### Confirmation Dialog
```typescript
// Import
import { ConfirmationDialogService } from '@core/services/confirmation-dialog.service';

// Inject
constructor(private confirmationService: ConfirmationDialogService) {}

// Usage
this.confirmationService.confirm({
  title: 'Delete User',
  message: 'Are you sure you want to delete this user?',
  confirmText: 'Delete',
  cancelText: 'Cancel',
  type: 'danger'  // 'danger', 'warning', 'info'
}).subscribe(confirmed => {
  if (confirmed) {
    // User clicked "Delete"
    this.deleteUser();
  }
});
```

---

## 📦 Service Usage Patterns

### Creating a Service Call
```typescript
// In service
getData(): Observable<DataType[]> {
  return this.http.get<DataType[]>(`${this.apiUrl}/endpoint`, {
    headers: this.getHeaders()
  });
}

// In component
ngOnInit(): void {
  this.service.getData().subscribe({
    next: (data) => {
      this.data = data;
      this.loading = false;
    },
    error: (error) => {
      console.error('Error:', error);
      this.toastService.error('Failed to load data');
      this.loading = false;
    }
  });
}
```

### POST Request
```typescript
// In service
createItem(item: Item): Observable<Item> {
  return this.http.post<Item>(`${this.apiUrl}/items`, item, {
    headers: this.getHeaders()
  });
}

// In component
createItem(): void {
  this.service.createItem(this.newItem).subscribe({
    next: (created) => {
      this.toastService.success('Item created successfully!');
      this.items.push(created);
    },
    error: (error) => {
      this.toastService.error('Failed to create item');
    }
  });
}
```

### PUT Request
```typescript
// In service
updateItem(id: number, item: Item): Observable<Item> {
  return this.http.put<Item>(`${this.apiUrl}/items/${id}`, item, {
    headers: this.getHeaders()
  });
}

// In component
updateItem(): void {
  this.service.updateItem(this.item.id, this.item).subscribe({
    next: (updated) => {
      this.toastService.success('Item updated successfully!');
      this.item = updated;
    },
    error: (error) => {
      this.toastService.error('Failed to update item');
    }
  });
}
```

### DELETE Request
```typescript
// In service
deleteItem(id: number): Observable<void> {
  return this.http.delete<void>(`${this.apiUrl}/items/${id}`, {
    headers: this.getHeaders()
  });
}

// In component
deleteItem(id: number): void {
  this.confirmationService.confirm({
    title: 'Delete Item',
    message: 'Are you sure?',
    type: 'danger'
  }).subscribe(confirmed => {
    if (confirmed) {
      this.service.deleteItem(id).subscribe({
        next: () => {
          this.toastService.success('Item deleted successfully!');
          this.items = this.items.filter(item => item.id !== id);
        },
        error: (error) => {
          this.toastService.error('Failed to delete item');
        }
      });
    }
  });
}
```

---

## 🎯 Common Patterns

### Component Structure
```typescript
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './example.html',
  styleUrl: './example.css'
})
export class ExampleComponent implements OnInit {
  // Properties
  data: any[] = [];
  loading = false;
  
  // Constructor - Inject services
  constructor(
    private service: ExampleService,
    private toastService: ToastService
  ) {}
  
  // Lifecycle hook
  ngOnInit(): void {
    this.loadData();
  }
  
  // Methods
  loadData(): void {
    this.loading = true;
    this.service.getData().subscribe({
      next: (data) => {
        this.data = data;
        this.loading = false;
      },
      error: (error) => {
        this.toastService.error('Failed to load data');
        this.loading = false;
      }
    });
  }
}
```

### Template Patterns
```html
<!-- Loading State -->
<div *ngIf="loading">Loading...</div>

<!-- Data Display -->
<div *ngIf="!loading && data.length > 0">
  <div *ngFor="let item of data">
    {{ item.name }}
  </div>
</div>

<!-- Empty State -->
<div *ngIf="!loading && data.length === 0">
  No data available
</div>

<!-- Two-way Binding -->
<input [(ngModel)]="user.name" name="name">

<!-- Event Binding -->
<button (click)="save()">Save</button>

<!-- Property Binding -->
<img [src]="imageUrl" [alt]="imageAlt">

<!-- Class Binding -->
<div [class.active]="isActive">Content</div>

<!-- Style Binding -->
<div [style.color]="textColor">Text</div>

<!-- ngFor with trackBy -->
<div *ngFor="let item of items; trackBy: trackById">
  {{ item.name }}
</div>

<!-- ngSwitch -->
<div [ngSwitch]="status">
  <div *ngSwitchCase="'PENDING'">Pending</div>
  <div *ngSwitchCase="'APPROVED'">Approved</div>
  <div *ngSwitchDefault>Unknown</div>
</div>
```

---

## 🔧 TypeScript Interfaces

### Common Interfaces
```typescript
// User
interface User {
  userId: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: string;
}

// Alert
interface Alert {
  alertId: number;
  transactionId: number;
  customerId: number;
  customerName: string;
  ruleTriggered: string;
  riskScore: number;
  status: string;
  createdAt: string;
}

// Transaction
interface Transaction {
  transactionId: number;
  customerId: number;
  amount: number;
  currency: string;
  transactionType: string;
  status: string;
  timestamp: string;
}

// SAR
interface SAR {
  sarId: number;
  alertId: number;
  officerId: number;
  summary: string;
  status: string;
  createdAt: string;
}

// Rule
interface Rule {
  ruleId: number;
  ruleName: string;
  ruleType: string;
  threshold: number;
  isActive: boolean;
}
```

---

## 🎨 CSS Classes (Bootstrap 5)

### Layout
```css
.container          /* Fixed width container */
.container-fluid    /* Full width container */
.row                /* Flex row */
.col-*              /* Column (1-12) */
```

### Buttons
```css
.btn                /* Base button */
.btn-primary        /* Blue button */
.btn-success        /* Green button */
.btn-danger         /* Red button */
.btn-warning        /* Yellow button */
.btn-info           /* Cyan button */
.btn-sm             /* Small button */
.btn-lg             /* Large button */
```

### Cards
```css
.card               /* Card container */
.card-header        /* Card header */
.card-body          /* Card body */
.card-footer        /* Card footer */
```

### Forms
```css
.form-control       /* Input field */
.form-label         /* Label */
.form-select        /* Select dropdown */
.form-check         /* Checkbox/radio */
```

### Utilities
```css
.d-flex             /* Display flex */
.justify-content-between  /* Space between */
.align-items-center /* Vertical center */
.text-center        /* Center text */
.mt-3               /* Margin top 3 */
.mb-3               /* Margin bottom 3 */
.p-3                /* Padding 3 */
```

---

## 🐛 Debugging Tips

### Console Logging
```typescript
// Log in service
console.log('API Response:', response);

// Log in guard
console.log('AuthGuard: Token:', token);

// Log in interceptor
console.log('Request URL:', req.url);
```

### Browser DevTools
```
F12 → Network tab → Check API calls
F12 → Console tab → Check errors
F12 → Application → LocalStorage → Check stored data
```

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| 401 Unauthorized | Check token in localStorage, verify not expired |
| 403 Forbidden | Check user role, verify route permissions |
| CORS Error | Ensure backend allows origin, check interceptor |
| Token expired | Logout and login again |
| Route not loading | Check guards, verify role matches |
| API not responding | Check backend is running, verify API URL |

---

## 📝 Environment Variables

```typescript
// environment.ts (Development)
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api'
};

// environment.prod.ts (Production)
export const environment = {
  production: true,
  apiUrl: 'https://api.production.com/api'
};
```

---

## 🚀 Deployment Checklist

```
□ Run production build: ng build --configuration production
□ Check dist/ folder created
□ Verify bundle size < 1MB
□ Test all routes work
□ Test authentication flow
□ Test role-based access
□ Configure web server (Nginx/Apache)
□ Set up routing: All routes → index.html
□ Update environment.prod.ts with production API URL
□ Enable HTTPS
□ Configure CORS on backend
□ Test in production environment
```

---

## 🎓 Key Concepts Summary

| Concept | Description |
|---------|-------------|
| **Standalone Components** | No NgModules, direct imports |
| **Lazy Loading** | Load routes on-demand |
| **Dependency Injection** | Services injected, not instantiated |
| **Guards** | Protect routes (Auth, Role) |
| **Interceptors** | Intercept HTTP requests/responses |
| **Observables** | Async data streams (RxJS) |
| **JWT** | JSON Web Token for authentication |
| **RBAC** | Role-Based Access Control |
| **SPA** | Single Page Application |
| **Reactive Forms** | Form validation and handling |

---

## 📚 Useful Commands

```bash
# Generate component
ng generate component features/example/example

# Generate service
ng generate service core/services/example

# Generate guard
ng generate guard core/guards/example

# Generate interface
ng generate interface core/models/example

# Lint code
ng lint

# Format code
npm run format

# Check bundle size
ng build --stats-json
```

---

## 🔗 Quick Links

- **Angular Docs**: https://angular.dev
- **RxJS Docs**: https://rxjs.dev
- **Bootstrap Docs**: https://getbootstrap.com
- **TypeScript Docs**: https://www.typescriptlang.org

---

## 💡 Pro Tips

1. **Always unsubscribe** from Observables to prevent memory leaks
2. **Use async pipe** in templates for automatic subscription management
3. **Keep components small** - Extract logic to services
4. **Use TypeScript interfaces** for type safety
5. **Handle errors gracefully** - Show user-friendly messages
6. **Test in multiple browsers** - Chrome, Firefox, Safari
7. **Use console.log** strategically for debugging
8. **Keep services stateless** when possible
9. **Use guards** for route protection
10. **Follow Angular style guide** for consistency

---

**Quick Reference Version: 1.0**
**Last Updated: 2024**

---

**Print this cheat sheet for quick access during development! 📄**
