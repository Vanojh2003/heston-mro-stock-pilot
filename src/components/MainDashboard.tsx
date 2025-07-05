
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Droplet, Wrench, Settings, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface MainDashboardProps {
  onNavigate: (page: string) => void;
}

export const MainDashboard = ({ onNavigate }: MainDashboardProps) => {
  const [userPermissions, setUserPermissions] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserPermissions();
  }, []);

  const fetchUserPermissions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: staffData } = await supabase
          .from('staff')
          .select('permissions, role')
          .eq('auth_user_id', user.id)
          .maybeSingle();
        
        setUserPermissions(staffData);
      }
    } catch (error) {
      console.error('Error fetching user permissions:', error);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permission: string) => {
    if (!userPermissions) return false;
    return userPermissions.permissions?.[permission] || userPermissions.role === 'admin';
  };

  const modules = [
    {
      id: 'oil',
      title: 'Oil Management',
      description: 'Manage oil stock in, stock out, and oil types',
      icon: Droplet,
      color: 'bg-blue-500 hover:bg-blue-600',
      available: true,
      requiresPermission: 'oil_stock_in' // Check for basic oil permissions
    },
    {
      id: 'parts',
      title: 'Parts Management',
      description: 'Manage aircraft parts inventory',
      icon: Wrench,
      color: 'bg-green-500 hover:bg-green-600',
      available: false,
      requiresPermission: null
    },
    {
      id: 'management',
      title: 'Management',
      description: 'User management and system settings',
      icon: Settings,
      color: 'bg-purple-500 hover:bg-purple-600',
      available: true,
      requiresPermission: 'staff_management'
    }
  ];

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Loading...
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          Stock Management System
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400">
          Select a module to begin managing your inventory
        </p>
        {userPermissions && (
          <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
            Role: {userPermissions.role?.toUpperCase() || 'STAFF'}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules
          .filter(module => !module.requiresPermission || hasPermission(module.requiresPermission))
          .map((module) => {
            const IconComponent = module.icon;
            
            return (
              <Card 
                key={module.id} 
                className={`transition-all duration-200 hover:shadow-lg border-2 ${
                  module.available ? 'hover:border-yellow-400 cursor-pointer' : 'opacity-50'
                }`}
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
                    onClick={() => module.available && onNavigate(module.id)}
                    disabled={!module.available}
                    className={`w-full ${module.available ? module.color : 'bg-gray-400'} text-white font-semibold`}
                  >
                    {module.available ? 'Open Module' : 'Coming Soon'}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 mt-8">
        <h2 className="text-lg font-semibold text-yellow-800 dark:text-yellow-200 mb-2">
          Welcome to HESTON MRO Stock Management
        </h2>
        <p className="text-yellow-700 dark:text-yellow-300">
          This system helps you track and manage oil inventory, parts, and staff access. 
          The modules shown above are based on your current permissions.
        </p>
        {!userPermissions && (
          <p className="text-yellow-600 dark:text-yellow-400 mt-2 text-sm">
            Note: You may need to contact an administrator to set up your permissions.
          </p>
        )}
      </div>
    </div>
  );
};
