
import React, { useState } from 'react';
import { Layout } from '@/components/Layout';
import { MainDashboard } from '@/components/MainDashboard';
import { OilDashboard } from '@/components/OilDashboard';
import { OilStockIn } from '@/components/OilStockIn';
import { OilStockOut } from '@/components/OilStockOut';
import { OilManagement } from '@/components/OilManagement';
import { Management } from '@/components/Management';

const Index = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');

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

  const renderCurrentPage = () => {
    switch (currentPage) {
      case 'oil':
        return <OilDashboard onNavigate={handleNavigate} onBack={handleBack} />;
      case 'oil-stock-in':
        return <OilStockIn onBack={handleBack} />;
      case 'oil-stock-out':
        return <OilStockOut onBack={handleBack} />;
      case 'oil-management':
        return <OilManagement onBack={handleBack} />;
      case 'management':
        return <Management onBack={handleBack} />;
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
