import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { 
  User, Trash2, Edit3, Save, X, 
  UserPlus, Download, LogOut, Landmark, Award, Loader2
} from 'lucide-react';

const translations = {
    en: { 
        title: "Digital ID Card", profile: "Administrative Profile", proxy: "Elderly Care Proxy Registration", 
        name: "Full Name", role: "Designation", edit: "Update Info", delete: "Deactivate Account", 
        download: "DOWNLOAD QR", save: "Save Changes", cancel: "Discard", regBtn: "Authorize Registration", 
        logout: "Secure Logout", nicLabel: "NIC Number", passLabel: "Secure Password", 
        relLabel: "Family Relationship", // අලුතින් එක් කළා
        successMsg: "Profile updated successfully!", proxySuccess: "Proxy registered successfully!"
    },
    si: { 
        title: "ඩිජිටල් හැඳුනුම්පත", profile: "පරිපාලන පැතිකඩ", proxy: "වැඩිහිටි සේවා ප්‍රොක්සි ලියාපදිංචිය", 
        name: "සම්පූර්ණ නම", role: "තනතුර/භූමිකාව", edit: "තොරතුරු යාවත්කාලීන කරන්න", delete: "ගිණුම අක්‍රීය කරන්න", 
        download: "QR පත බාගන්න", save: "සුරකින්න", cancel: "අවලංගු කරන්න", regBtn: "ලියාපදිංචිය අනුමත කරන්න", 
        logout: "ආරක්ෂිතව නික්ම යන්න", nicLabel: "ජාතික හැඳුනුම්පත් අංකය", passLabel: "ආරක්ෂිත මුරපදය", 
        relLabel: "පවුලේ සම්බන්ධතාවය", // අලුතින් එක් කළා
        successMsg: "පැතිකඩ යාවත්කාලීන කිරීම සාර්ථකයි!", proxySuccess: "ප්‍රොක්සි ලියාපදිංචිය සාර්ථකයි!"
    }
};

