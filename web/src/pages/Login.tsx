import { useState } from "react";
import { useAuth } from "../auth";
import { ApiError } from "../api";

export function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось войти");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-page">
      <form className="login-card form" onSubmit={submit}>
        <h1>Carpet CRM</h1>
        <p>Войдите, чтобы продолжить</p>

        {error ? <div className="error">{error}</div> : null}

        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            autoFocus
            required
          />
        </div>

        <div className="field">
          <label htmlFor="password">Пароль</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Входим…" : "Войти"}
        </button>

        <div className="login-help">
          Демо-пользователи:
          <br />
          <code>admin@example.com</code> / <code>change-me-strong</code>
          <br />
          <code>operator@example.com</code> / <code>operator123</code>
          <br />
          <code>driver@example.com</code> / <code>driver123</code>
          <br />
          <code>workshop@example.com</code> / <code>workshop123</code>
        </div>
      </form>
    </div>
  );
}
