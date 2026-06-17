"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Workflow } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm border-zinc-800 bg-zinc-900 p-6">
        <div className="text-center mb-6">
          <div className="flex justify-center mb-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-600">
              <Workflow className="h-5 w-5 text-white" />
            </div>
          </div>
          <h1 className="text-xl font-bold text-zinc-100">Inscription</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Créez votre compte Workless
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-zinc-300 block mb-1.5">
              Nom
            </label>
            <Input
              placeholder="Votre nom"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-600"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-300 block mb-1.5">
              Email
            </label>
            <Input
              type="email"
              placeholder="vous@exemple.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-600"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-zinc-300 block mb-1.5">
              Mot de passe
            </label>
            <Input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-zinc-950 border-zinc-800 text-zinc-100 placeholder:text-zinc-600"
              required
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-violet-600 hover:bg-violet-500 text-white"
          >
            Créer mon compte
          </Button>
        </form>

        <p className="text-center text-sm text-zinc-500 mt-6">
          Déjà un compte ?{" "}
          <Link
            href="/login"
            className="text-violet-400 hover:text-violet-300"
          >
            Se connecter
          </Link>
        </p>
      </Card>
    </div>
  );
}
