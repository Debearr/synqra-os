import LoginForm from "@/components/auth/LoginForm";
import { loginAction } from "./actions";

export default function LoginPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <LoginForm action={loginAction} />
    </main>
  );
}
