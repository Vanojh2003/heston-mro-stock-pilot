
import React, { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Moon, Sun, Monitor, LogOut } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark' | 'auto'>('auto');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    
    if (theme === 'auto') {
      const hour = new Date().getHours();
      const isDark = hour < 6 || hour >= 18;
      root.classList.toggle('dark', isDark);
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }
  }, [theme]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const formatDateTime = (date: Date) => {
    return {
      date: date.toLocaleDateString('en-GB'),
      time: date.toLocaleTimeString('en-GB', { hour12: false })
    };
  };

  const { date, time } = formatDateTime(currentTime);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 shadow-lg border-b-4 border-yellow-500">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            {/* Logo and Title */}
            <div className="flex items-center space-x-4">
              <img 
                src="/lovable-uploads/379df369-5c63-40d6-aec7-84bdf8abf10a.png" 
                alt="HESTON MRO Logo" 
                className="w-12 h-12"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  HESTON MRO
                </h1>
                <p className="text-yellow-600 font-semibold">Stock Management System</p>
              </div>
            </div>

            {/* Date, Time and Controls */}
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{date}</p>
                <p className="text-lg font-bold text-yellow-600">{time}</p>
              </div>
              
              {/* Theme Toggle */}
              <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
                <Button
                  variant={theme === 'light' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTheme('light')}
                  className="p-2"
                >
                  <Sun className="w-4 h-4" />
                </Button>
                <Button
                  variant={theme === 'dark' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTheme('dark')}
                  className="p-2"
                >
                  <Moon className="w-4 h-4" />
                </Button>
                <Button
                  variant={theme === 'auto' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setTheme('auto')}
                  className="p-2"
                >
                  <Monitor className="w-4 h-4" />
                </Button>
              </div>

              {/* User Info and Logout */}
              {user && (
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {user.email}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSignOut}
                    className="text-red-600 hover:text-red-700"
                  >
                    <LogOut className="w-4 h-4 mr-1" />
                    Logout
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
};
