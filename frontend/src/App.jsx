import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Home from './pages/Home'
import BackgroundShapes from './components/BackgroundShapes'
import Navbar from './components/Navbar'
import './App.css'

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
function App() {
  return (
    <Router>
      <div className="App relative">
        <BackgroundShapes />
        <div className="relative z-10">
          <Navbar />
          <Routes>
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/home" element={<Home />} />
          </Routes>
        </div>
      </div>
    </Router>
  )
}

export default App
