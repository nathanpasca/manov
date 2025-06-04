import { Link, NavLink, useNavigate } from "react-router-dom" // Added useNavigate
import { Sheet, SheetContent, SheetClose, SheetTrigger } from "@/components/ui/sheet" // Added SheetClose
import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle, // This is a function returning class names
} from "@/components/ui/navigation-menu"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu" // For User menu
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar" // For User menu
import { ModeToggle } from "@/components/ModeToggle"
import { Menu, BookMarked, LogOut, UserCircle, Settings } from "lucide-react" // Added icons
import { useAuth } from "@/contexts/AuthContext" // Added

const baseNavLinks = [
  { to: "/", label: "Home" },
  { to: "/novels", label: "Novels" },
  { to: "/authors", label: "Authors" },
]

export function Header() {
  const { user, logout, isLoading } = useAuth() // Get user and logout from context
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate("/") // Redirect to home after logout
  }

  const getNavLinks = () => {
    if (user) {
      return baseNavLinks // Or add more user-specific links
    }
    return [
      ...baseNavLinks,
      // { to: "/login", label: "Login" }, // Will be handled by UserMenu or separate buttons
      // { to: "/register", label: "Register" },
    ]
  }

  const navLinksToDisplay = getNavLinks()

  return (
    <header className='sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
      <div className='flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8'>
        {/* Desktop Navigation */}
        <div className='hidden md:flex items-center gap-6'>
          <Link to='/' className='flex items-center space-x-2'>
            <BookMarked className='h-6 w-6' />
            <span className='font-bold text-lg'>Manov</span>
          </Link>
          <NavigationMenu>
            <NavigationMenuList>
              {navLinksToDisplay.map((link) => (
                <NavigationMenuItem key={link.to}>
                  {/* Apply navigationMenuTriggerStyle to NavLink, and use asChild on NavigationMenuLink */}
                  <NavigationMenuLink asChild>
                    <NavLink
                      to={link.to}
                      className={({ isActive }) =>
                        `${navigationMenuTriggerStyle()} ${
                          isActive ? "font-semibold text-primary" : "" // Example of applying active styles
                        }`
                      }>
                      {link.label}
                    </NavLink>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Mobile Navigation Trigger */}
        <div className='md:hidden'>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant='outline' size='icon'>
                <Menu className='h-6 w-6' />
                <span className='sr-only'>Open navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side='left'>
              <nav className='grid gap-4 text-lg font-medium mt-6'>
                <SheetClose asChild>
                  <Link to='/' className='flex items-center gap-2 text-lg font-semibold mb-4'>
                    <BookMarked className='h-6 w-6' />
                    <span>Manov</span>
                  </Link>
                </SheetClose>
                {navLinksToDisplay.map((link) => (
                  <SheetClose asChild key={link.to}>
                    <NavLink
                      to={link.to}
                      className={({ isActive }) =>
                        `flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary ${
                          isActive ? "text-primary bg-muted" : "text-muted-foreground"
                        }`
                      }>
                      {link.label}
                    </NavLink>
                  </SheetClose>
                ))}
                <hr className='my-2' />
                {/* Mobile Auth Links */}
                {user ? (
                  <>
                    <SheetClose asChild>
                      <NavLink
                        to='/profile/me'
                        className={({ isActive }) =>
                          `flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary ${
                            isActive ? "text-primary bg-muted" : "text-muted-foreground"
                          }`
                        }>
                        <UserCircle className='h-5 w-5' /> Profile
                      </NavLink>
                    </SheetClose>
                    <Button
                      variant='ghost'
                      onClick={handleLogout}
                      className='justify-start gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:text-primary'>
                      <LogOut className='h-5 w-5' /> Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <SheetClose asChild>
                      <NavLink
                        to='/login'
                        className={({ isActive }) =>
                          `flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary ${
                            isActive ? "text-primary bg-muted" : "text-muted-foreground"
                          }`
                        }>
                        Login
                      </NavLink>
                    </SheetClose>
                    <SheetClose asChild>
                      <NavLink
                        to='/register'
                        className={({ isActive }) =>
                          `flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary ${
                            isActive ? "text-primary bg-muted" : "text-muted-foreground"
                          }`
                        }>
                        Register
                      </NavLink>
                    </SheetClose>
                  </>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>

        {/* Site Name for Mobile View (when menu is closed) - if needed and distinct from trigger */}
        <div className='md:hidden'>
          {" "}
          {/* This ensures it's only shown when mobile nav trigger is also shown */}
          <Link to='/' className='flex items-center space-x-2'>
            <BookMarked className='h-6 w-6' />
            <span className='font-bold'>Manov</span>
          </Link>
        </div>

        <div className='flex items-center gap-3'>
          <ModeToggle />
          {!isLoading &&
            (user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant='secondary' size='icon' className='rounded-full'>
                    <Avatar className='h-8 w-8'>
                      <AvatarImage src={user.avatarUrl || undefined} alt={user.displayName || user.username} />
                      <AvatarFallback>
                        {(user.displayName || user.username || "U").substring(0, 1).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className='sr-only'>Toggle user menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end'>
                  <DropdownMenuLabel>
                    <div className='flex flex-col space-y-1'>
                      <p className='text-sm font-medium leading-none'>{user.displayName || user.username}</p>
                      <p className='text-xs leading-none text-muted-foreground'>{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to='/profile/me'>
                      <UserCircle className='mr-2 h-4 w-4' /> Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className='mr-2 h-4 w-4' /> Settings (Soon)
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className='mr-2 h-4 w-4' /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className='hidden md:flex items-center gap-2'>
                <Button variant='ghost' asChild>
                  <Link to='/login'>Login</Link>
                </Button>
                <Button asChild>
                  <Link to='/register'>Register</Link>
                </Button>
              </div>
            ))}
          {
            isLoading && (
              <div className='w-8 h-8 bg-muted rounded-full animate-pulse'></div>
            ) /* Placeholder for loading avatar */
          }
        </div>
      </div>
    </header>
  )
}
