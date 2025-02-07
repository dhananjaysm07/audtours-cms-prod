import { BrowserRouter, Route, Routes } from "react-router";
import React from "react";
import DashboardLayout from "./dashboard-layout";
import Store from "./pages/store";
import StorePage from "./pages/store-detail";

const Home = React.lazy(() => import("./pages/home"));
const Explorer = React.lazy(() => import("./pages/explorer"));
const Codes = React.lazy(() => import("./pages/codes"));
const SignIn = React.lazy(() => import("./pages/sign-in"));

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/" element={<DashboardLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/explorer/*" element={<Explorer />} />
          <Route path="/store" element={<Store />} />
          <Route path="/store/:id" element={<StorePage />} />
          <Route path="/codes" element={<Codes />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
