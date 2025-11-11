import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean {
    console.log('=== RoleGuard: Checking role access ===');
    console.log('RoleGuard: Route:', route.routeConfig?.path);
    
    const token = this.authService.getToken();
    if (!token) {
      console.log('RoleGuard: ❌ No token found, redirecting to login');
      this.router.navigate(['/auth/login']);
      return false;
    }

    const userRole = this.authService.getUserRoleFromToken();
    const requiredRoles = route.data['roles'] as string[];
    
    console.log('RoleGuard: User role:', userRole);
    console.log('RoleGuard: Required roles:', requiredRoles);

    if (!requiredRoles || requiredRoles.length === 0) {
      // No specific roles required, just need to be authenticated
      console.log('RoleGuard: ✓ No specific roles required, access granted');
      return true;
    }

    if (!userRole) {
      console.log('RoleGuard: ❌ No role found anywhere, access denied');
      this.router.navigate(['/auth/login']);
      return false;
    }

    // Normalize roles for comparison (remove ROLE_ prefix, convert to uppercase)
    const normalizedUserRole = userRole.toUpperCase().replace('ROLE_', '').trim();
    console.log('RoleGuard: Normalized user role:', normalizedUserRole);

    // Check if user has any of the required roles
    const hasRequiredRole = requiredRoles.some(role => {
      const normalizedRequiredRole = role.toUpperCase().replace('ROLE_', '').trim();
      const exactMatch = normalizedUserRole === normalizedRequiredRole;
      const partialMatch = normalizedUserRole.includes(normalizedRequiredRole) || 
                          normalizedRequiredRole.includes(normalizedUserRole);
      const matches = exactMatch || partialMatch;
      
      console.log(`  Checking: "${normalizedUserRole}" vs "${normalizedRequiredRole}" = ${matches}`);
      return matches;
    });

    if (!hasRequiredRole) {
      console.log('RoleGuard: ❌ Insufficient permissions');
      console.log('  User has:', normalizedUserRole);
      console.log('  Needs one of:', requiredRoles);
      this.redirectBasedOnRole(userRole);
      return false;
    }

    console.log('RoleGuard: ✓ Access granted');
    return true;
  }

  private redirectBasedOnRole(role: string): void {
    const upperRole = role.toUpperCase();
    
    if (upperRole.includes('ADMIN')) {
      this.router.navigate(['/admin/dashboard']);
    } else if (upperRole.includes('COMPLIANCE') || upperRole.includes('OFFICER')) {
      this.router.navigate(['/compliance/dashboard']);
    } else if (upperRole.includes('CUSTOMER')) {
      this.router.navigate(['/customer/dashboard']);
    } else {
      this.router.navigate(['/auth/login']);
    }
  }
}
