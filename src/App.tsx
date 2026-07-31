import React, { Suspense, useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import router from './routes';
import { useAppDispatch, useAppSelector } from './redux/hook';
import { fetchAccount } from './redux/slice/accountSlice';
import Loading from './components/common/ux/Loading';

const ACCOUNT_BOOTSTRAP_EXCLUDED_PATHS = new Set(['/register', '/login']);
const IMMEDIATE_ROUTER_PATHS = new Set(['/login', '/']);
const isMobileUploadPath = (pathname: string) => pathname.startsWith('/m/upload/');

const App: React.FC = () => {
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector(state => state.account.isLoading);
  const pathname = window.location.pathname;

  useEffect(() => {
    if (ACCOUNT_BOOTSTRAP_EXCLUDED_PATHS.has(pathname) || isMobileUploadPath(pathname)) return;
    dispatch(fetchAccount());
  }, [dispatch, pathname]);

  const canRenderRouter = !isLoading
    || IMMEDIATE_ROUTER_PATHS.has(pathname)
    || isMobileUploadPath(pathname);

  if (!canRenderRouter) {
    return <Loading />;
  }

  return (
    <Suspense fallback={<Loading />}>
      <RouterProvider router={router} />
    </Suspense>
  );
};

export default App;
