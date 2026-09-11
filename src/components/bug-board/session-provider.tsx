"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { BugIcon, LoaderCircleIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api, ApiError, type CurrentUser } from "@/lib/bug-board/api";
import { setCurrentUserId } from "@/lib/bug-board/data";

interface SessionValue {
  user: CurrentUser;
  signOut: () => Promise<void>;
}

const SessionContext = createContext<SessionValue | null>(null);

export function useSession(): SessionValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error("useSession must be used inside a SessionGate");
  }
  return context;
}

/**
 * Resolves the session before anything else renders.
 *
 * The board is useless without a signed-in actor — every comment, upload and
 * status change is attributed to one — so the gate resolves `/api/auth/me/`
 * first and shows the sign-in form until it succeeds.
 */
export function SessionGate({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [checking, setChecking] = useState(true);
  const [offline, setOffline] = useState<string | null>(null);

  const adopt = useCallback((next: CurrentUser | null) => {
    setUser(next);
    // Kept in the registry too, so the non-React helpers can read it.
    setCurrentUserId(next?.id ?? null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    api
      .me()
      .then((next) => {
        if (!cancelled) adopt(next);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        // Reaching the API at all failed — worth saying so plainly, because it
        // usually means the backend simply is not running.
        setOffline(
          error instanceof Error
            ? error.message
            : "The API could not be reached."
        );
      })
      .finally(() => {
        if (!cancelled) setChecking(false);
      });
    return () => {
      cancelled = true;
    };
  }, [adopt]);

  const signOut = useCallback(async () => {
    await api.logout();
    adopt(null);
  }, [adopt]);

  if (checking) {
    return (
      <Centered>
        <LoaderCircleIcon
          className="size-5 animate-spin text-muted-foreground"
          aria-hidden="true"
        />
        <p className="text-sm text-muted-foreground">Checking your session…</p>
      </Centered>
    );
  }

  if (offline) {
    return (
      <Centered>
        <h1 className="font-heading text-lg font-semibold">
          Cannot reach the API
        </h1>
        <p className="max-w-sm text-center text-sm text-muted-foreground">
          {offline}
        </p>
        <p className="max-w-sm text-center text-sm text-muted-foreground">
          Start the backend with{" "}
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
            cd backend && uv run manage.py runserver 8000
          </code>
          , then reload.
        </p>
      </Centered>
    );
  }

  if (!user) return <SignIn onSignedIn={adopt} />;

  return (
    <SessionContext.Provider value={{ user, signOut }}>
      {children}
    </SessionContext.Provider>
  );
}

function Centered({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-1 flex-col items-center justify-center gap-3 p-6">
      {children}
    </div>
  );
}

function SignIn({ onSignedIn }: { onSignedIn: (user: CurrentUser) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      onSignedIn(await api.login(username.trim(), password));
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : "Sign in failed. Is the backend running?"
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <Centered>
      <form
        onSubmit={submit}
        className="flex w-full max-w-sm flex-col gap-4 rounded-xl border bg-card p-6"
      >
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BugIcon className="size-4" aria-hidden="true" />
          </span>
          <div>
            <h1 className="font-heading text-lg leading-tight font-semibold">
              Bug Board
            </h1>
            <p className="text-sm text-muted-foreground">
              Sign in to open the board.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="username">Username</Label>
          <Input
            id="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            autoFocus
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </div>

        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <Button type="submit" disabled={busy || !username || !password}>
          {busy ? (
            <LoaderCircleIcon
              data-icon="inline-start"
              className="animate-spin"
              aria-hidden="true"
            />
          ) : null}
          Sign in
        </Button>
      </form>
    </Centered>
  );
}
