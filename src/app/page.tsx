import { redirect } from "next/navigation";

export default function Home() {
  // Redirect root to /home for guest preview
  redirect("/home");
}
