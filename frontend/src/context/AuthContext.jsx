import { createContext, useContext, useState, useEffect } from "react";
import { loginUser, signupUser, logoutUserApi } from "../api/products.js";

const AuthContext = createContext();

const getStoredUser = () => {
  const storedUser = localStorage.getItem("userInfo");
  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch (err) {
    localStorage.removeItem("userInfo");
    return null;
  }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getStoredUser);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(false);
  }, []);

  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key !== "userInfo") {
        return;
      }

      setUser(getStoredUser());
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const login = async (email, password) => {
    const data = await loginUser(email, password);
    setUser(data);
    localStorage.setItem("userInfo", JSON.stringify(data));
    return data;
  };

  const signup = async (name, email, password) => {
    const data = await signupUser(name, email, password);
    // Don't auto-log in since they need email verification first!
    return data;
  };

  const logout = async () => {
    try {
      await logoutUserApi();
    } catch (err) {
      console.error("Logout API failed: ", err);
    }
    setUser(null);
    localStorage.removeItem("userInfo");
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
