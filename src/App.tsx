import { BrowserRouter, Route, Routes } from 'react-router';
import React from 'react';
import DashboardLayout from './dashboard-layout';

const Home = React.lazy(() => import('./pages/home'));
const Explorer = React.lazy(() => import('./pages/explorer'));
const Codes = React.lazy(() => import('./pages/codes'));

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/explorer/*" element={<Explorer />} />
          <Route path="/codes" element={<Codes />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
