import React, { useState } from 'react';
import axios from 'axios';
import { Globe, User, ShieldCheck, AlertCircle, ArrowRight, Lock, Landmark, Loader2 } from 'lucide-react';

const translations = {
    en: { 
        title: "Village Administrative Services", 
        gov: "Government Digital Access Portal",
        citizen: "Citizen", 
        officer: "Officer", 
        nic: "NIC Number", 
        pass: "Password", 
        btn: "Secure Sign In", 
        proxy: "Elderly Care Proxy Registration", 
        noAccount: "Not registered yet?", 
        register: "Register Now" 
    },
    si: { 
        title: "ග්‍රාමීය පරිපාලන සේවය", 
        gov: "රාජ්‍ය ඩිජිටල් පිවිසුම් ද්වාරය",
        citizen: "පුරවැසියා", 
        officer: "නිලධාරියා", 
        nic: "NIC අංකය", 
        pass: "මුරපදය", 
        btn: "ආරක්ෂිතව ඇතුළු වන්න", 
        proxy: "වැඩිහිටි ලියාපදිංචි සහය (ප්‍රොක්සි)", 
        noAccount: "තවමත් ලියාපදිංචි වී නැද්ද?", 
        register: "දැන් ලියාපදිංචි වන්න" 
    },
    ta: { 
        title: "கிராம நிர்வாக சேவைகள்", 
        gov: "அரசாங்க டிஜிட்டல் அணுகல் போர்டல்",
        citizen: "குடிமகன்", 
        officer: "அதிகாரி", 
        nic: "NIC எண்", 
        pass: "கடவுச்சொல்", 
        btn: "பாதுகாப்பான உள்நுழைவு", 
        proxy: "முதியோர் பராமரிப்பு பதிவு", 
        noAccount: "இன்னும் பதிவு செய்யவில்லையா?", 
        register: "இப்போது பதிவு செய்யுங்கள்" 
    }
};

