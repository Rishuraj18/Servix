// import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
// import Navbar from './layouts/Navbar';
// import Home from './pages/Home';
// import Login from './pages/Login';
// import Register from './pages/Register';
// import Services from './pages/Services';
// import PostTask from './pages/PostTask';
// import UserDashboard from './pages/UserDashboard';
// import AdminDashboard from './pages/AdminDashboard';
// import { useEffect } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { logout, setUser } from './features/authSlice';
// import api from './api/client';

// function AppContent() {
//   const location = useLocation();
//   const isAdminPath = location.pathname.startsWith('/dashboard/admin');

//   if (isAdminPath) {
//     return (
//       <Routes>
//         <Route path="/dashboard/admin" element={<AdminDashboard />} />
//       </Routes>
//     );
//   }

//   return (
//     <div className="min-h-screen bg-light dark:bg-dark text-slate-800 dark:text-slate-200">
//       <Navbar />
//       <main className="container mx-auto px-4 py-6">
//         <Routes>
//           <Route path="/" element={<Home />} />
//           <Route path="/login" element={<Login />} />
//           <Route path="/register" element={<Register />} />
//           <Route path="/services" element={<Services />} />
//           <Route path="/post-task" element={<PostTask />} />
//           <Route path="/dashboard/user" element={<UserDashboard />} />
//         </Routes>
//       </main>
//     </div>
//   );
// }

// function App() {
//   const dispatch = useDispatch();
//   const { token } = useSelector((state) => state.auth);

//   useEffect(() => {
//     if (!token) return;

//     api.get('/auth/me')
//       .then((res) => dispatch(setUser(res.data.data)))
//       .catch(() => dispatch(logout()));
//   }, [dispatch, token]);

//   return (
//     <Router>
//       <AppContent />
//     </Router>
//   );
// }

// export default App;



import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import Navbar from "./layouts/Navbar";

import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Services from "./pages/Services";
import PostTask from "./pages/PostTask";
import UserDashboard from "./pages/UserDashboard";
import AdminDashboard from "./pages/AdminDashboard";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logout, setUser } from "./features/authSlice";
import api from "./api/client";

// import AdminRoute from "./routes/AdminRoute";

/* ---------------- APP CONTENT ---------------- */

function AppContent() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { token, user } = useSelector((state) => state.auth);

  /* ---------------- FETCH USER ON LOAD ---------------- */
  useEffect(() => {
    if (!token) return;

    api
      .get("/auth/me")
      .then((res) => dispatch(setUser(res.data.data)))
      .catch(() => dispatch(logout()));
  }, [dispatch, token]);

  /* ---------------- ADMIN AUTO LOCK ---------------- */
  useEffect(() => {
    if (user?.role === "admin") {
      if (!location.pathname.startsWith("/dashboard/admin")) {
        navigate("/dashboard/admin", { replace: true });
      }
    }
  }, [user, location, navigate]);

  return (
    <div className="min-h-screen bg-light dark:bg-dark text-slate-800 dark:text-slate-200">

      {/* Navbar hidden for admin if you want */}
      {user?.role !== "admin" && <Navbar />}

      <main className="container mx-auto ">
        <Routes>

          {/* PUBLIC ROUTES */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/services" element={<Services />} />
          <Route path="/post-task" element={<PostTask />} />

          {/* USER DASHBOARD */}
          <Route path="/dashboard/user" element={<UserDashboard />} />

          {/* ADMIN (PROTECTED + LOCKED) */}
          <Route
            path="/dashboard/admin"
            element={
              // <AdminRoute>
                <AdminDashboard />
              // </AdminRoute>
            }
          />

        </Routes>
      </main>
    </div>
  );
}

/* ---------------- ROOT APP ---------------- */

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;