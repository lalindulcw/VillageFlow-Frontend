import React, { useState } from 'react';
import axios from 'axios';
import { Send, User, CreditCard, Home, ListFilter, AlertCircle, CheckCircle2 } from 'lucide-react';

function ApplyWelfare() {
    const [applyData, setApplyData] = useState({
        fullName: '', nic: '', householdNo: '', type: 'Aswasuma'
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // NIC Validation
    const validateNIC = (nic) => {
        return /^[0-9]{9}[vVxX]$/.test(nic) || /^[0-9]{12}$/.test(nic);
    };

    const handleApply = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess(false);

        if (!validateNIC(applyData.nic)) {
            setError("කරුණාකර නිවැරදි NIC අංකයක් ඇතුළත් කරන්න.");
            return;
        }

        try {
            // Backend එකට දත්ත යැවීම
            await axios.post('https://villageflow-backend.onrender.com/api/welfare/apply', applyData);
            setSuccess(true);
            setApplyData({ fullName: '', nic: '', householdNo: '', type: 'Aswasuma' });
        } catch (err) {
            setError("අයදුම් කිරීම අසාර්ථකයි. ඔබ දැනටමත් අයදුම් කර ඇතිවා විය හැක.");
        }
    };

    return (
        <div style={styles.pageBackground}>
            <div style={styles.container}>
                <div style={styles.card}>
                    <h2 style={styles.title}>සහනාධාර අයදුම්පත්‍රය</h2>
                    <p style={styles.subtitle}>අස්වැසුම, සමෘද්ධි සහ වැඩිහිටි දීමනා සඳහා මෙහිදී ලියාපදිංචි විය හැක.</p>

                    {success && (
                        <div style={styles.successMsg}>
                            <CheckCircle2 size={18} /> අයදුම්පත සාර්ථකව යොමු කළා! ග්‍රාම නිලධාරී විසින් එය පරීක්ෂා කරනු ඇත.
                        </div>
                    )}

                    {error && (
                        <div style={styles.errorMsg}>
                            <AlertCircle size={18} /> {error}
                        </div>
                    )}

                    <form onSubmit={handleApply} style={styles.form}>
                        <div style={styles.inputGroup}>
                            <label style={styles.label}><User size={14} /> සම්පූර්ණ නම</label>
                            <input type="text" placeholder="ඔබේ නම ඇතුළත් කරන්න" style={styles.input} value={applyData.fullName} onChange={e => setApplyData({...applyData, fullName: e.target.value})} required />
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}><CreditCard size={14} /> NIC අංකය</label>
                            <input type="text" placeholder="උදා: 991234567V" style={styles.input} value={applyData.nic} onChange={e => setApplyData({...applyData, nic: e.target.value})} required />
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}><ListFilter size={14} /> සහනාධාර වර්ගය</label>
                            <select style={styles.select} value={applyData.type} onChange={e => setApplyData({...applyData, type: e.target.value})}>
                                <option value="Aswasuma">අස්වැසුම</option>
                                <option value="Samurdhi">සමෘද්ධි</option>
                                <option value="Elderly Allowance">වැඩිහිටි දීමනාව</option>
                            </select>
                        </div>

                        <div style={styles.inputGroup}>
                            <label style={styles.label}><Home size={14} /> නිවාස අංකය</label>
                            <input type="text" placeholder="ඔබේ නිවාස අංකය" style={styles.input} value={applyData.householdNo} onChange={e => setApplyData({...applyData, householdNo: e.target.value})} required />
                        </div>

                        <button type="submit" style={styles.btn}>
                            <Send size={18} /> අයදුම්පත යොමු කරන්න
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

const styles = {
    pageBackground: { backgroundColor: '#f1f5f9', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' },
    container: { width: '100%', maxWidth: '450px' },
    card: { backgroundColor: 'white', padding: '40px', borderRadius: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' },
    title: { textAlign: 'center', fontSize: '24px', fontWeight: 'bold', color: '#800000', marginBottom: '10px' },
    subtitle: { textAlign: 'center', fontSize: '13px', color: '#64748b', marginBottom: '30px' },
    form: { display: 'flex', flexDirection: 'column', gap: '20px' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '8px' },
    label: { fontSize: '14px', fontWeight: '600', color: '#334155', display: 'flex', alignItems: 'center', gap: '8px' },
    input: { padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', transition: '0.3s' },
    select: { padding: '12px', borderRadius: '10px', border: '1px solid #cbd5e1', outline: 'none', backgroundColor: 'white' },
    btn: { padding: '15px', backgroundColor: '#800000', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginTop: '10px' },
    successMsg: { padding: '12px', backgroundColor: '#dcfce7', color: '#15803d', borderRadius: '8px', fontSize: '13px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' },
    errorMsg: { padding: '12px', backgroundColor: '#fee2e2', color: '#b91c1c', borderRadius: '8px', fontSize: '13px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }
};

export default ApplyWelfare;