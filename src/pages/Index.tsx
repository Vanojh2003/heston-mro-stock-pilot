
import React, { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Layout } from '@/components/Layout';
import { LoginPage } from '@/components/LoginPage';
import { MainDashboard } from '@/components/MainDashboard';
import { OilDashboard } from '@/components/OilDashboard';
import { OilStockIn } from '@/components/OilStockIn';
import { OilStockOut } from '@/components/OilStockOut';
import { OilManagement } from '@/components/OilManagement';
import { Management } from '@/components/Management';
import { PermissionChecker } from '@/components/PermissionChecker';

const Index = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  const handleBack = () => {
    switch (currentPage) {
      case 'oil-stock-in':
      case 'oil-stock-out':
      case 'oil-management':
        setCurrentPage('oil');
        break;
      case 'oil':
      case 'management':
        setCurrentPage('dashboard');
        break;
      default:
        setCurrentPage('dashboard');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center">
        <div className="text-center">
          <img 
            src="/lovable-uploads/379df369-5c63-40d6-aec7-84bdf8abf10a.png" 
            alt="HESTON MRO Logo" 
            className="w-16 h-16 mx-auto mb-4 animate-pulse"
          />
          <p className="text-lg text-gray-600 dark:text-gray-400">Loading HESTON MRO...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'oil':
        return (
          <PermissionChecker requiredPermission="oil_stock_in" onBack={handleBack} pageName="Oil Dashboard">
            <OilDashboard onNavigate={handleNavigate} onBack={handleBack} />
          </PermissionChecker>
        );
      case 'oil-stock-in':
        return (
          <PermissionChecker requiredPermission="oil_stock_in" onBack={handleBack} pageName="Oil Stock In">
            <OilStockIn onBack={handleBack} />
          </PermissionChecker>
        );
      case 'oil-stock-out':
        return (
          <PermissionChecker requiredPermission="oil_stock_out" onBack={handleBack} pageName="Oil Stock Out">
            <OilStockOut onBack={handleBack} />
          </PermissionChecker>
        );
      case 'oil-management':
        return (
          <PermissionChecker requiredPermission="oil_management" onBack={handleBack} pageName="Oil Management">
            <OilManagement onBack={handleBack} />
          </PermissionChecker>
        );
      case 'management':
        return (
          <PermissionChecker requiredPermission="staff_management" onBack={handleBack} pageName="System Management">
            <Management onBack={handleBack} />
          </PermissionChecker>
        );
      default:
        return <MainDashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <Layout>
      {renderCurrentPage()}
    </Layout>
  );
};

export default Index;
