"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

function CallbackUrlHandler({
  setCallbackUrl,
}: {
  setCallbackUrl: (url: string) => void;
}): React.JSX.Element {
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/";
  setCallbackUrl(callbackUrl);
  return <></>;
}

export default function SignInPage() {
  const [callbackUrl, setCallbackUrl] = useState("/");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await authClient.signIn.username(
      { username, password },
      {
        onError: () => {
          setError("Invalid username or password");
        },
      },
    );

    if (!error) {
      // Only allow internal paths — no javascript: or external URLs
      if (callbackUrl.startsWith("/") && !callbackUrl.includes("://")) {
        window.location.href = callbackUrl;
      }
    }

    setLoading(false);
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Sign In</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense>
            <CallbackUrlHandler setCallbackUrl={setCallbackUrl} />
          </Suspense>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="text-sm text-destructive">{error}</div>}
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
            <div className="text-center text-sm text-muted-foreground">
              Do not have an account?{" "}
              <Link href="/sign-up" className="text-primary hover:underline">
                Sign up
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
