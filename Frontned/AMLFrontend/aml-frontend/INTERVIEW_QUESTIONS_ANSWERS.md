# AML Frontend - Interview Questions & Answers

## 📋 Complete Interview Preparation Guide

This document contains detailed answers to common interview questions about your AML Frontend application.

---

## 🎯 Project Overview Questions

### Q1: What is this application and what problem does it solve?

**Answer:**
This is an **Anti-Money Laundering (AML) Compliance Management System** for financial institutions. It helps banks:
- Detect suspicious transactions automatically
- Investigate alerts and generate SARs (Suspicious Activity Reports)
- Manage customer KYC (Know Your Customer) verification
- Assess risk scores for customers and transactions
- Comply with financial regulations (BSA, PATRIOT Act)

**Tech Stack:** Angular 20, TypeScript, Bootstrap 5, RxJS, JWT authentication

---

### Q2: Explain the three user roles in your application.

**Answer:**

**1. ADMIN** - System configuration and management
- Manage users, rules, keywords, countries
- Approve KYC documents
- View audit logs and generate reports

**2. COMPLIANCE_OFFICER** - Investigation and reporting
- Investigate alerts
- Generate SARs
- Review transactions
- Manage support tickets

**3. CUSTOMER** - Self-service banking
- View dashboard and transactions
- Submit KYC documents
- Check alerts
- Update profile

**Implementation:** Role-based access via RoleGuard, JWT token validation, and backend API checks.

---

### Q3: Walk through the SAR generation process.

**Answer:**

**Flow:**
1. Alert triggered by rule engine
2. Compliance officer investigates
3. Navigate to `/compliance/sar?alertId=123`
4. System auto-populates: customer, transaction, alert, officer details
5. Officer fills investigation notes (only editable field)
6. Officer checks declaration
7. Submit SAR → POST `/api/compliance/sar`
8. Status: SUBMITTED
9. SAR sent to regulatory authority

**Key Features:** 90% auto-populated, PDF export, status tracking, audit trail

---

## 🔧 Angular Framework Questions

### Q4: Why standalone components instead of NgModules?

**Answer:**

**Benefits:**
- Simpler architecture (no module declarations)
- Better tree-shaking (smaller bundles)
- Easier lazy loading
- Modern Angular best practice
- Reduced boilerplate

**Example:**
```typescript
@Component({
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './example.html'
})
```

---

### Q5: How do you handle state management?

**Answer:**

**Three-layer approach:**

1. **LocalStorage** - Persistent state (token, userId, role)
2. **BehaviorSubject** - Reactive state in services
3. **Service-based** - Feature-specific state

**Why no NgRx?** Simple app, easier maintenance, smaller bundle size

---

### Q6: Explain your lazy loading strategy.

**Answer:**

**Feature-based lazy loading:**
```typescript
{
  path: 'admin',
  loadComponent: () => import('./admin/dashboard')
    .then(m => m.Dashboard)
}
```

**Benefits:**
- 70% reduction in initial bundle
- Faster load time
- Better performance
- Code splitting by feature

---

## 🔒 Security Questions

### Q7: How does JWT authentication work?

**Answer:**

**Flow:**
1. User logs in → Backend returns JWT token
2. Token stored in localStorage
3. AuthInterceptor adds token to all requests
4. AuthGuard validates token on route changes
5. Token expires → Auto-logout

**Token Structure:**
```json
{
  "userId": 123,
  "email": "user@example.com",
  "role": "ADMIN",
  "exp": 1234567890
}
```

**Security:** Token expiration check (5-min buffer), signature validation, role-based access

---

### Q8: How do HTTP Interceptors work?

**Answer:**

**AuthInterceptor:**
- Intercepts all HTTP requests
- Adds Authorization header automatically
- Handles 401 (logout) and 403 (permission denied) errors
- Centralized error handling

**Benefits:** No manual headers, consistent auth, global error handling

---

### Q9: Explain Role-Based Access Control.

**Answer:**

**Three levels:**

