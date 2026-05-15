import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth";
import { api, ApiError } from "../api";
import { Modal } from "../components/Modal";
import type { Role, StaffUser } from "../types";

const ROLES: { value: Role; label: string }[] = [
  { value: "ADMIN", label: "Руководитель" },
  { value: "OPERATOR", label: "Оператор" },
  { value: "DRIVER", label: "Водитель" },
  { value: "WORKSHOP", label: "Цех" },
];

export function StaffPage() {
  const { token } = useAuth();
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api<StaffUser[]>("/staff", { token });
      setUsers(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Не удалось загрузить");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <div className="page-header">
        <h1>Сотрудники</h1>
        <button className="btn btn-primary" onClick={() => setCreating(true)}>
          + Добавить сотрудника
        </button>
      </div>

      {error ? <div className="error">{error}</div> : null}
      {loading ? <div className="empty">Загрузка…</div> : null}

      {!loading && users.length > 0 ? (
        <table className="table">
          <thead>
            <tr>
              <th>Email</th>
              <th>Имя</th>
              <th>Роль</th>
              <th>Создан</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.email}</td>
                <td>{u.profile?.name ?? "—"}</td>
                <td>{ROLES.find((r) => r.value === u.role)?.label ?? u.role}</td>
                <td>{new Date(u.createdAt).toLocaleDateString("ru-RU")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}

      {creating ? (
        <CreateStaffModal
          token={token}
          onClose={() => setCreating(false)}
          onSaved={() => { setCreating(false); load(); }}
        />
      ) : null}
    </>
  );
}

function CreateStaffModal({
  token,
  onClose,
  onSaved,
}: {
  token: string | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("OPERATOR");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api<StaffUser>("/staff", {
        token,
        body: { email, password, role, name: name || undefined },
      });
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Ошибка");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Новый сотрудник" onClose={onClose}>
      <form className="form" onSubmit={submit}>
        {error ? <div className="error">{error}</div> : null}
        <div className="form-row">
          <div className="field">
            <label>Email *</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label>Имя</label>
            <input value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        </div>
        <div className="form-row">
          <div className="field">
            <label>Роль *</label>
            <select value={role} onChange={(e) => setRole(e.target.value as Role)}>
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Пароль *</label>
            <input
              type="password"
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="form-actions">
          <button type="button" className="btn" onClick={onClose}>Отмена</button>
          <button type="submit" className="btn btn-primary" disabled={busy}>
            {busy ? "Сохраняем…" : "Создать"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
