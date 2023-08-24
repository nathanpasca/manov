import './App.css';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Homepage from './Pages/Homepage';
import NavBar from './Components/Component/NavBar';

function App() {
  return (
    <div className="App">
      <NavBar/>
        <Router>
          <Routes>
            <Route path='/' element={<Homepage />} />
          </Routes>
        </Router>
    </div>
  );
}

export default App;
