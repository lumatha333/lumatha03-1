import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function MarketplaceController() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate(`/marketplace/profile/${user.id}`, { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="text-center py-8 text-xs text-muted-foreground">Redirecting to your marketplace profile...</div>
  );
}
