"use client";

import { signIn } from "next-auth/react";

export default function SignInPage() {
  return (
    <div className="p-8">
      <h1 className="text-xl font-bold mb-4">Iniciar sesión</h1>

      <button
        onClick={() => signIn("google")}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        Sign in with Google
      </button>
    </div>
  );
}
