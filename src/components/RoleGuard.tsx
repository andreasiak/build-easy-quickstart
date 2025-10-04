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
          // Check profiles table for user_type
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('user_type')
            .eq('user_id', user.id)
            .maybeSingle();

          if (profileError) {
            console.error('Error checking user role:', profileError);
          } else if (profileData && allowedUserTypes.includes(profileData.user_type as any)) {
            setUserType(profileData.user_type);
            setCheckingRole(false);
            return;
          }

          // No matching role found
          setUserType(null);
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