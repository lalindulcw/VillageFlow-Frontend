import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { CheckCircle, XCircle, Loader2, ShieldCheck } from 'lucide-react';

function VerifyCertificate() {
    const { id } = useParams();
    const [certData, setCertData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const verify = async () => {
            try {
                const res = await axios.get('https://villageflow-backend.onrender.com/api/certificates/all');
                
                // 1. Backend එකෙන් එන data structure එක හරියටම ගන්න
                const certificates = Array.isArray(res.data) ? res.data : res.data.certificates;

                if (certificates) {
                    // 2. ID එක සසඳන විට trim() සහ String() භාවිතා කර ඉතාම නිවැරදිව පරීක්ෂා කිරීම
                    const found = certificates.find(app => 
                        String(app._id).trim() === String(id).trim()
                    );
                    setCertData(found);
                }
            } catch (err) {
                console.error("Verification Error", err);
            } finally {
                setLoading(false);
            }
        };
        verify();
    }, [id]);

    if (loading) return <div style={styles.center}><Loader2 className="animate-spin" /> Verifying Document...</div>;

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                {/* 🛡️ මෙතනදී status එක 'Approved' ද කියලා අනිවාර්යයෙන් බලනවා */}
                {certData && certData.status === 'Approved' ? (
                    <>
                        <CheckCircle size={70} color="#27ae60" />
                        <h2 style={{color: '#27ae60', marginTop: '15px'}}>AUTHENTIC DOCUMENT</h2>
                        <p style={{fontSize: '13px', color: '#666'}}>This is a digitally verified official certificate.</p>
                        <hr style={styles.hr} />
                        
                        <div style={styles.info}>
                            <p><b>Certificate ID:</b> <span style={styles.idText}>{certData._id}</span></p>
                            <p><b>Type:</b> {certData.certificateType}</p>
                            <p><b>NIC:</b> {certData.nic}</p>
                            {/* User details populate වෙලා නැතිනම් 'Verified Holder' ලෙස පෙන්වයි */}
                            <p><b>Issued To:</b> {certData.userId?.fullName || certData.fullName || 'Official Holder'}</p>
                            <p><b>Issued Date:</b> {new Date(certData.appliedDate).toLocaleDateString()}</p>
                        </div>

                        <div style={styles.verifiedBadge}>
                            <ShieldCheck size={18}/> VillageFlow Verified System
                        </div>
                    </>
                ) : (
                    <>
                        <XCircle size={70} color="#e74c3c" />
                        <h2 style={{color: '#e74c3c', marginTop: '15px'}}>INVALID DOCUMENT</h2>
                        <p style={{color: '#555'}}>The certificate ID provided does not match our records or has not been approved yet.</p>
                        <div style={styles.errorBox}>
                            <small>Ref ID: {id}</small>
                        </div>
                        <button onClick={() => window.location.reload()} style={styles.retryBtn}>Retry Verification</button>
                    </>
                )}
            </div>
        </div>
    );
}

const styles = {
    container: { minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#f0f2f5', padding: '20px' },
    card: { background: 'white', padding: '40px', borderRadius: '20px', boxShadow: '0 15px 35px rgba(0,0,0,0.1)', textAlign: 'center', maxWidth: '480px', width: '100%' },
    info: { textAlign: 'left', marginTop: '20px', fontSize: '15px', lineHeight: '2', background: '#f8f9fa', padding: '20px', borderRadius: '12px', border: '1px solid #eee' },
    hr: { margin: '20px 0', border: '0.5px solid #eee' },
    idText: { fontSize: '12px', color: '#888', fontFamily: 'monospace' },
    verifiedBadge: { marginTop: '25px', background: '#e8f5e9', color: '#2e7d32', padding: '12px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: 'bold' },
    errorBox: { marginTop: '20px', padding: '10px', background: '#fff5f5', borderRadius: '5px', color: '#c0392b' },
    retryBtn: { marginTop: '20px', padding: '10px 20px', border: 'none', background: '#800000', color: 'white', borderRadius: '5px', cursor: 'pointer' },
    center: { height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px', fontSize: '18px' }
};

export default VerifyCertificate;