import { ReactNode, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface AdminGuardProps {
  children: ReactNode;
}

export const AdminGuard = ({ children }: AdminGuardProps) => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Use has_role security definer function to check admin status
        const { data, error } = await supabase.rpc('has_role' as any, {
          _user_id: user.id,
          _role: 'admin'
        });

        if (error) throw error;

        if (data === true) {
          setIsAdmin(true);
          
          // Log admin access
          await supabase.rpc('log_security_event', {
            p_action: 'admin_access',
            p_resource_type: 'admin_dashboard',
            p_resource_id: null,
            p_metadata: { page: window.location.pathname }
          });
        } else {
          toast.error('Access denied: Admin role required');
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Admin check error:', error);
        toast.error('Failed to verify admin status');
        setIsAdmin(false);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-hero">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
