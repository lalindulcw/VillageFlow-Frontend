import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Check, X, Eye, Clock, FileText, BarChart2, 
    History, Download, Package, Heart,
    UserPlus, Printer, Filter, Zap, CheckCircle2 
} from 'lucide-react'; 
import { QRCodeSVG } from 'qrcode.react'; 
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import InventoryPage from './InventoryPage'; 
import WelfarePage from './WelfarePage';

function GramaNiladhariDashboard() {
    const [activeTab, setActiveTab] = useState('certificates'); 
    const [activeSubTab, setActiveSubTab] = useState('auto'); 
    const [applications, setApplications] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    const [proxyData, setProxyData] = useState({ fullName: '', nic: '', password: '' });
    const [isRegSuccess, setIsRegSuccess] = useState(false);
    const [regLoading, setRegLoading] = useState(false);

    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedAppId, setSelectedAppId] = useState(null);
    const [rejectReason, setRejectReason] = useState('');

    const [notification, setNotification] = useState({ show: false, message: '', type: 'success' });

    useEffect(() => {
        fetchApplications();
        fetchAuditLogs();
    }, []);

    const triggerNotice = (msg, type = 'success') => {
        setNotification({ show: true, message: msg, type: type });
        setTimeout(() => setNotification({ show: false, message: '', type: 'success' }), 4000);
    };

    const fetchApplications = async () => {
        try {
            const res = await axios.get('https://villageflow-backend.onrender.com/api/certificates/all');
            setApplications(res.data);
            setLoading(false);
        } catch (err) {
            console.error("දත්ත ලබාගැනීම අසාර්ථකයි");
            setLoading(false);
        }
    };

    const fetchAuditLogs = async () => {
        try {
            const res = await axios.get('https://villageflow-backend.onrender.com/api/certificates/audit-logs');
            setAuditLogs(res.data);
        } catch (err) { console.log("Audit logs fetch failed"); }
    };

    const handleElderlyRegister = async (e) => {
        e.preventDefault();
        setRegLoading(true);
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            await axios.post('https://villageflow-backend.onrender.com/api/auth/proxy-register', {
                ...proxyData,
                officerId: user._id || user.id,
                role: 'citizen'
            });
            setIsRegSuccess(true);
            triggerNotice("ලියාපදිංචිය සාර්ථකයි!");
        } catch (err) {
            triggerNotice("ලියාපදිංචිය අසාර්ථකයි.", "error");
        } finally {
            setRegLoading(false);
        }
    };

    const printQRCard = () => {
        const qrSvg = document.getElementById("printable-qr");
        const svgData = new XMLSerializer().serializeToString(qrSvg);
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const img = new Image();
        img.onload = () => {
            canvas.width = img.width; canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            const win = window.open('', '_blank');
            win.document.write(`
                <html>
                <body style="display:flex; flex-direction:column; align-items:center; font-family:sans-serif; padding:50px;">
                    <div style="border:2px solid #800000; padding:20px; border-radius:15px; text-align:center; width:300px;">
                        <h2 style="color:#800000; margin-bottom:5px;">VillageFlow ID</h2>
                        <img src="${canvas.toDataURL("image/png")}" style="width:180px; margin:15px;"/>
                        <h3 style="margin:5px 0;">${proxyData.fullName}</h3>
                        <p style="margin:2px;">NIC: ${proxyData.nic}</p>
                    </div>
                    <script>setTimeout(() => { window.print(); window.close(); }, 500);</script>
                </body>
                </html>
            `);
        };
        img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
    };

    const generateAnalyticalReport = () => {
        const doc = new jsPDF();
        const total = applications.length;
        const approved = applications.filter(a => a.status === 'Approved').length;
        const rejected = applications.filter(a => a.status === 'Rejected').length;
        const pending = applications.filter(a => a.status === 'Pending').length;

        doc.setFontSize(20); doc.setTextColor(128, 0, 0);
        doc.text("VillageFlow: Analytical Summary Report", 105, 15, { align: 'center' });
        doc.setFontSize(10); doc.setTextColor(100);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 15, 25);

        autoTable(doc, {
            startY: 35,
            head: [['Category', 'Count', 'Percentage (%)']],
            body: [
                ['Total Requests', total, '100%'],
                ['Approved', approved, `${((approved/total)*100 || 0).toFixed(1)}%`],
                ['Rejected', rejected, `${((rejected/total)*100 || 0).toFixed(1)}%`],
                ['Pending', pending, `${((pending/total)*100 || 0).toFixed(1)}%`],
            ],
            theme: 'striped',
            headStyles: { fillColor: [128, 0, 0] }
        });
        doc.save("GramaNiladhari_Analytical_Report.pdf");
    };

    const handleUpdateStatus = async (id, status) => {
        if (status === 'Rejected') {
            setSelectedAppId(id);
            setShowRejectModal(true);
            return;
        }
        try {
            await axios.put(`https://villageflow-backend.onrender.com/api/certificates/update/${id}`, {
                status: status,
                rejectReason: "",
                officerName: "Admin_Grama_Niladhari"
            });
            triggerNotice("අයදුම්පත අනුමත කළා සහ විද්‍යුත් ලිපිය (Email) සාර්ථකව යැව්වා.");
            fetchApplications();
            fetchAuditLogs();
        } catch (err) { triggerNotice("තත්ත්වය වෙනස් කිරීම අසාර්ථකයි", "error"); }
    };

    const submitRejection = async () => {
        if (!rejectReason.trim()) {
            triggerNotice("කරුණාකර ප්‍රතික්ෂේප කිරීමට හේතුව ඇතුළත් කරන්න.", "error");
            return;
        }
        try {
            await axios.put(`https://villageflow-backend.onrender.com/api/certificates/update/${selectedAppId}`, {
                status: 'Rejected',
                rejectReason: rejectReason,
                officerName: "Admin_Grama_Niladhari"
            });
            triggerNotice("අයදුම්පත ප්‍රතික්ෂේප කළා සහ විද්‍යුත් ලිපිය (Email) සාර්ථකව යැව්වා.");
            setShowRejectModal(false);
            setRejectReason('');
            fetchApplications();
            fetchAuditLogs();
        } catch (err) { triggerNotice("ප්‍රතික්ෂේප කිරීමේ දෝෂයකි.", "error"); }
    };

    const filteredApps = applications.filter(app => {
        const isManual = app.isManual === "true" || app.relationship !== "Self";
        return activeSubTab === 'manual' ? isManual : !isManual;
    });

    if (loading) return <div style={styles.loader}><Clock className="animate-spin" /> දත්ත පරීක්ෂා කරමින්...</div>;

    return (
        <div style={styles.dashboardWrapper}>
            {notification.show && (
                <div style={{
                    ...styles.notificationBox, 
                    backgroundColor: notification.type === 'error' ? '#fee2e2' : '#dcfce7',
                    color: notification.type === 'error' ? '#b91c1c' : '#15803d',
                    borderColor: notification.type === 'error' ? '#ef4444' : '#22c55e'
                }}>
                    <CheckCircle2 size={18} /> {notification.message}
                </div>
            )}

            <div style={styles.sidebar}>
                <div style={styles.logo}>Village<span>Flow</span></div>
                <nav style={styles.nav}>
                    <div onClick={() => setActiveTab('certificates')} style={{...styles.navItem, color: activeTab === 'certificates' ? '#800000' : '#64748b', backgroundColor: activeTab === 'certificates' ? '#fff1f1' : 'transparent'}}>
                        <FileText size={20} /> සහතික පත්‍ර
                    </div>
                    <div onClick={() => setActiveTab('elderly-reg')} style={{...styles.navItem, color: activeTab === 'elderly-reg' ? '#800000' : '#64748b', backgroundColor: activeTab === 'elderly-reg' ? '#fff1f1' : 'transparent'}}>
                        <UserPlus size={20} /> වැඩිහිටි ලියාපදිංචිය
                    </div>
                    <div onClick={() => setActiveTab('welfare')} style={{...styles.navItem, color: activeTab === 'welfare' ? '#800000' : '#64748b', backgroundColor: activeTab === 'welfare' ? '#fff1f1' : 'transparent'}}>
                        <Heart size={20} /> සහනාධාර (Welfare)
                    </div>
                    <div onClick={() => setActiveTab('inventory')} style={{...styles.navItem, color: activeTab === 'inventory' ? '#800000' : '#64748b', backgroundColor: activeTab === 'inventory' ? '#fff1f1' : 'transparent'}}>
                        <Package size={20} /> ග්‍රාමීය වත්කම් 
                    </div>
                    <div onClick={() => setActiveTab('audit')} style={{...styles.navItem, color: activeTab === 'audit' ? '#800000' : '#64748b', backgroundColor: activeTab === 'audit' ? '#fff1f1' : 'transparent'}}>
                        <History size={20} /> පද්ධති වාර්තා (Audit)
                    </div>
                </nav>
            </div>

            <div style={styles.mainContent}>
                {activeTab === 'certificates' && (
                    <div style={styles.container}>
                        <div style={styles.statsRow}>
                            <div style={styles.statCard}>
                                <FileText color="#800000" />
                                <div><span>මුළු අයදුම්පත්</span><h3>{applications.length}</h3></div>
                            </div>
                            <div style={styles.statCard}>
                                <Check color="green" />
                                <div><span>අනුමත කළ</span><h3>{applications.filter(a => a.status === 'Approved').length}</h3></div>
                            </div>
                            <div style={styles.statCard}>
                                <BarChart2 color="blue" />
                                <div><span>සාර්ථකත්වය</span><h3>{((applications.filter(a => a.status === 'Approved').length / applications.length) * 100 || 0).toFixed(0)}%</h3></div>
                            </div>
                        </div>

                        <div style={styles.headerContainer}>
                            <h2 style={styles.header}><History color="#800000" /> අයදුම්පත් කළමනාකරණය</h2>
                            <button onClick={generateAnalyticalReport} style={styles.reportBtn}>
                                <Download size={16} /> වාර්තාව (PDF)
                            </button>
                        </div>

                        <div style={styles.subTabContainer}>
                            <button onClick={() => setActiveSubTab('auto')} style={activeSubTab === 'auto' ? styles.subTabActive : styles.subTabInactive}>
                                <Zap size={16} /> ස්වයංක්‍රීය (Auto/Self)
                            </button>
                            <button onClick={() => setActiveSubTab('manual')} style={activeSubTab === 'manual' ? styles.subTabActive : styles.subTabInactive}>
                                <Filter size={16} /> අත්යවශ්‍ය පරීක්ෂණ (Manual/Family)
                            </button>
                        </div>
                        
                        <div style={styles.tableWrapper}>
                            <table style={styles.table}>
                                <thead>
                                    <tr style={styles.thRow}>
                                        <th style={styles.th}>අයදුම්කරු</th>
                                        <th style={styles.th}>NIC අංකය</th>
                                        <th style={styles.th}>සහතික වර්ගය</th>
                                        <th style={styles.th}>සම්බන්ධතාවය</th>
                                        <th style={styles.th}>තත්ත්වය</th>
                                        <th style={styles.th}>ක්‍රියාකාරකම්</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredApps.map(app => (
                                        <tr key={app._id} style={styles.tr}>
                                            <td style={styles.td}>{app.userId?.fullName || "නම නැත"}</td>
                                            <td style={styles.td}>{app.nic}</td>
                                            <td style={styles.td}>{app.certificateType}</td>
                                            <td style={styles.td}>
                                                <span style={{...styles.relBadge, backgroundColor: app.relationship === 'Self' ? '#e0f2fe' : '#f5f3ff'}}>
                                                    {app.relationship || 'Self'}
                                                </span>
                                            </td>
                                            <td style={styles.td}>
                                                <span style={{...styles.badge, ...getStatusBadgeStyle(app.status)}}>
                                                    {app.status}
                                                </span>
                                            </td>
                                            <td style={styles.td}>
                                                <div style={styles.actions}>
                                                    {/* මෙන්න මෙතන මම පොඩි වෙනසක් කළා - path එක utilityBillPath හෝ memberNicImagePath කියන දෙකෙන් තියෙන එක ගන්නවා */}
                                                    <button 
                                                        title="ප්‍රත්‍යක්ෂ පත්‍රය බලන්න (NIC/Bill)"
                                                        onClick={() => {
                                                            const proofPath = app.utilityBillPath || app.memberNicImagePath;
                                                            if(proofPath) {
                                                                window.open(`http://localhost:5000/${proofPath}`);
                                                            } else {
                                                                triggerNotice("ලේඛනය සොයාගත නොහැක.", "error");
                                                            }
                                                        }} 
                                                        style={styles.viewBtn}
                                                    >
                                                        <Eye size={14}/>
                                                    </button>
                                                    
                                                    {app.status === 'Pending' && (
                                                        <>
                                                            <button onClick={() => handleUpdateStatus(app._id, 'Approved')} style={styles.approveBtn}><Check size={14}/></button>
                                                            <button onClick={() => handleUpdateStatus(app._id, 'Rejected')} style={styles.rejectBtn}><X size={14}/></button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {activeTab === 'elderly-reg' && (
                    <div style={styles.container}>
                        <h2 style={styles.header}><UserPlus color="#800000" /> දුරකථන පහසුකම් නොමැති අය ලියාපදිංචි කිරීම</h2>
                        <div style={styles.formSection}>
                            <form onSubmit={handleElderlyRegister} style={styles.regForm}>
                                <input placeholder="සම්පූර්ණ නම" style={styles.regInput} value={proxyData.fullName} onChange={e => setProxyData({...proxyData, fullName: e.target.value})} required />
                                <input placeholder="NIC අංකය" style={styles.regInput} value={proxyData.nic} onChange={e => setProxyData({...proxyData, nic: e.target.value})} required />
                                <input type="password" placeholder="තාවකාලික මුරපදය" style={styles.regInput} onChange={e => setProxyData({...proxyData, password: e.target.value})} required />
                                <button type="submit" style={styles.regSubmitBtn}>
                                    {regLoading ? "සුරකිමින්..." : "ලියාපදිංචි කර QR පත සාදන්න"}
                                </button>
                            </form>
                            {isRegSuccess && (
                                <div style={styles.qrResult}>
                                    <QRCodeSVG id="printable-qr" value={proxyData.nic} size={150} />
                                    <p style={{marginTop: '10px', fontWeight: 'bold'}}>{proxyData.fullName}</p>
                                    <button onClick={printQRCard} style={styles.printBtn}><Printer size={16} /> ID පත මුද්‍රණය කරන්න</button>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {activeTab === 'welfare' && <WelfarePage />}
                {activeTab === 'inventory' && <InventoryPage />}
                {activeTab === 'audit' && (
                    <div style={styles.container}>
                        <h2 style={styles.header}><History color="#800000" /> පද්ධති Audit වාර්තා</h2>
                        <div style={styles.tableWrapper}>
                            <table style={styles.table}>
                                <thead>
                                    <tr style={styles.thRow}>
                                        <th style={styles.th}>සිදුවීම</th>
                                        <th style={styles.th}>නිලධාරියා</th>
                                        <th style={styles.th}>අදාළ NIC</th>
                                        <th style={styles.th}>දිනය හා වේලාව</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {auditLogs.map(log => (
                                        <tr key={log._id} style={styles.tr}>
                                            <td style={styles.td}>{log.action}</td>
                                            <td style={styles.td}>{log.officerName}</td>
                                            <td style={styles.td}>{log.targetNic}</td>
                                            <td style={styles.td}>{new Date(log.timestamp).toLocaleString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {showRejectModal && (
                    <div style={styles.modalOverlay}>
                        <div style={styles.modalContent}>
                            <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'15px'}}>
                                <h3 style={{color: '#800000', margin: 0}}>ප්‍රතික්ෂේප කිරීමට හේතුව</h3>
                                <X size={20} style={{cursor:'pointer'}} onClick={() => setShowRejectModal(false)} />
                            </div>
                            <textarea 
                                style={styles.textArea} rows="4" 
                                placeholder="උදා: ඔබ ඉදිරිපත් කළ උපයෝගිතා බිල්පත පැහැදිලි නැත..."
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                            ></textarea>
                            <div style={{display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px'}}>
                                <button onClick={() => setShowRejectModal(false)} style={styles.cancelBtn}>අවලංගු කරන්න</button>
                                <button onClick={submitRejection} style={styles.confirmRejectBtn}>තහවුරු කර යවන්න</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

const getStatusBadgeStyle = (status) => {
    if (status === 'Approved') return { backgroundColor: '#dcfce7', color: '#15803d' };
    if (status === 'Rejected') return { backgroundColor: '#fee2e2', color: '#b91c1c' };
    return { backgroundColor: '#fef9c3', color: '#854d0e' };
};

const styles = {
    dashboardWrapper: { display: 'flex', minHeight: '100vh', backgroundColor: '#f4f7f6', position: 'relative' },
    notificationBox: {
        position: 'fixed', top: '20px', right: '20px', padding: '15px 25px', borderRadius: '10px',
        borderLeft: '5px solid', boxShadow: '0 5px 15px rgba(0,0,0,0.1)', zIndex: 3000,
        display: 'flex', alignItems: 'center', gap: '10px', fontWeight: '600', fontSize: '14px',
        animation: 'slideIn 0.3s ease-out'
    },
    sidebar: { width: '250px', backgroundColor: 'white', borderRight: '1px solid #e2e8f0', padding: '20px', display: 'flex', flexDirection: 'column' },
    logo: { fontSize: '24px', fontWeight: 'bold', color: '#1e293b', marginBottom: '40px', textAlign: 'center' },
    nav: { display: 'flex', flexDirection: 'column', gap: '5px' },
    navItem: { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', cursor: 'pointer', borderRadius: '8px', fontWeight: '500', transition: '0.2s' },
    mainContent: { flex: 1, overflowY: 'auto', position: 'relative' },
    container: { padding: '40px' },
    statsRow: { display: 'flex', gap: '20px', marginBottom: '30px' },
    statCard: { flex: 1, backgroundColor: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', gap: '15px' },
    headerContainer: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    header: { fontSize: '20px', color: '#334155', display: 'flex', alignItems: 'center', gap: '10px' },
    reportBtn: { display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: '#800000', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
    subTabContainer: { display: 'flex', gap: '10px', marginBottom: '15px', backgroundColor: '#f1f5f9', padding: '5px', borderRadius: '10px', width: 'fit-content' },
    subTabActive: { border: 'none', backgroundColor: 'white', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 'bold', color: '#800000', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
    subTabInactive: { border: 'none', backgroundColor: 'transparent', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' },
    relBadge: { padding: '2px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', color: '#475569' },
    tableWrapper: { backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' },
    table: { width: '100%', borderCollapse: 'collapse' },
    thRow: { backgroundColor: '#f8fafc' },
    th: { padding: '15px', textAlign: 'left', fontSize: '13px', color: '#64748b' },
    tr: { borderBottom: '1px solid #edf2f7' },
    td: { padding: '15px', fontSize: '14px' },
    badge: { padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' },
    actions: { display: 'flex', gap: '5px' },
    viewBtn: { padding: '6px', border: '1px solid #ddd', borderRadius: '4px', cursor: 'pointer' },
    approveBtn: { padding: '6px', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    rejectBtn: { padding: '6px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    loader: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' },
    formSection: { display: 'flex', gap: '40px', backgroundColor: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' },
    regForm: { display: 'flex', flexDirection: 'column', gap: '15px', flex: 1 },
    regInput: { padding: '12px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px' },
    regSubmitBtn: { padding: '12px', backgroundColor: '#22c55e', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' },
    qrResult: { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderLeft: '1px solid #eee' },
    printBtn: { marginTop: '15px', display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: '#800000', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 },
    modalContent: { backgroundColor: 'white', padding: '30px', borderRadius: '15px', width: '450px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' },
    textArea: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', fontFamily: 'inherit', resize: 'none' },
    cancelBtn: { padding: '10px 20px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' },
    confirmRejectBtn: { padding: '10px 20px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '600' }
};

export default GramaNiladhariDashboard;