import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Home from './pages/Home'
import Tjanster from './pages/Tjanster'
import Register from './pages/Register'
import Login from './pages/Login'
import Profile from './pages/Profile'
import CreateService from './pages/CreateService'
import ServiceDetail from './pages/ServiceDetail'
import Orders from './pages/Orders'
import Requests from './pages/Requests'
import CreateRequest from './pages/CreateRequest'
import RequestDetail from './pages/RequestDetail'
import Interests from './pages/Interests'
import PublicProfile from './pages/PublicProfile'
import OrderDetail from './pages/OrderDetail'
import Notifications from './pages/Notifications'




function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tjanster" element={<Tjanster />} />
        <Route path="/registrera" element={<Register />} />
        <Route path="/logga-in" element={<Login />} />
        <Route path="/profil" element={<Profile />} />
        <Route path="/skapa-inlagg" element={<CreateService />} />
        <Route path="/tjanst/:id" element={<ServiceDetail />} />
        <Route path="/bestallningar" element={<Orders />} />
        <Route path="/forfragningar" element={<Requests />} />
        <Route path="/skapa-forfragning" element={<CreateRequest />} />
        <Route path="/forfragning/:id" element={<RequestDetail />} />
        <Route path="/intresseanmalningar" element={<Interests />} />
        <Route path="/svippare/:id" element={<PublicProfile />} />
        <Route path="/bestallning/:id" element={<OrderDetail />} />
        <Route path="/notifikationer" element={<Notifications />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  )
}

export default App