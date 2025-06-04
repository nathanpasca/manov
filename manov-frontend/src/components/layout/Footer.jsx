import { Separator } from "@/components/ui/separator"

export function Footer() {
  const currentYear = new Date().getFullYear()
  return (
    <footer className='border-t'>
      <div className='py-8 text-center text-sm text-muted-foreground px-4 sm:px-6 lg:px-8'>
        {" "}
        {/* MODIFIED: Removed 'container', added padding */}
        <Separator className='my-4 md:hidden' />
        <p>&copy; {currentYear} Manov. All rights reserved.</p>
        <p className='mt-1'>Built with React, Tailwind CSS, and Shadcn/UI.</p>
      </div>
    </footer>
  )
}
