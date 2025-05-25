import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { headers } from "next/headers";

export default async function SignIn() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return redirect("/protected");
  }

  const signInWithGoogle = async () => {
    "use server";
    const supabase = await createClient();
    const headersList = await headers();
    const origin = headersList.get("origin") || "http://localhost:3000";
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${origin}/auth/callback`,
      },
    });

    if (error) {
      return redirect("/sign-in?error=Could not authenticate user");
    }

    return redirect(data.url);
  };

  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2">
      <div className="animate-in flex-1 flex flex-col w-full justify-center gap-6 text-foreground">
        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="text-2xl font-bold">Welcome Back</h1>
          <p className="text-sm text-muted-foreground">
            Sign in with your Google account to continue
          </p>
        </div>

        <form className="animate-in flex-1 flex flex-col w-full justify-center gap-6 text-foreground">
          <Button
            formAction={signInWithGoogle}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            Sign in with Google
          </Button>
        </form>
      </div>
    </div>
  );
}