function Profile() {
    const [user, setUser] = useState(() => {
        const stored = localStorage.getItem('user');
        return stored ? JSON.parse(stored) : {};
    });

    const [lang, setLang] = useState('si');
    const t = translations[lang] || translations.en;
    
    const [isEditing, setIsEditing] = useState(false);
    // ProxyData වලට relationship එකතු කළා
    const [proxyData, setProxyData] = useState({ fullName: '', nic: '', password: '', relationship: '' });
    
    const [errors, setErrors] = useState({});
    const [proxyErrors, setProxyErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (user && Object.keys(user).length > 0) {
            localStorage.setItem('user', JSON.stringify(user));
        }
    }, [user]);

    const handleUpdate = async () => {
        setErrors({});
        setSuccessMessage('');
        try {
            const targetId = user._id || user.id;
            const res = await axios.put(`https://villageflow-backend.onrender.com/api/auth/update/${targetId}`, { 
                fullName: user.fullName 
            });
            const updatedData = { ...res.data.user, id: res.data.user._id };
            setUser(updatedData);
            setSuccessMessage(t.successMsg);
            setIsEditing(false);
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) { 
            if (err.response?.data?.errors) setErrors(err.response.data.errors);
            else setErrors({ general: "Update failed." });
        }
    };

    const handleDelete = async () => {
        if (window.confirm(lang === 'si' ? "මෙම ගිණුම ස්ථිරවම ඉවත් කිරීමට ඔබට අවශ්‍යද?" : "Are you sure?")) {
            try {
                const targetId = user._id || user.id;
                await axios.delete(`https://villageflow-backend.onrender.com/api/auth/delete/${targetId}`);
                localStorage.removeItem('user');
                window.location.href = '/login'; 
            } catch (err) {
                setErrors({ general: "Delete failed." });
            }
        }
    };

    const handleProxyRegister = async (e) => {
        e.preventDefault();
        setProxyErrors({});
        setSuccessMessage('');
        setLoading(true);

        try {
            await axios.post('https://villageflow-backend.onrender.com/api/auth/proxy-register', {
                ...proxyData, 
                officerId: user._id || user.id, 
                role: 'citizen',
                district: user.district || "Monaragala", 
                divisionalSecretariat: user.divisionalSecretariat || "Bibile",
                gnDivision: user.gnDivision || "Kotagama"
            });

            setSuccessMessage(t.proxySuccess);
            setProxyData({ fullName: '', nic: '', password: '', relationship: '' }); // Reset relationship also
            setTimeout(() => setSuccessMessage(''), 4000);
        } catch (err) {
            if (err.response?.data?.errors) {
                setProxyErrors(err.response.data.errors);
            } else {
                setProxyErrors({ general: err.response?.data?.msg || "ලියාපදිංචිය අසාර්ථකයි." });
            }
        } finally {
            setLoading(false);
        }
    };

    const downloadQR = () => {
        const svg = document.querySelector("#qr-svg");
        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width; canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            const link = document.createElement("a");
            link.download = `OFFICIAL_ID_${user.nic}.png`;
            link.href = canvas.toDataURL("image/png");
            link.click();
        };
        img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
    };

    return (
        <div style={styles.pageBg}>
            <header style={styles.header}>
                <div style={styles.headerContent}>
                    <div style={styles.brand}>
                        <Landmark size={28} color="#fbc531" />
                        <div>
                            <h2 style={styles.govTitle}>GOVERNMENT OF SRI LANKA</h2>
                            <p style={styles.portalTitle}>VillageFlow Identity System</p>
                        </div>
                    </div>
                    <div style={styles.headerActions}>
                        <div style={styles.langBar}>
                            <span onClick={() => setLang('en')} style={lang === 'en' ? styles.activeLang : styles.langBtn}>EN</span>
                            <span style={{color: '#fbc531', opacity: 0.5}}>|</span>
                            <span onClick={() => setLang('si')} style={lang === 'si' ? styles.activeLang : styles.langBtn}>සිං</span>
                        </div>
                        <button onClick={() => {localStorage.removeItem('user'); window.location.href='/login';}} style={styles.logoutBtn}>
                            <LogOut size={16} /> {t.logout}
                        </button>
                    </div>
                </div>
            </header>

            <div style={styles.mainWrapper}>
                {successMessage && <div style={styles.successToast}>{successMessage}</div>}
                
                <div style={styles.container}>
                    <aside style={styles.sidebar}>
                        <div style={styles.idCard}>
                            <div style={styles.cardHeader}>OFFICIAL DIGITAL ID</div>
                            <div style={styles.qrContainer}>
                                <QRCodeSVG id="qr-svg" value={`http://${window.location.hostname}:${window.location.port}/verify/${user._id || user.id}`} size={160} level={"H"} />
                            </div>
                            <h3 style={styles.idName}>{user.fullName}</h3>
                            <div style={styles.idRoleBadge}>{user.role?.toUpperCase()}</div>
                            <p style={{fontSize: '12px', color: '#7f8c8d', marginBottom: '10px'}}>NIC: {user.nic}</p>
                            <button onClick={downloadQR} style={styles.downloadBtn}><Download size={16} /> {t.download}</button>
                            <div style={styles.cardFooter}>Valid Authority Document</div>
                        </div>
                    </aside>

                    <main style={styles.content}>
                        <section style={styles.section}>
                            <div style={styles.sectionHeader}><User size={20} color="#800000" /> <h3>{t.profile}</h3></div>
                            
                            {errors.general && <p style={styles.errorText}>{errors.general}</p>}

                            {isEditing ? (
                                <div style={{display: 'flex', gap: '10px', flexDirection: 'column'}}>
                                    <label style={styles.label}>{t.name}</label>
                                    <input 
                                        style={{...styles.input, borderColor: errors.fullName ? 'red' : '#e1e4e8'}} 
                                        value={user.fullName} 
                                        onChange={e => setUser({...user, fullName: e.target.value})} 
                                    />
                                    {errors.fullName && <span style={styles.errorLabel}>{errors.fullName}</span>}
                                    
                                    <div style={{display: 'flex', gap: '10px'}}>
                                        <button onClick={handleUpdate} style={styles.saveBtn}><Save size={16}/> {t.save}</button>
                                        <button onClick={() => {setIsEditing(false); setErrors({});}} style={styles.cancelBtn}><X size={16}/> {t.cancel}</button>
                                    </div>
                                </div>
                            ) : (
                                <div style={styles.infoGrid}>
                                    <p><b>{t.name}:</b> {user.fullName}</p>
                                    <p><b>{t.role}:</b> {user.role}</p>
                                    <p><b>ප්‍රදේශය:</b> {user.gnDivision || "Kotagama"}, {user.divisionalSecretariat || "Bibile"}</p>
                                    <div style={{display: 'flex', gap: '10px', marginTop: '10px'}}>
                                        <button onClick={() => setIsEditing(true)} style={styles.editBtn}><Edit3 size={16}/> {t.edit}</button>
                                        <button style={styles.deleteBtn} onClick={handleDelete}><Trash2 size={16}/> {t.delete}</button>
                                    </div>
                                </div>
                            )}
                        </section>

                        <section style={styles.section}>
                            <div style={styles.sectionHeader}><UserPlus size={20} color="#800000" /> <h3>{t.proxy}</h3></div>
                            
                            {proxyErrors.general && <div style={{...styles.errorLabel, marginBottom: '15px', padding: '10px', background: '#fff5f5', borderRadius: '4px'}}>{proxyErrors.general}</div>}

                            <form onSubmit={handleProxyRegister} style={styles.proxyForm}>
                                <label style={styles.label}>{t.name}</label>
                                <input 
                                    style={{...styles.input, borderColor: proxyErrors.fullName ? 'red' : '#e1e4e8'}} 
                                    value={proxyData.fullName} 
                                    onChange={e => setProxyData({...proxyData, fullName: e.target.value})} 
                                />
                                {proxyErrors.fullName && <span style={styles.errorLabel}>{proxyErrors.fullName}</span>}

                                <label style={styles.label}>{t.nicLabel}</label>
                                <input 
                                    style={{...styles.input, borderColor: proxyErrors.nic ? 'red' : '#e1e4e8'}} 
                                    value={proxyData.nic} 
                                    onChange={e => setProxyData({...proxyData, nic: e.target.value})} 
                                />
                                {proxyErrors.nic && <span style={styles.errorLabel}>{proxyErrors.nic}</span>}

                                <label style={styles.label}>{t.passLabel}</label>
                                <input 
                                    type="password" 
                                    style={{...styles.input, borderColor: proxyErrors.password ? 'red' : '#e1e4e8'}} 
                                    value={proxyData.password} 
                                    onChange={e => setProxyData({...proxyData, password: e.target.value})} 
                                />
                                {proxyErrors.password && <span style={styles.errorLabel}>{proxyErrors.password}</span>}

                                {/* අලුතින් එක් කළ Dropdown කොටස */}
                                <label style={styles.label}>{t.relLabel}</label>
                                <select 
                                    style={{...styles.input, borderColor: proxyErrors.relationship ? 'red' : '#e1e4e8', background: 'white'}} 
                                    value={proxyData.relationship}
                                    onChange={e => setProxyData({...proxyData, relationship: e.target.value})}
                                >
                                    <option value="">-- තෝරන්න (Select) --</option>
                                    <option value="Amma">අම්මා (Mother)</option>
                                    <option value="Thaththa">තාත්තා (Father)</option>
                                    <option value="Sahodara">සහෝදරයා (Brother)</option>
                                    <option value="Sahodari">සහෝදරිය (Sister)</option>
                                    <option value="Siya">සීයා (Grandfather)</option>
                                    <option value="Achchi">ආච්චි (Grandmother)</option>
                                </select>
                                {proxyErrors.relationship && <span style={styles.errorLabel}>{proxyErrors.relationship}</span>}

                                <button type="submit" style={styles.proxyBtn} disabled={loading}>
                                    {loading ? <Loader2 size={18} className="spin" /> : <Award size={18} />} {t.regBtn}
                                </button>
                            </form>
                        </section>
                    </main>
                </div>
            </div>
            
            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
                .spin { animation: rotation 2s infinite linear; }
                @keyframes rotation { from { transform: rotate(0deg); } to { transform: rotate(359deg); } }
            `}</style>
        </div>
    );
}

const styles = {
    pageBg: { minHeight: '100vh', background: '#f8f9fa' },
    header: { background: '#800000', color: 'white', padding: '15px 0', borderBottom: '4px solid #fbc531' },
    headerContent: { maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px' },
    brand: { display: 'flex', alignItems: 'center', gap: '15px' },
    govTitle: { fontSize: '14px', fontWeight: '800', color: '#fbc531', margin: 0 },
    portalTitle: { fontSize: '12px', margin: 0 },
    headerActions: { display: 'flex', alignItems: 'center', gap: '20px' },
    langBar: { display: 'flex', gap: '10px', alignItems: 'center' },
    langBtn: { fontSize: '12px', cursor: 'pointer', opacity: 0.7 },
    activeLang: { fontSize: '12px', fontWeight: 'bold', color: '#fbc531' },
    logoutBtn: { background: 'transparent', border: '1px solid white', color: 'white', padding: '6px 15px', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px' },
    mainWrapper: { padding: '40px 20px', position: 'relative' },
    successToast: { position: 'fixed', top: '20px', right: '20px', background: '#27ae60', color: 'white', padding: '15px 25px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 1000, animation: 'fadeIn 0.3s ease-out' },
    container: { maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: '300px 1fr', gap: '30px' },
    sidebar: { position: 'sticky', top: '20px' },
    idCard: { background: 'white', borderRadius: '8px', border: '1px solid #ddd', textAlign: 'center', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' },
    cardHeader: { background: '#2c3e50', color: 'white', padding: '10px', fontSize: '10px', fontWeight: 'bold' },
    qrContainer: { padding: '20px' },
    idName: { fontSize: '18px', fontWeight: 'bold', margin: '10px 0' },
    idRoleBadge: { display: 'inline-block', background: '#f5f6fa', color: '#800000', padding: '4px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' },
    downloadBtn: { width: '85%', margin: '10px auto', padding: '10px', background: '#800000', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' },
    cardFooter: { padding: '8px', background: '#fbc531', color: '#800000', fontSize: '9px', fontWeight: 'bold' },
    content: { display: 'flex', flexDirection: 'column', gap: '25px' },
    section: { background: 'white', padding: '30px', borderRadius: '8px', border: '1px solid #ddd' },
    sectionHeader: { display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '2px solid #f8f9fa', paddingBottom: '15px', marginBottom: '20px' },
    label: { fontSize: '12px', fontWeight: 'bold', color: '#7f8c8d', marginBottom: '5px', display: 'block' },
    errorLabel: { color: '#e53e3e', fontSize: '11px', marginTop: '-10px', marginBottom: '10px', display: 'block', fontWeight: '500' },
    input: { width: '100%', padding: '12px', marginBottom: '15px', border: '1px solid #e1e4e8', borderRadius: '4px', outline: 'none' },
    saveBtn: { background: '#27ae60', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' },
    cancelBtn: { background: '#bdc3c7', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' },
    editBtn: { background: '#f5f6fa', border: '1px solid #ddd', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' },
    deleteBtn: { background: '#fff5f5', border: '1px solid #feb2b2', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', color: '#e53e3e', display: 'flex', alignItems: 'center', gap: '5px' },
    proxyBtn: { width: '100%', padding: '15px', background: '#2c3e50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', fontWeight: 'bold' },
    proxyForm: { display: 'flex', flexDirection: 'column' },
    infoGrid: { display: 'flex', flexDirection: 'column', gap: '10px' }
};

export default Profile;