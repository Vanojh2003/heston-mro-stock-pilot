
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowDown, ArrowUp, Settings } from 'lucide-react';

interface OilDashboardProps {
  onNavigate: (page: string) => void;
  onBack: () => void;
}

export const OilDashboard = ({ onNavigate, onBack }: OilDashboardProps) => {
  const oilModules = [
    {
      id: 'oil-stock-in',
      title: 'Oil Stock In',
      description: 'Record incoming oil batches and inventory',
      icon: ArrowDown,
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      id: 'oil-stock-out',
      title: 'Oil Stock Out',
      description: 'Record oil usage and consumption',
      icon: ArrowUp,
      color: 'bg-red-500 hover:bg-red-600'
    },
    {
      id: 'oil-management',
      title: 'Oil Management',
      description: 'Manage oil types, owners, and settings',
      icon: Settings,
      color: 'bg-blue-500 hover:bg-blue-600'
    }
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Button
          onClick={onBack}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Button>
        
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Oil Management
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {oilModules.map((module) => {
          const IconComponent = module.icon;
          
          return (
            <Card 
              key={module.id} 
              className="transition-all duration-200 hover:shadow-lg border-2 hover:border-yellow-400 cursor-pointer"
            >
              <CardHeader className="text-center pb-4">
                <div className={`w-16 h-16 ${module.color} rounded-full flex items-center justify-center mx-auto mb-4 transition-colors`}>
                  <IconComponent className="w-8 h-8 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
                  {module.title}
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  {module.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="text-center">
                <Button
                  onClick={() => onNavigate(module.id)}
                  className={`w-full ${module.color} text-white font-semibold`}
                >
                  Open {module.title}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
