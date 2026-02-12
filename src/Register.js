import React, { useState } from 'react';
import axios from 'axios';
import { UserPlus, Landmark, ArrowRight } from 'lucide-react';

const translations = {
    en: { 
        title: "Create Account", gov: "Gov Digital Access", sub: "Join VillageFlow - Bibile",
        name: "Full Name", nic: "NIC Number", email: "Email Address", pass: "Password", 
        role: "Role", district: "District", ds: "Divisional Secretariat",
        gn: "GN Division", secKey: "Officer Key", btn: "Register Account",
        err_key: "Invalid Key!", success: "Registration Successful!"
    },
    si: { 
        title: "ගිණුමක් සාදන්න", gov: "රාජ්‍ය ඩිජිටල් පිවිසුම", sub: "VillageFlow සමඟ එක්වන්න - බිබිලේ",
        name: "සම්පූර්ණ නම", nic: "NIC අංකය", email: "විද්‍යුත් තැපෑල", pass: "මුරපදය", 
        role: "භූමිකාව", district: "දිස්ත්‍රික්කය", ds: "ප්‍රාදේශීය ලේකම් කාර්යාලය",
        gn: "ග්‍රාම නිලධාරී වසම", secKey: "නිලධාරී කේතය", btn: "ලියාපදිංචි වන්න",
        err_key: "වැරදි කේතයකි!", success: "ලියාපදිංචිය සාර්ථකයි!"
    },
    ta: { 
        title: "கணக்கை உருவாக்கு", gov: "அரச டிஜிட்டல் அணுகல்", sub: "VillageFlow இல் இணையுங்கள் - பிபிலே",
        name: "முழு பெயர்", nic: "NIC எண்", email: "மின்னஞ்சல்", pass: "கடவுச்சொல்", 
        role: "பங்கு", district: "மாவட்டம்", ds: "பிரதேச செயலகம்",
        gn: "கிராம அலுவலர் பிரிவு", secKey: "அதிகாரி குறியீடு", btn: "பதிவு செய்க",
        err_key: "தவறான குறியீடு!", success: "பதிவு வெற்றிகரமாக முடிந்தது!"
    }
};

