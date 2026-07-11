import { Toaster } from "@/components/ui/toaster"
import { HashRouter as Router, Route, Routes } from 'react-router-dom';
import ScrollToTop from './components/ScrollToTop';
import Simulator from './pages/Simulator';

function App() {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Simulator />} />
      </Routes>
      <Toaster />
    </Router>
  )
}

export default App
