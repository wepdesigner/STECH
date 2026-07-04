import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Landing from "../Pages/Landing";
import Appointment from "../Pages/Appointment";
import AdminPanel from "../Pages/Admin/AdminPanel";
import DoctorPanel from "../Pages/Doctor/DoctorPanel";
import PatientPanel from "../Pages/Patient/PatientPanel";
import Register from "../Components/Register";
import Login from "../Components/Login";
import Footer from "../Components/Footer";
import Testimonial from "../Components/Testimonial";
import Services from "../Pages/Services";
import Department from "../Pages/Department";
import Contact from "../Pages/Contact";
import DoctorPage from "../Pages/DoctorPage";
import Auth from "../Components/Auth";
import LiveMap from "../Pages/Doctor/LiveMap";
import VideoCall from "../Pages/Doctor/VideoCall";
import Shared from "../Pages/Doctor/Shared";
function Routers(){
    return (
        <Router>
            <Routes>
                <Route path='/' element={<Landing/>}/>
                <Route path='/appointment' element={<Appointment />} />
                <Route path='/adminpanel' element={<AdminPanel />} />
                <Route path='/doctorpanel' element={<DoctorPanel />} />
                <Route path='/doctorpage' element={<DoctorPage />} />
                <Route path='/patientpanel' element={<PatientPanel />} />
                <Route path='/register' element={<Register />} />
                <Route path='/login' element={<Login />} />
                <Route path='/footer' element={<Footer />} />
                <Route path='/services' element={<Services />} />
                <Route path='/contact' element={<Contact />} />
                <Route path='/doctorpanel' element={<DoctorPage />} />
                <Route path='/department' element={<Department />} />
                <Route path='/testimonial' element={<Testimonial />} />
                <Route path='/auth' element={<Auth />} />
                <Route path='/livemap' element={<LiveMap />} />
                <Route path='/videocall' element={<VideoCall />} />
                <Route path='/shared' element={<Shared />} />
            </Routes>
        </Router>
    );
}

export default Routers;