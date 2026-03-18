import React, { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import router from './routes';
import { useAppDispatch } from './redux/hook';
import { fetchAccount } from './redux/slice/accountSlice';

const App: React.FC = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (window.location.pathname === '/register') return;
    if (window.location.pathname === '/login') return;
    dispatch(fetchAccount());
  }, []);

  return <RouterProvider router={router} />;
};

export default App;
