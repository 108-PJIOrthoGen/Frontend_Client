import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import router from './routes';
import { useAppDispatch, useAppSelector } from './redux/hook';
import { fetchAccount } from './redux/slice/accountSlice';
import Loading from './components/common/ux/Loading';

const App: React.FC = () => {
  const dispatch = useAppDispatch();
  const isLoading = useAppSelector(state => state.account.isLoading)
  useEffect(() => {
    if (window.location.pathname === '/register') return;
    if (window.location.pathname === '/login') return;
    dispatch(fetchAccount());
  }, []);

  return <>{
    isLoading === false || window.location.pathname === '/login' || window.location.pathname === '/'
      ? <RouterProvider router={router} /> : <Loading />
  }</>
};

export default App;
