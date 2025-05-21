"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { BarChart3, FileText, LogOut, User } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export function Sidebar() {
  const pathname = usePathname()
  const { logout, user } = useAuth()

  const routes = [
    {
      label: "Outstanding Report",
      icon: BarChart3,
      href: "/dashboard/outstanding",
      active: pathname === "/dashboard" || pathname === "/dashboard/outstanding",
    },
    {
      label: "Employee Payment Report",
      icon: FileText,
      href: "/dashboard/reports",
      active: pathname.includes("/dashboard/reports"),
    },
  ]

  return (
    <div className="flex h-full w-64 flex-col border-r bg-white">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-purple-700">
          <span className="text-xl">Cash Management</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <nav className="grid items-start px-2 text-sm font-medium">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
                route.active ? "bg-purple-100 text-purple-700" : "text-gray-500 hover:bg-gray-100 hover:text-gray-900",
              )}
            >
              <route.icon className="h-4 w-4" />
              <span>{route.label}</span>
            </Link>
          ))}
        </nav>
      </div>
      <div className="mt-auto border-t p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="h-8 w-8 rounded-full bg-purple-200 flex items-center justify-center">
            <User className="h-4 w-4 text-purple-700" />
          </div>
          <div>
            <p className="text-sm font-medium">{user?.username || "Admin"}</p>
            <p className="text-xs text-gray-500">{user?.role || "Administrator"}</p>
          </div>
        </div>
        <Button variant="outline" size="sm" className="w-full justify-start text-gray-500" onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  )
}
