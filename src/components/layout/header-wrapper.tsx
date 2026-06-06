'use client';

import { useAuth }     from '@/context/AuthContext';  
import HeaderPrivate   from './header-private';
import HeaderPublic    from './header-public';

export default function HeaderWrapper() {
  const { isAuthenticated } = useAuth();             
  return isAuthenticated ? <HeaderPrivate /> : <HeaderPublic />;
}
