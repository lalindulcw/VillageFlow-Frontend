import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';

import Login from './Login';
import Register from './Register';
import Profile from './Profile';
import Member2Certificates from './components/Member2Certificates';
import GramaNiladhariDashboard from './components/GramaNiladhariDashboard';
import VerifyCertificate from './components/VerifyCertificate';
import WelfarePage from './components/WelfarePage'; 
import ApplyWelfare from './components/ApplyWelfare'; 
import NoticePage from './components/NoticePage'; 
import AppointmentPage from './components/AppointmentPage'; // 👈 Smart Appointments එක මෙතනට එක් කළා

function AppContent() {
    const [page, setPage] = useState('login');
    const [user, setUser] = useState(null);
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const loggedInUser = localStorage.getItem('user');
        if (loggedInUser && loggedInUser !== "undefined") {
            const parsedUser = JSON.parse(loggedInUser);
            setUser(parsedUser);
            if (!location.pathname.startsWith('/verify/')) {
                setPage(parsedUser.role === 'officer' ? 'gn-dashboard' : 'profile');
            }
        }
    }, []); 

    const handleLoginSuccess = () => {
        const loggedInUser = JSON.parse(localStorage.getItem('user'));
        setUser(loggedInUser);
        setPage(loggedInUser.role === 'officer' ? 'gn-dashboard' : 'profile');
        navigate(loggedInUser.role === 'officer' ? '/gn-dashboard' : '/profile');
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        setUser(null);
        setPage('login');
        navigate('/login');
    };

    const showNavBar = user && !location.pathname.startsWith('/verify/');

    return (
        <div style={{ backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
            {showNavBar && (
                <nav style={styles.navBar}>
                    <div style={styles.logo}>VillageFlow</div>
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        {/* Noticeboard ලින්ක් එක */}
                        <button onClick={() => { setPage('notices'); navigate('/notices'); }} style={page === 'notices' ? styles.activeLink : styles.link}>Noticeboard</button>
                        
                        {/* Appointments ලින්ක් එක (සියලු දෙනාටම පේනවා) */}
                        <button onClick={() => { setPage('appointments'); navigate('/appointments'); }} style={page === 'appointments' ? styles.activeLink : styles.link}>Appointments</button>

                        {user.role !== 'officer' && (
                            <>
                                <button onClick={() => { setPage('profile'); navigate('/profile'); }} style={page === 'profile' ? styles.activeLink : styles.link}>Profile</button>
                                <button onClick={() => { setPage('certificates'); navigate('/certificates'); }} style={page === 'certificates' ? styles.activeLink : styles.link}>Certificates</button>
                                <button onClick={() => { setPage('apply-welfare'); navigate('/apply-welfare'); }} style={page === 'apply-welfare' ? styles.activeLink : styles.link}>Welfare Apply</button>
                            </>
                        )}
                        {user.role === 'officer' && (
                            <>
                                <button onClick={() => { setPage('gn-dashboard'); navigate('/gn-dashboard'); }} style={page === 'gn-dashboard' ? styles.activeLink : styles.link}>GN Dashboard</button>
                                <button onClick={() => { setPage('welfare-manage'); navigate('/welfare-manage'); }} style={page === 'welfare-manage' ? styles.activeLink : styles.link}>Welfare Manage</button>
                            </>
                        )}
                        <button onClick={handleLogout} style={styles.logoutBtn}>Logout</button>
                    </div>
                </nav>
            )}

            <Routes>
                <Route path="/verify/:id" element={<VerifyCertificate />} />

                <Route path="/" element={
                    !user ? (
                        <div style={{ textAlign: 'center', backgroundColor: '#f0f4f8', minHeight: '100vh' }}>
                            <div style={{ padding: '40px 20px', display: 'flex', justifyContent: 'center', gap: '10px' }}>
                                <button onClick={() => setPage('login')} style={page === 'login' ? styles.activeNav : styles.navBtn}>Login</button>
                                <button onClick={() => setPage('register')} style={page === 'register' ? styles.activeNav : styles.navBtn}>Register</button>
                            </div>
                            {page === 'login' ? <Login onLoginSuccess={handleLoginSuccess} onSwitchToRegister={() => setPage('register')} /> : <Register onSwitchToLogin={() => setPage('login')} />}
                        </div>
                    ) : (
                        <div style={{ padding: '20px' }}>
                            {page === 'profile' && <Profile />}
                            {page === 'certificates' && <Member2Certificates />}
                            {page === 'gn-dashboard' && <GramaNiladhariDashboard />}
                            {page === 'welfare-manage' && <WelfarePage />}
                            {page === 'apply-welfare' && <ApplyWelfare />}
                            {page === 'notices' && <NoticePage />}
                            {page === 'appointments' && <AppointmentPage />} {/* 👈 මම මෙතනට එක් කළා */}
                        </div>
                    )
                } />
                
                <Route path="/profile" element={user ? <Profile /> : <Navigate to="/" />} />
                <Route path="/certificates" element={user ? <Member2Certificates /> : <Navigate to="/" />} />
                <Route path="/gn-dashboard" element={user?.role === 'officer' ? <GramaNiladhariDashboard /> : <Navigate to="/" />} />
                <Route path="/welfare-manage" element={user?.role === 'officer' ? <WelfarePage /> : <Navigate to="/" />} />
                <Route path="/apply-welfare" element={user ? <ApplyWelfare /> : <Navigate to="/" />} />
                <Route path="/notices" element={user ? <NoticePage /> : <Navigate to="/" />} />
                <Route path="/appointments" element={user ? <AppointmentPage /> : <Navigate to="/" />} /> {/* 👈 මම මෙතනට එක් කළා */}

                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        </div>
    );
}

function App() {
    return (
        <Router>
            <AppContent />
        </Router>
    );
}

const styles = {
    navBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 50px', background: '#800000', color: 'white', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' },
    logo: { fontSize: '22px', fontWeight: '900', letterSpacing: '1px' },
    navBtn: { padding: '10px 25px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: '#e0e0e0', fontWeight: 'bold' },
    activeNav: { padding: '10px 25px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: '#800000', color: 'white', fontWeight: 'bold' },
    link: { background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' },
    activeLink: { background: 'transparent', border: 'none', color: '#fbc531', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px', borderBottom: '2px solid #fbc531' },
    logoutBtn: { padding: '8px 15px', borderRadius: '5px', border: '1px solid white', background: 'transparent', color: 'white', cursor: 'pointer', fontWeight: 'bold' }
};

export default App;