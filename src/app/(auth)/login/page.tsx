"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button, Card, Label, TextInput, Alert } from "flowbite-react";
import { HiMail, HiLockClosed } from "react-icons/hi";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      router.push("/admin");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            UX Research Tool
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Sign in to manage your studies
          </p>
        </div>

        {error && (
          <Alert color="failure" className="mb-4">
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <Label htmlFor="email" className="mb-2 block">Email</Label>
            <TextInput
              id="email"
              type="email"
              icon={HiMail}
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="password" className="mb-2 block">Password</Label>
            <TextInput
              id="password"
              type="password"
              icon={HiLockClosed}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" disabled={loading} color="blue" className="mt-2">
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