1. **Route-level** - RoleGuard checks role before navigation
2. **Component-level** - Conditional rendering based on role
3. **API-level** - Backend validates role on requests

**Implementation:**
```typescript
{
  path: 'admin',
  canActivate: [AuthGuard, RoleGuard],
  data: { roles: ['ADMIN'] }
}
```

---

## 🏗️ Architecture Questions

### Q10: Describe your folder structure.

**Answer:**

```
src/app/
├── core/           # Services, guards, interceptors
├── features/       # Admin, Auth, Compliance, Customer
├── shared/         # Reusable components
├── app.config.ts   # App configuration
└── app.routes.ts   # Route definitions
```

**Pattern:** Feature-based modular architecture

---

### Q11: How do components communicate?

**Answer:**

**Three patterns:**

1. **@Input/@Output** - Parent-child communication
2. **Service-based** - Sibling communication via BehaviorSubject
3. **Route parameters** - Pass data via URL

**Example:** Toast service broadcasts to toast component

---

### Q12: Explain your service architecture.

**Answer:**

**Layered approach:**
- **Presentation Layer** - Components
- **Business Logic Layer** - Services
- **Data Access Layer** - HttpClient
- **Backend API** - REST endpoints

**Dependency Injection:** Services injected via constructor, singleton pattern (`providedIn: 'root'`)

---

## 🚀 Performance Questions

### Q13: What performance optimizations did you implement?

**Answer:**

1. **Lazy loading** - Load routes on-demand
2. **Tree shaking** - Remove unused code
3. **Bundle budgets** - Monitor size (max 1MB)
4. **OnPush change detection** - Reduce cycles
5. **TrackBy in ngFor** - Efficient rendering
6. **Async pipe** - Auto-unsubscribe

**Result:** Initial load < 3 seconds, bundle < 500KB

---

### Q14: How do you prevent memory leaks?

**Answer:**

**Strategies:**
1. Unsubscribe in `ngOnDestroy()`
2. Use `async` pipe (auto-unsubscribe)
3. Use `takeUntil()` operator
4. Avoid global event listeners without cleanup

**Example:**
```typescript
ngOnDestroy(): void {
  this.subscription.unsubscribe();
}
```

---

## 🐛 Troubleshooting Questions

### Q15: How do you debug authentication issues?

**Answer:**

**Steps:**
1. Check token in localStorage (F12 → Application)
2. Verify token not expired
3. Check AuthGuard logs in console
4. Verify backend API is running
5. Check network tab for 401/403 errors

**Common issues:**
- Token expired → Logout and login
- Wrong role → Check RoleGuard
- CORS error → Backend configuration

---

### Q16: How do you handle API errors?

**Answer:**

**Centralized error handling:**
- AuthInterceptor catches HTTP errors
- 401 → Auto-logout and redirect
- 403 → Show permission error
- 500 → Show server error toast

**Component-level:**
```typescript
.subscribe({
  error: (error) => {
    this.toastService.error('Operation failed');
  }
});
```

---

## 💡 Best Practices

### Q17: What coding standards do you follow?

**Answer:**

1. **TypeScript** - Strong typing, interfaces
2. **Angular Style Guide** - Naming conventions
3. **DRY principle** - Reusable components/services
4. **SOLID principles** - Single responsibility
5. **Error handling** - Try-catch, Observable error handling
6. **Documentation** - Comments, README files

---

### Q18: How do you ensure code quality?

**Answer:**

1. **Type safety** - TypeScript interfaces
2. **Linting** - ESLint rules
3. **Code review** - Peer review process
4. **Testing** - Unit tests (Jasmine/Karma)
5. **Bundle analysis** - Monitor size
6. **Performance monitoring** - Lighthouse audits

---

## 🎓 Key Takeaways

**Architecture:** Standalone components, lazy loading, feature-based structure
**Security:** JWT auth, route guards, HTTP interceptors, RBAC
**State:** LocalStorage + BehaviorSubject + Services
**Performance:** Lazy loading, tree shaking, bundle optimization
**UX:** Toast notifications, confirmation dialogs, loading states

---

**Good luck with your interview! 🚀**
