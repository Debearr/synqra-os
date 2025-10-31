import SignupForm from "@/components/auth/SignupForm";
import { signupAction } from "./actions";

export default function SignupPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <SignupForm action={signupAction} />
    </main>
  );
}
