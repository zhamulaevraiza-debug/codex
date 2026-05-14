import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { api } from "./api";
import type { Role } from "./types";

interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  exp: number;
}

interface AuthState {
  token: string | null;
  userId: string | null;
  email: string | null;
  role: Role | null;
}

interface AuthContextValue extends AuthState {
  login(email: string, password: string): Promise<void>;
  logout(): void;
}

const STORAGE_KEY = "carpet-crm-auth";
const AuthContext = createContext<AuthContextValue | null>(null);

function decode(token: string): JwtPayload | null {
  try {
    const part = token.split(".")[1];
    const json = atob(part.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

function load(): AuthState {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { token: null, userId: null, email: null, role: null };
  try {
    const parsed = JSON.parse(raw) as { token: string };
    const payload = decode(parsed.token);
    if (!payload) throw new Error("bad token");
    if (payload.exp * 1000 < Date.now()) throw new Error("expired");
    return {
      token: parsed.token,
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return { token: null, userId: null, email: null, role: null };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => load());

  useEffect(() => {
    if (state.token) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ token: state.token }));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [state.token]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api<{ userId: string; tokens: { accessToken: string } }>(
      "/auth/login",
      { body: { email, password } },
    );
    const payload = decode(res.tokens.accessToken);
    if (!payload) throw new Error("Не удалось разобрать токен");
    setState({
      token: res.tokens.accessToken,
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    });
  }, []);

  const logout = useCallback(() => {
    setState({ token: null, userId: null, email: null, role: null });
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, login, logout }),
    [state, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("AuthContext is missing");
  return ctx;
}
