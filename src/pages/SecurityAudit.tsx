
/**
 * Security audit page
 */

import { SecurityAuditDashboard } from '@/components/security/SecurityAuditDashboard';
import Navigation from '@/components/Navigation';

const SecurityAudit = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Security Audit</h1>
            <p className="mt-2 text-gray-600">
              Monitor and manage your application's security posture
            </p>
          </div>
          
          <SecurityAuditDashboard />
        </div>
      </div>
    </div>
  );
};

export default SecurityAudit;