function Login({ onLoginSuccess, onSwitchToRegister }) {
    const [lang, setLang] = useState('si');
    const [role, setRole] = useState('citizen');
    const [credentials, setCredentials] = useState({ nic: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const t = translations[lang];

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        // Validation: NIC එක හිස්දැයි බැලීම
        if (!credentials.nic || !credentials.password) {
            setError("කරුණාකර සියලුම තොරතුරු ඇතුළත් කරන්න.");
            setLoading(false);
            return;
        }

        try {
            const res = await axios.post('https://villageflow-backend.onrender.com/api/auth/login', { 
                nic: credentials.nic.trim(), 
                password: credentials.password,
                role: role 
            });

            // දත්ත පරීක්ෂාව - Console එකේ බලන්න දත්ත එන හැටි
            console.log("Login Success Response:", res.data);

            if (res.data && res.data.user) {
                // ඉතා වැදගත්: email එක සහ අනෙකුත් විස්තර හරියටම save කරමු
                const userToStore = {
                    _id: res.data.user._id,
                    fullName: res.data.user.fullName,
                    nic: res.data.user.nic,
                    email: res.data.user.email, // Backend එකෙන් එන email එක මෙහිදී ලැබෙනවා
                    role: res.data.user.role
                };
                
                localStorage.setItem('user', JSON.stringify(userToStore));
                
                // සාර්ථකව login වූ පසු Dashboard එකට යැවීම
                onLoginSuccess();
            } else {
                throw new Error("User data object is missing in response");
            }

        } catch (err) {
            console.error("Login Error:", err);
            const errorMsg = err.response?.data?.msg || "ඇතුළත් කළ තොරතුරු වැරදියි. කරුණාකර නැවත උත්සාහ කරන්න.";
            setError(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.pageWrapper}>
            <div style={styles.mainCard}>
                {/* Left Panel - Branding */}
                <div style={styles.leftPanel}>
                    <div style={styles.overlay}>
                        <Landmark size={60} color="#fbc531" />
                        <h2 style={styles.govText}>{t.gov}</h2>
                        <div style={styles.divider}></div>
                        <h1 style={styles.portalName}>VillageFlow</h1>
                        <p style={styles.tagline}>Official Digital Interface for Rural Administrative Affairs</p>
                    </div>
                </div>

                {/* Right Panel - Login Form */}
                <div style={styles.rightPanel}>
                    <div style={styles.langBar}>
                        {['en', 'si', 'ta'].map((l) => (
                            <span 
                                key={l}
                                onClick={() => setLang(l)} 
                                style={lang === l ? styles.activeLang : styles.langBtn}
                            >
                                {l === 'en' ? 'ENGLISH' : l === 'si' ? 'සිංහල' : 'தமிழ்'}
                            </span>
                        ))}
                    </div>

                    <div style={styles.formHeader}>
                        <h2 style={styles.titleStyle}>{t.title}</h2>
                        <div style={styles.secureBadge}><ShieldCheck size={14} /> Official Access Secured</div>
                    </div>

                    <div style={styles.roleToggle}>
                        <button 
                            onClick={() => setRole('citizen')} 
                            style={role === 'citizen' ? styles.activeRole : styles.inactiveRole}
                        >
                            {t.citizen}
                        </button>
                        <button 
                            onClick={() => setRole('officer')} 
                            style={role === 'officer' ? styles.activeRole : styles.inactiveRole}
                        >
                            {t.officer}
                        </button>
                    </div>

                    {error && (
                        <div style={styles.errorBox}>
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}

                    <form onSubmit={handleLogin}>
                        <div style={styles.fieldContainer}>
                            <label style={styles.label}>{t.nic}</label>
                            <div style={styles.inputGroup}>
                                <User style={styles.inputIcon} size={18} />
                                <input 
                                    type="text" 
                                    style={styles.inputStyle} 
                                    placeholder="e.g. 199012345678" 
                                    value={credentials.nic}
                                    onChange={e => setCredentials({...credentials, nic: e.target.value})} 
                                    required 
                                />
                            </div>
                        </div>

                        <div style={styles.fieldContainer}>
                            <label style={styles.label}>{t.pass}</label>
                            <div style={styles.inputGroup}>
                                <Lock style={styles.inputIcon} size={18} />
                                <input 
                                    type="password" 
                                    style={styles.inputStyle} 
                                    placeholder="••••••••" 
                                    value={credentials.password}
                                    onChange={e => setCredentials({...credentials, password: e.target.value})} 
                                    required 
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            style={loading ? styles.disabledBtn : styles.mainBtn} 
                            disabled={loading}
                        >
                            {loading ? (
                                <><Loader2 size={18} className="animate-spin" /> Verifying...</>
                            ) : (
                                <>{t.btn.toUpperCase()} <ArrowRight size={18} /></>
                            )}
                        </button>
                    </form>

                    <div style={styles.footer}>
                        <p style={styles.footerText}>
                            {t.noAccount} <span onClick={onSwitchToRegister} style={styles.linkText}>{t.register}</span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

const styles = {
    pageWrapper: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5', padding: '20px', fontFamily: 'Inter, sans-serif' },
    mainCard: { display: 'flex', background: 'white', borderRadius: '16px', overflow: 'hidden', width: '100%', maxWidth: '1000px', minHeight: '620px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)' },
    leftPanel: { flex: '1', background: 'linear-gradient(135deg, #800000 0%, #4a0000 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', padding: '40px', position: 'relative' },
    overlay: { textAlign: 'center', zIndex: 2 },
    govText: { fontSize: '13px', color: '#fbc531', letterSpacing: '2px', textTransform: 'uppercase', marginTop: '20px', fontWeight: 'bold' },
    divider: { height: '3px', width: '50px', background: '#fbc531', margin: '20px auto', borderRadius: '2px' },
    portalName: { fontSize: '48px', fontWeight: '900', margin: 0, letterSpacing: '-1px' },
    tagline: { fontSize: '14px', opacity: 0.9, marginTop: '10px', lineHeight: '1.5' },
    rightPanel: { flex: '1.2', padding: '50px', display: 'flex', flexDirection: 'column', backgroundColor: '#fff' },
    langBar: { display: 'flex', justifyContent: 'flex-end', gap: '15px', marginBottom: '30px' },
    langBtn: { fontSize: '12px', color: '#94a3b8', cursor: 'pointer', fontWeight: '600', transition: 'color 0.2s' },
    activeLang: { fontSize: '12px', fontWeight: '800', color: '#800000', borderBottom: '2px solid #800000', paddingBottom: '2px' },
    formHeader: { marginBottom: '35px' },
    titleStyle: { fontSize: '28px', fontWeight: '800', color: '#1e293b', marginBottom: '5px' },
    secureBadge: { display: 'flex', alignItems: 'center', gap: '5px', color: '#10b981', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase' },
    roleToggle: { display: 'flex', background: '#f1f5f9', padding: '6px', borderRadius: '12px', marginBottom: '30px' },
    activeRole: { flex: 1, padding: '12px', border: 'none', borderRadius: '8px', background: '#800000', color: 'white', fontWeight: '700', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', cursor: 'default' },
    inactiveRole: { flex: 1, padding: '12px', border: 'none', background: 'transparent', color: '#64748b', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' },
    fieldContainer: { marginBottom: '22px' },
    label: { fontSize: '12px', fontWeight: '700', color: '#475569', marginBottom: '8px', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px' },
    inputGroup: { position: 'relative' },
    inputIcon: { position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: '#800000' },
    inputStyle: { width: '100%', padding: '14px 16px 14px 48px', borderRadius: '10px', border: '1.5px solid #e2e8f0', outline: 'none', fontSize: '15px', transition: 'border-color 0.2s' },
    mainBtn: { width: '100%', padding: '16px', background: '#800000', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', fontSize: '16px', transition: 'transform 0.1s, background 0.2s' },
    disabledBtn: { background: '#cbd5e1', width: '100%', padding: '16px', borderRadius: '10px', border: 'none', color: '#64748b', cursor: 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' },
    errorBox: { padding: '14px', background: '#fef2f2', color: '#b91c1c', borderRadius: '10px', fontSize: '14px', marginBottom: '25px', display: 'flex', alignItems: 'center', gap: '10px', border: '1px solid #fee2e2' },
    footer: { marginTop: 'auto', textAlign: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '25px' },
    footerText: { fontSize: '14px', color: '#64748b' },
    linkText: { color: '#800000', fontWeight: '800', cursor: 'pointer', textDecoration: 'none', marginLeft: '5px' }
};

export default Login;