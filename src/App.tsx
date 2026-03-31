import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Agenda from './pages/Agenda';
import CheckIn from './pages/CheckIn';
import Login from './components/Login';
import Clients from './pages/Clients';
import Services from './pages/Services';
import Staff from './pages/Staff';
import Loyalty from './pages/Loyalty';
import Finance from './pages/Finance';
import Settings from './pages/Settings';
import LiveQueue from './pages/LiveQueue';
import MyProduction from './pages/MyProduction';
import ProductionPayroll from './pages/ProductionPayroll';
import PublicBooking from './pages/PublicBooking';
import BulkMessages from './pages/BulkMessages';
import { DataProvider } from './DataContext';
import { User } from './types';

interface AuthContextType {
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" />;
};

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const login = (token: string, userData: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      <DataProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/agendar" element={<PublicBooking />} />
            <Route path="/agendar/:unitId" element={<PublicBooking />} />
            <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
              <Route index element={<Dashboard />} />
              <Route path="agenda" element={<Agenda />} />
              <Route path="check-in" element={<CheckIn />} />
              <Route path="clients" element={<Clients />} />
              <Route path="services" element={<Services />} />
              <Route path="staff" element={<Staff />} />
              <Route path="loyalty" element={<Loyalty />} />
              <Route path="finance" element={<Finance />} />
              <Route path="settings" element={<Settings />} />
              <Route path="my-production" element={<MyProduction />} />
              <Route path="payroll" element={<ProductionPayroll />} />
              <Route path="bulk-messages" element={<BulkMessages />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </DataProvider>
    </AuthContext.Provider>
  );
}
