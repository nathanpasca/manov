import { Outlet } from "react-router-dom"
import { Header } from "@/components/layout/Header"
import { Footer } from "@/components/layout/Footer"

export function MainLayout() {
  return (
    <div className='flex min-h-screen min-w-screen flex-col'>
      <Header /> {/* This will take the full width available IF Header's content allows */}
      <main className='flex-grow py-8'>
        {" "}
        {/* Assuming this is now full width */}
        <Outlet />
      </main>
      <Footer /> {/* This will take the full width available IF Footer's content allows */}
    </div>
  )
}
