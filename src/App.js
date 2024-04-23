import "./App.css"
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import HomePage from "./Pages/HomePage"
import NavBar from "./Components/Component/NavBar"
import { ChakraProvider } from "@chakra-ui/react"
import RegisterPage from "./Pages/RegisterPage"

function App() {
  return (
    <ChakraProvider>
      <div className='App'>
        <NavBar />
        <Router>
          <Routes>
            <Route path='/' element={<HomePage />} />
            <Route path='/register' element={<RegisterPage />} />
          </Routes>
        </Router>
      </div>
    </ChakraProvider>
  )
}

export default App
