
import React from 'react';
import { DailyXPManager } from "@/components/admin/DailyXPManager";
import ManualDailyRewardsButton from "@/components/admin/ManualDailyRewardsButton";
import TestDailyRewardsButton from "@/components/admin/TestDailyRewardsButton";
import UserManagement from "@/components/admin/UserManagement";
import RoleManager from "@/components/admin/RoleManager";
import AdminPermissionsInfo from "@/components/admin/AdminPermissionsInfo";
import { PageHeader } from "@/components/ui/page-header"
import CronJobManager from "@/components/admin/CronJobManager";
import DailyRewardsStatus from "@/components/admin/DailyRewardsStatus";

const AdminDashboard: React.FC = () => {
  return (
    <div className="container py-10">
      <PageHeader heading="Admin Dashboard" text="Manage application settings, users, and system configuration." />

      <div className="grid grid-cols-1 gap-6">
        
        {/* Role & User Management Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">User & Role Management</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RoleManager />
            <AdminPermissionsInfo />
          </div>
          <UserManagement />
        </div>

        {/* Daily Rewards Management Section */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Daily Rewards System</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <CronJobManager />
            <TestDailyRewardsButton />
            <ManualDailyRewardsButton />
          </div>
          
          {/* Status Dashboard */}
          <DailyRewardsStatus />
        </div>
        
        {/* Other Admin Features */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DailyXPManager />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
