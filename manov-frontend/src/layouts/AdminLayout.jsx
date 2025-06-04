import React from "react"
import { Outlet, Link, NavLink } from "react-router-dom"
import { Users, BookText, LayoutDashboard, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext" // To get user info for display or logout

const adminNavLinks = [
  // { to: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/languages", label: "Languages", icon: BookText }, // For Phase 7
  { to: "/admin/authors", label: "Authors", icon: BookText }, // For Phase 7
  { to: "/admin/novels", label: "Novels", icon: BookText }, // For Phase 8
]

export function AdminLayout() {
  const { user, logout } = useAuth() // Basic user info and logout

  return (
    <div className='flex min-h-screen bg-muted/40'>
      <aside className='fixed inset-y-0 left-0 z-10 hidden w-60 flex-col border-r bg-background sm:flex'>
        <nav className='flex flex-col items-start gap-2 px-4 py-5'>
          <Link to='/admin/users' className='group flex h-9 w-full items-center justify-start rounded-lg px-3 mb-4'>
            <LayoutDashboard className='h-6 w-6 text-primary transition-all group-hover:scale-110' />
            <span className='ml-3 text-lg font-bold'>Admin Panel</span>
          </Link>
          {adminNavLinks.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex w-full items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${
                  isActive ? "!text-primary bg-primary/10" : ""
                }`
              }>
              <item.icon className='h-4 w-4' />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className='mt-auto p-4 border-t'>
          <Button variant='ghost' className='w-full justify-start' onClick={() => logout()}>
            <LogOut className='mr-2 h-4 w-4' /> Logout
          </Button>
        </div>
      </aside>

      <main className='flex flex-1 flex-col gap-4 p-4 sm:ml-60 sm:py-6 lg:gap-6 lg:p-8'>
        {/* Mobile header could be added here if needed */}
        <Outlet />
      </main>
    </div>
  )
}
