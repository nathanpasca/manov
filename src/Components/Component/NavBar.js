import Brightness3Icon from "@mui/icons-material/Brightness3"
import WbSunnyIcon from "@mui/icons-material/WbSunny"
import { useState, useEffect } from "react"
import { auth } from "../../firebase"
import { Logout } from "../Auth/Logout"
import { Link } from "react-router-dom"
function NavBar() {
  // use theme from local storage if available or set light theme
  const [theme, setTheme] = useState(localStorage.getItem("theme") ? localStorage.getItem("theme") : "manov-light")
  const [currentUser, setCurrentUser] = useState(null)

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user)
    })
    return unsubscribe
  }, [])
  // update state on toggle
  const handleToggle = (e) => {
    if (e.target.checked) {
      setTheme("manov-dark")
    } else {
      setTheme("manov-light")
    }
  }

  // set theme state in localstorage on mount & also update localstorage on state change
  useEffect(() => {
    localStorage.setItem("theme", theme)
    const localTheme = localStorage.getItem("theme")
    // add custom data-theme attribute to html tag required to update theme using DaisyUI
    document.querySelector("html").setAttribute("data-theme", localTheme)
  }, [theme])

  return (
    <>
      <div class='navbar bg-base-100 '>
        <div class='navbar-start'>
          <div class='dropdown z-10'>
            <label tabindex='0' class='btn btn-ghost lg:hidden'>
              <svg
                xmlns='http://www.w3.org/2000/svg'
                class='h-5 w-5'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'>
                <path stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M4 6h16M4 12h8m-8 6h16' />
              </svg>
            </label>
            <ul tabindex='0' class='menu menu-sm dropdown-content mt-3 z-[1] p-2 shadow bg-base-100 rounded-box w-52 '>
              <li>
                <Link to='/'>Home</Link>
              </li>
              <li>
                <a>Parent</a>
                <ul class='p-2'>
                  <li>
                    <a>Submenu 1</a>
                  </li>
                  <li>
                    <a>Submenu 2</a>
                  </li>
                </ul>
              </li>
              <li>
                <a>Item 3</a>
              </li>
            </ul>
          </div>
          <a class='btn btn-ghost normal-case text-xl'>Manov</a>
        </div>
        <div class='navbar-center hidden lg:flex z-10'>
          <ul class='menu menu-horizontal px-1'>
            <li>
              <Link to='/' className='text-base'>
                Home
              </Link>
            </li>
            <li tabindex='0'>
              <details>
                <summary className='text-base'>Manga</summary>
                <ul class='p-2'>
                  <li>
                    <a className='text-base'>Top Rated</a>
                  </li>
                  <li>
                    <a className='text-base'>Popular</a>
                  </li>
                </ul>
              </details>
            </li>
            <li tabindex='1'>
              <details>
                <summary className='text-base'>Novel</summary>
                <ul class='p-2'>
                  <li>
                    <a className='text-base'>Top Rated</a>
                  </li>
                  <li>
                    <a className='text-base'>Popular</a>
                  </li>
                </ul>
              </details>
            </li>
            <li>
              <Link to='/create-novel' className='text-base'>
                Create
              </Link>
            </li>
          </ul>
        </div>
        <div class='navbar-end mx-4'>
          <button className='btn btn-square btn-ghost mx-4'>
            <label className='swap swap-rotate w-12 h-12'>
              <input
                type='checkbox'
                onChange={handleToggle}
                // show toggle image based on localstorage theme
                checked={theme === "manov-light" ? false : true}
              />
              {/* light theme sun image */}
              <WbSunnyIcon alt='manov-light' className='w-8 h-8 swap-on' />
              {/* dark theme moon image */}
              <Brightness3Icon alt='manov-dark' className='w-8 h-8 swap-off' />
            </label>
          </button>
          {currentUser ? (
            <Logout />
          ) : (
            <button className='btn btn-outline'>
              <Link to='/login'>LOGIN</Link>
            </button>
          )}
        </div>
      </div>
    </>
  )
}

export default NavBar
