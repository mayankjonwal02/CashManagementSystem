import { redirect } from "next/navigation"

export default function DashboardPage() {
  // Redirect to outstanding report page
  redirect("/dashboard/outstanding")

  return null
}
