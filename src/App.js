import "./App.css"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import HomePage from "./Pages/HomePage"
import NavBar from "./Components/Component/NavBar"

import RegisterPage from "./Pages/RegisterPage"
import LoginPage from "./Pages/LoginPage"
import CreateNovelPage from "./Pages/CreateNovelPage"

function App() {
  return (
    <div className='App'>
      <NavBar />
      <Routes>
        <Route path='/' element={<HomePage />} />
        <Route path='/register' element={<RegisterPage />} />
        <Route path='/login' element={<LoginPage />} />
        <Route path='/create-novel' element={<CreateNovelPage />} />
      </Routes>
    </div>
  )
}

export default App
