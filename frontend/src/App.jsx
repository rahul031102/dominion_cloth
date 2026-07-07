import { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import CartDrawer from "./components/CartDrawer.jsx";
import Home from "./pages/Home.jsx";
import Products from "./pages/Products.jsx";
import ProductDetail from "./pages/ProductDetail.jsx";
import Checkout from "./pages/Checkout.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";

export default function App() {
  const [appLoading, setAppLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAppLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  if (appLoading) {
    return (
      <div className="fixed inset-0 bg-paper z-50 flex flex-col items-center justify-center font-body">
        <div className="flex flex-col items-center max-w-sm px-6 text-center animate-scale-up">
          {/* pulsating centered large attractive logo */}
          <div className="relative mb-6 flex items-center justify-center">
            <div className="absolute -inset-4 bg-navy/5 rounded-full blur-xl animate-pulse" />
            <img 
              src="/logo.png" 
              alt="Dominion Clothing Logo" 
              className="w-44 h-auto object-contain relative z-10 hover:scale-105 transition-transform duration-500" 
            />
          </div>
          <h2 className="text-xl font-bold tracking-widest text-ink uppercase leading-none font-display">
            DOMINION CLOTHING
          </h2>
          <p className="text-[10px] text-gray-400 mt-2.5 uppercase tracking-[0.25em] font-semibold">
            Walk in Power. Dress in Purpose.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink font-body">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </main>
      <Footer />
      <CartDrawer />
    </div>
  );
}
