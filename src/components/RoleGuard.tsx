import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedUserTypes: ('client' | 'vendor')[];
  fallbackRoute?: string;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ 
  children, 
  allowedUserTypes,
  fallbackRoute = '/'
}) => {
  const { user, loading } = useAuth();
  const [userType, setUserType] = useState<string | null>(null);
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    if (user && !loading) {
      const checkUserRole = async () => {
        try {
          // Check if user is admin first (admins have access to everything)
          const { data: isAdmin, error: adminError } = await supabase.rpc('has_role' as any, {
            _user_id: user.id,
            _role: 'admin'
          });

          if (adminError) {
            console.error('Error checking admin role:', adminError);
          } else if (isAdmin) {
            setUserType('admin');
            setCheckingRole(false);
            return;
          }

          // Check each allowed role
          for (const roleType of allowedUserTypes) {
            const { data, error } = await supabase.rpc('has_role' as any, {
              _user_id: user.id,
              _role: roleType
            });

            if (error) {
              console.error(`Error checking ${roleType} role:`, error);
              continue;
            }

            if (data === true) {
              setUserType(roleType);
              setCheckingRole(false);
              return;
            }
          }

          // No matching role found
          setUserType(null);
          toast.error('Failed to verify user permissions');
        } catch (error) {
          console.error('Error:', error);
          toast.error('Authentication error');
        } finally {
          setCheckingRole(false);
        }
      };

      checkUserRole();
    } else if (!loading) {
      setCheckingRole(false);
    }
  }, [user, loading, allowedUserTypes]);

  if (loading || checkingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Allow admin users to access all areas
  if (userType === 'admin') {
    return <>{children}</>;
  }

  if (userType && !allowedUserTypes.includes(userType as 'client' | 'vendor')) {
    // Show error message for wrong account type
    toast.error(`Access denied. This area is for ${allowedUserTypes.join(' and ')} accounts only.`);
    
    // Safe fallback to landing page to prevent redirect loops
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};