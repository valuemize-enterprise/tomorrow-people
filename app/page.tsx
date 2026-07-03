import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"

export default async function HomePage() {
  const session = await auth()
  if (session?.user?.onboardingComplete) redirect("/today")
  if (session?.user) redirect("/onboarding")
  redirect("/login")
}
