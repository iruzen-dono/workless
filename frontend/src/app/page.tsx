import Link from "next/link";
import { Workflow, ExternalLink } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      {/* Nav */}
      <header className="border-b border-zinc-800">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded bg-violet-600">
              <Workflow className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-white">Workless</span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Connexion
            </Link>
            <Link
              href="/register"
              className="text-sm bg-violet-600 hover:bg-violet-500 text-white px-4 py-1.5 rounded-lg transition-colors"
            >
              Démarrer
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex items-center justify-center">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900 px-3 py-1 text-xs text-zinc-400 mb-6">
            🔥 Open-source · Self-hosted · MIT
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-white mb-4">
            L'automatisation,<br />
            <span className="text-violet-400">sans limites</span>
          </h1>
          <p className="text-lg text-zinc-400 mb-8 max-w-lg mx-auto">
            Créez des workflows visuels, connectez vos services, automatisez
            tout. 100% open-source, self-hosted, extensible par plugins.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/register"
              className="bg-violet-600 hover:bg-violet-500 text-white px-6 py-3 rounded-xl font-medium transition-colors"
            >
              Démarrer gratuitement
            </Link>
            <a
              href="https://github.com/iruzen-dono/workless"
              target="_blank"
              className="flex items-center gap-2 border border-zinc-800 hover:bg-zinc-900 text-zinc-300 px-6 py-3 rounded-xl font-medium transition-colors"
            >
              <ExternalLink className="h-5 w-5" />
              GitHub
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 py-6">
        <p className="text-center text-xs text-zinc-600">
          Workless — MIT License
        </p>
      </footer>
    </div>
  );
}