function Register({ onSwitchToLogin }) {
    const [lang, setLang] = useState('si');
    const [formData, setFormData] = useState({ 
        fullName: '', nic: '', email: '', password: '', role: 'citizen',
        district: 'Monaragala', 
        divisionalSecretariat: 'Bibile', 
        gnDivision: 'Kotagama'
    });
    const [securityKey, setSecurityKey] = useState('');
    const [formErrors, setFormErrors] = useState({}); // Errors පෙන්වීමට අලුතින් එක් කළා
    const [loading, setLoading] = useState(false);

    const OFFICIAL_KEY = "SL-GOV-2026";
    const t = translations[lang];

    const handleRegister = async (e) => {
        e.preventDefault();
        setFormErrors({}); // කලින් තිබූ errors reset කිරීම

        if (formData.role === 'officer' && securityKey !== OFFICIAL_KEY) {
            setFormErrors({ securityKey: t.err_key });
            return;
        }

        setLoading(true);
        try {
            const finalData = { ...formData, securityKey };
            await axios.post('https://villageflow-backend.onrender.com/api/auth/register', finalData);
            alert(t.success); // සාර්ථක වූ විට පමණක් Alert එකක් පෙන්වමු
            onSwitchToLogin();
        } catch (err) { 
            // Backend එකෙන් එන Errors ටික state එකට දාමු
            if (err.response && err.response.data.errors) {
                setFormErrors(err.response.data.errors);
            } else {
                setFormErrors({ general: err.response?.data?.msg || "Registration Failed!" });
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={styles.pageWrapper}>
            <div style={styles.mainCard}>
                <div style={styles.leftPanel}>
                    <Landmark size={50} color="#fbc531" />
                    <h2 style={styles.govText}>{t.gov}</h2>
                    <h1 style={styles.portalName}>VillageFlow</h1>
                    <p style={styles.tagline}>{t.sub}</p>
                </div>

                <div style={styles.rightPanel}>
                    <div style={styles.langBar}>
                        <span onClick={() => setLang('en')} style={lang === 'en' ? styles.activeLang : styles.langBtn}>EN</span>
                        <span onClick={() => setLang('si')} style={lang === 'si' ? styles.activeLang : styles.langBtn}>සිංහල</span>
                        <span onClick={() => setLang('ta')} style={lang === 'ta' ? styles.activeLang : styles.langBtn}>தமிழ்</span>
                    </div>

                    <form onSubmit={handleRegister} style={styles.formGrid}>
                        {formErrors.general && <div style={styles.generalError}>{formErrors.general}</div>}

                        <div style={styles.fullWidth}>
                            <label style={styles.label}>{t.name}</label>
                            <input 
                                style={{...styles.inputStyle, borderColor: formErrors.fullName ? '#ff4757' : '#ccc'}} 
                                onChange={e => setFormData({...formData, fullName: e.target.value})} 
                            />
                            {formErrors.fullName && <span style={styles.errorText}>{formErrors.fullName}</span>}
                        </div>

                        <div style={styles.halfWidth}>
                            <label style={styles.label}>{t.nic}</label>
                            <input 
                                style={{...styles.inputStyle, borderColor: formErrors.nic ? '#ff4757' : '#ccc'}} 
                                onChange={e => setFormData({...formData, nic: e.target.value})} 
                            />
                            {formErrors.nic && <span style={styles.errorText}>{formErrors.nic}</span>}
                        </div>

                        <div style={styles.halfWidth}>
                            <label style={styles.label}>{t.role}</label>
                            <select style={styles.inputStyle} value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                                <option value="citizen">Citizen</option>
                                <option value="officer">Officer</option>
                            </select>
                        </div>

                        {formData.role === 'officer' && (
                            <div style={styles.fullWidth}>
                                <label style={{...styles.label, color: '#e67e22'}}>{t.secKey}</label>
                                <input 
                                    type="password" 
                                    style={{...styles.inputStyle, borderColor: formErrors.securityKey ? '#ff4757' : '#e67e22'}} 
                                    onChange={e => setSecurityKey(e.target.value)} 
                                />
                                {formErrors.securityKey && <span style={styles.errorText}>{formErrors.securityKey}</span>}
                            </div>
                        )}

                        <div style={styles.halfWidth}>
                            <label style={styles.label}>{t.district}</label>
                            <input style={styles.lockedInput} value={formData.district} readOnly />
                        </div>
                        <div style={styles.halfWidth}>
                            <label style={styles.label}>{t.ds}</label>
                            <input style={styles.lockedInput} value={formData.divisionalSecretariat} readOnly />
                        </div>
                        <div style={styles.fullWidth}>
                            <label style={styles.label}>{t.gn}</label>
                            <input style={styles.lockedInput} value={formData.gnDivision} readOnly />
                        </div>

                        <div style={styles.halfWidth}>
                            <label style={styles.label}>{t.email}</label>
                            <input 
                                type="email" 
                                style={{...styles.inputStyle, borderColor: formErrors.email ? '#ff4757' : '#ccc'}} 
                                onChange={e => setFormData({...formData, email: e.target.value})} 
                            />
                            {formErrors.email && <span style={styles.errorText}>{formErrors.email}</span>}
                        </div>

                        <div style={styles.halfWidth}>
                            <label style={styles.label}>{t.pass}</label>
                            <input 
                                type="password" 
                                style={{...styles.inputStyle, borderColor: formErrors.password ? '#ff4757' : '#ccc'}} 
                                onChange={e => setFormData({...formData, password: e.target.value})} 
                            />
                            {formErrors.password && <span style={styles.errorText}>{formErrors.password}</span>}
                        </div>

                        <button type="submit" style={loading ? styles.disabledBtn : styles.mainBtn} disabled={loading}>
                            {loading ? "..." : t.btn} <ArrowRight size={18} />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

const styles = {
    // ... කලින් තිබූ styles ...
    errorText: { color: '#ff4757', fontSize: '10px', marginTop: '2px', display: 'block', fontWeight: '500' },
    generalError: { width: '100%', padding: '10px', background: '#ffe0e3', color: '#ff4757', borderRadius: '6px', fontSize: '12px', marginBottom: '10px', textAlign: 'center', border: '1px solid #ff4757' },
    pageWrapper: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5', padding: '20px' },
    mainCard: { display: 'flex', background: 'white', borderRadius: '12px', overflow: 'hidden', width: '100%', maxWidth: '850px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' },
    leftPanel: { flex: '0.6', background: '#800000', color: 'white', padding: '40px', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' },
    rightPanel: { flex: '1.4', padding: '30px' },
    formGrid: { display: 'flex', flexWrap: 'wrap', gap: '10px' },
    fullWidth: { width: '100%' },
    halfWidth: { width: '48.5%' },
    label: { fontSize: '11px', fontWeight: 'bold', display: 'block', marginBottom: '4px', color: '#555' },
    inputStyle: { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ccc', outline: 'none', transition: '0.3s' },
    lockedInput: { width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd', background: '#f9f9f9', color: '#777', cursor: 'not-allowed' },
    mainBtn: { width: '100%', padding: '12px', background: '#800000', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', fontWeight: 'bold', marginTop: '10px' },
    langBar: { textAlign: 'right', marginBottom: '15px' },
    langBtn: { margin: '0 8px', cursor: 'pointer', fontSize: '12px', color: '#888' },
    activeLang: { margin: '0 8px', fontWeight: 'bold', color: '#800000', borderBottom: '2px solid #800000', fontSize: '12px' },
    govText: { fontSize: '14px', marginTop: '15px', opacity: 0.9 },
    portalName: { fontSize: '28px', margin: '5px 0' },
    tagline: { fontSize: '12px', opacity: 0.7 }
};

export default Register;