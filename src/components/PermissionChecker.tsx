
import React, { useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertTriangle } from 'lucide-react';

interface PermissionCheckerProps {
  requiredPermission: string;
  children: ReactNode;
  onBack?: () => void;
  pageName?: string;
}

export const PermissionChecker = ({ 
  requiredPermission, 
  children, 
  onBack, 
  pageName = 'this page' 
}: PermissionCheckerProps) => {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [authRetryCount, setAuthRetryCount] = useState(0);

  useEffect(() => {
    checkPermissions();
  }, [requiredPermission, authRetryCount]);

  const checkPermissions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('No authenticated user found');
        setHasPermission(false);
        setLoading(false);
        return;
      }

      console.log('Checking permissions for user:', user.id);

      // Force fresh data fetch by adding timestamp
      const { data: staffData, error } = await supabase
        .from('staff')
        .select('permissions, role')
        .eq('auth_user_id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching staff data:', error);
        setHasPermission(false);
      } else if (!staffData) {
        console.log('No staff record found for user');
        setHasPermission(false);
      } else {
        // Admin users have all permissions
        const isAdmin = staffData.role === 'admin';
        const hasSpecificPermission = staffData.permissions?.[requiredPermission] === true;
        
        console.log(`Permission check details:`);
        console.log(`- Required permission: ${requiredPermission}`);
        console.log(`- User role: ${staffData.role}`);
        console.log(`- User permissions:`, staffData.permissions);
        console.log(`- Has specific permission: ${hasSpecificPermission}`);
        console.log(`- Is admin: ${isAdmin}`);
        console.log(`- Final result: ${isAdmin || hasSpecificPermission}`);
        
        setHasPermission(isAdmin || hasSpecificPermission);
      }
    } catch (error) {
      console.error('Error checking permissions:', error);
      setHasPermission(false);
    } finally {
      setLoading(false);
    }
  };

  const handleRetryAuth = () => {
    setLoading(true);
    setAuthRetryCount(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Checking permissions...
          </h1>
        </div>
      </div>
    );
  }

  if (!hasPermission) {
    return (
      <div className="space-y-8">
        {onBack && (
          <div className="flex items-center">
            <Button
              onClick={onBack}
              variant="outline"
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Button>
          </div>
        )}
        
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-xl font-bold text-gray-900 dark:text-white">
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              You don't have permission to access {pageName}. Please contact your administrator to request access.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500">
              Required permission: {requiredPermission.replace('_', ' ')}
            </p>
            <Button 
              onClick={handleRetryAuth}
              variant="outline"
              size="sm"
            >
              Refresh Permissions
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
};
