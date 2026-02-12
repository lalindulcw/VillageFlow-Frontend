import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { createWorker } from 'tesseract.js';
import { 
    FileText, Camera, Upload, Loader2, ArrowRight, CheckCircle2, 
    Clock, ShieldCheck, Trash2, Download, AlertCircle, Users, Image as ImageIcon, Edit3, Check, MousePointer2, XCircle
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';

function Member2Certificates() {
    const getStoredUser = () => JSON.parse(localStorage.getItem('user'));
    const owner = getStoredUser();

    // Core States
    const [nic, setNic] = useState(owner?.nic || ''); 
    const [certType, setCertType] = useState('Residency');
    const [selectedFile, setSelectedFile] = useState(null); 
    const [isScanning, setIsScanning] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [ownerVerified, setOwnerVerified] = useState(owner ? true : null);
    const [myApplications, setMyApplications] = useState([]);
    const [isEmailing, setIsEmailing] = useState(false);
    
    // Family/Member Support States
    const [applyFor, setApplyFor] = useState('Self'); 
    const [isChild, setIsChild] = useState(false);
    const [memberName, setMemberName] = useState('');
    const [relationship, setRelationship] = useState('');
    const [memberNicImage, setMemberNicImage] = useState(null); // සාමාජිකයාගේ NIC පින්තූරය සඳහා

    // Edit State
    const [editId, setEditId] = useState(null);

    // UI Messages
    const [scanMessage, setScanMessage] = useState({ text: '', type: '' });
    const [submitMessage, setSubmitMessage] = useState({ text: '', type: '' });

    // Fetch History
    const fetchMyApps = useCallback(async () => {
        if (!owner?._id) return;
        try {
            const res = await axios.get(`https://villageflow-backend.onrender.com/api/certificates/all`);
            const filtered = res.data
                .filter(app => app.userId?._id === owner._id)
                .sort((a, b) => new Date(b.appliedDate) - new Date(a.appliedDate));
            setMyApplications(filtered);
        } catch (err) { console.error("Fetch Error:", err); }
    }, [owner?._id]);

    useEffect(() => {
        fetchMyApps();
        const interval = setInterval(fetchMyApps, 8000); 
        return () => clearInterval(interval);
    }, [fetchMyApps]);

    const latestApp = myApplications[0]; 

    const handleEdit = (app) => {
        setEditId(app._id);
        setApplyFor(app.applyFor);
        setCertType(app.certificateType);
        setMemberName(app.memberName);
        setRelationship(app.relationship);
        setNic(app.nic);
        setIsChild(app.nic === 'CHILD-NO-NIC');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleOwnerScan = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setIsScanning(true);
        setScanMessage({ text: 'Scanning your ID...', type: 'info' });
        try {
            const worker = await createWorker('eng');
            const { data: { text } } = await worker.recognize(file);
            const match = text.match(/(?:[0-9]{9}[vVxX]|[0-9]{12})/);
            
            if (match && match[0].toUpperCase() === owner.nic.toUpperCase()) {
                setOwnerVerified(true);
                setScanMessage({ text: "Registered Citizen", type: 'success' });
            } else {
                setOwnerVerified(false);
                setScanMessage({ text: "Not Registered / Mismatch", type: 'error' });
            }
            await worker.terminate();
        } catch (err) { 
            setScanMessage({ text: "Scan failed.", type: 'error' }); 
        }
        setIsScanning(false);
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure?")) {
            try {
                await axios.delete(`https://villageflow-backend.onrender.com/api/certificates/delete/${id}`);
                setSubmitMessage({ text: "Removed successfully.", type: 'success' });
                fetchMyApps();
            } catch (err) { setSubmitMessage({ text: "Failed to remove.", type: 'error' }); }
        }
    };

    const handleApply = async (e) => {
        e.preventDefault();
        
        // අනිවාර්ය ලේඛන පරීක්ෂාව
        if (!selectedFile && !editId) return setSubmitMessage({ text: "Please upload address proof.", type: 'error' });
        
        // සාමාජිකයා 18 ට වැඩි නම් NIC එක අනිවාර්ය කිරීමේ Logic එක
        if (applyFor === 'Family' && !isChild && !memberNicImage && !editId) {
            return setSubmitMessage({ text: "Please upload the Member's NIC copy for verification.", type: 'error' });
        }

        setIsSubmitting(true);
        const formData = new FormData();
        formData.append('userId', owner._id);
        formData.append('certificateType', certType);
        formData.append('applyFor', applyFor);
        formData.append('address', owner.address || 'Village Address');

        if (applyFor === 'Self') {
            formData.append('nic', owner.nic);
            formData.append('memberName', owner.fullName);
            formData.append('relationship', 'Self');
            formData.append('isManual', 'false');
        } else {
            formData.append('nic', isChild ? 'CHILD-NO-NIC' : nic);
            formData.append('memberName', memberName);
            formData.append('relationship', relationship);
            formData.append('isManual', 'true');
            if (memberNicImage) formData.append('memberNicImage', memberNicImage);
        }

        if (selectedFile) formData.append('utilityBill', selectedFile);

        try {
            if (editId) {
                await axios.put(`https://villageflow-backend.onrender.com/api/certificates/update/${editId}`, {
                    certificateType: certType,
                    memberName: applyFor === 'Self' ? owner.fullName : memberName,
                    nic: applyFor === 'Self' ? owner.nic : (isChild ? 'CHILD-NO-NIC' : nic),
                    relationship: applyFor === 'Self' ? 'Self' : relationship
                });
                setSubmitMessage({ text: "✅ Update Success!", type: 'success' });
            } else {
                await axios.post('https://villageflow-backend.onrender.com/api/certificates/apply', formData);
                setSubmitMessage({ text: "✅ Application Sent!", type: 'success' });
            }
            fetchMyApps();
            resetForm();
            setTimeout(() => setSubmitMessage({ text: '', type: '' }), 5000);
        } catch (err) { 
            setSubmitMessage({ text: "Error submitting.", type: 'error' }); 
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setEditId(null);
        setMemberName('');
        setRelationship('');
        setNic(owner?.nic || '');
        setMemberNicImage(null);
        setSelectedFile(null);
        setIsChild(false);
    };

    const downloadCertificate = async (app) => {
        setIsEmailing(true);
        try {
            const doc = new jsPDF();
            doc.setLineWidth(1.2); 
            doc.rect(5, 5, 200, 287); 
            doc.setFontSize(20);
            doc.setTextColor(128, 0, 0); 
            doc.text("VILLAGEFLOW DIGITAL PORTAL", 105, 30, { align: 'center' });
            doc.setFontSize(12);
            doc.setTextColor(0, 0, 0);
            doc.text("Officially Verified Digital Certificate", 105, 40, { align: 'center' });

            const myIP = "localhost"; 
            const verificationUrl = `http://${myIP}:3000/verify/${app._id}`;
            const qrCodeDataUri = await QRCode.toDataURL(verificationUrl);

            autoTable(doc, {
                startY: 60,
                head: [['Field', 'Information']],
                body: [
                    ['Reference ID', app._id.toUpperCase()],
                    ['Full Name', app.memberName],
                    ['NIC Number', app.nic],
                    ['Certificate Type', app.certificateType],
                    ['Issue Date', new Date().toLocaleDateString()],
                    ['Status', 'AUTHENTICATED BY SYSTEM']
                ],
                theme: 'grid',
                headStyles: { fillColor: [128, 0, 0] }
            });

            const finalY = doc.lastAutoTable.finalY + 20;
            doc.addImage(qrCodeDataUri, 'PNG', 150, finalY, 40, 40);
            doc.setFontSize(10);
            doc.setFont("helvetica", "italic");
            doc.text("Scan this QR to verify authenticity", 170, finalY + 45, { align: 'center' });
            doc.setFont("helvetica", "normal");
            doc.text("..........................................", 35, finalY + 35);
            doc.text("Grama Niladhari Official", 35, finalY + 42);

            doc.save(`${app.memberName}_Certificate.pdf`);
        } catch (error) {
            console.error("PDF Error:", error);
            alert("Could not generate QR enabled certificate.");
        }
        setIsEmailing(false);
    };

    return (
        <div style={styles.pageContent}>
            {latestApp && latestApp.status !== 'Approved' && latestApp.status !== 'Rejected' && (
                <div style={styles.liveTracker}>
                    <div style={styles.liveHeader}>
                        <div style={{display: 'flex', alignItems: 'center', gap: '10px'}}>
                            <div style={styles.pulse} />
                            <span style={{fontWeight: 'bold'}}>Live Status: {latestApp.memberName} ({latestApp.certificateType})</span>
                        </div>
                        <span style={styles.liveStatusTag}>{latestApp.status}</span>
                    </div>
                    <div style={styles.liveBody}>
                        <ProgressStep label="Submitted" done={true} />
                        <div style={{...styles.pLine, background: latestApp.status !== 'Pending' ? '#27ae60' : '#ddd'}} />
                        <ProgressStep label="Officer Review" done={latestApp.status !== 'Pending'} />
                        <div style={{...styles.pLine, background: latestApp.status === 'Approved' ? '#27ae60' : '#ddd'}} />
                        <ProgressStep label="Ready" done={latestApp.status === 'Approved'} />
                    </div>
                    {latestApp.status === 'Pending' && (
                        <p style={styles.editAlert}><MousePointer2 size={12} /> You can modify details below until officer verification starts.</p>
                    )}
                </div>
            )}

            <div style={styles.gridContainer}>
                <div style={styles.formSection}>
                    <h2 style={styles.title}>
                        {editId ? <Edit3 color="#f39c12" /> : <ShieldCheck color="#800000" />} 
                        {editId ? "Edit Pending Application" : "Identity Lock"}
                    </h2>
                    
                    {!editId && (
                        <div style={styles.scanBox}>
                            <input type="file" onChange={handleOwnerScan} style={styles.fileInput} id="owner-scan" />
                            <label htmlFor="owner-scan" style={{
                                ...styles.scanLabel, 
                                borderColor: ownerVerified ? '#27ae60' : (scanMessage.type === 'error' ? '#e74c3c' : '#800000'),
                                background: ownerVerified ? '#f0fff4' : (scanMessage.type === 'error' ? '#fff5f5' : '#fffafa')
                            }}>
                                {isScanning ? <Loader2 className="animate-spin" /> : (ownerVerified ? <CheckCircle2 color="#27ae60" /> : <Camera />)} 
                                {ownerVerified ? "Verified: Form Unlocked" : "Scan Owner NIC to Start"}
                            </label>

                            {scanMessage.text && (
                                <div style={{
                                    marginTop: '10px', padding: '10px', borderRadius: '8px', display: 'flex', 
                                    alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: 'bold',
                                    background: scanMessage.type === 'success' ? '#dcfce7' : '#fee2e2',
                                    color: scanMessage.type === 'success' ? '#15803d' : '#b91c1c',
                                    border: `1px solid ${scanMessage.type === 'success' ? '#bbf7d0' : '#fecaca'}`
                                }}>
                                    {scanMessage.type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                                    {scanMessage.text}
                                </div>
                            )}
                        </div>
                    )}

                    {submitMessage.text && (
                        <div style={{...styles.submitAlert, background: submitMessage.type === 'success' ? '#dcfce7' : '#fee2e2'}}>
                            {submitMessage.text}
                        </div>
                    )}

                    <div style={{...styles.formDimmer, opacity: (ownerVerified || editId) ? 1 : 0.3, pointerEvents: (ownerVerified || editId) ? 'all' : 'none'}}>
                        <form onSubmit={handleApply}>
                            <label style={styles.label}>Who is this for?</label>
                            <div style={styles.toggleRow}>
                                <button type="button" onClick={() => {setApplyFor('Self'); setIsChild(false);}} style={applyFor === 'Self' ? styles.btnActive : styles.btnInactive}>Myself</button>
                                <button type="button" onClick={() => setApplyFor('Family')} style={applyFor === 'Family' ? styles.btnActive : styles.btnInactive}>Family Member</button>
                            </div>

                            <label style={styles.label}>Certificate Type</label>
                            <select style={styles.input} value={certType} onChange={(e) => setCertType(e.target.value)}>
                                <option value="Residency">Residency Certificate</option>
                                <option value="Character">Character Certificate</option>
                                <option value="Birth">Birth Certificate Copy</option>
                                <option value="Marriage">Marriage Certificate Copy</option>
                            </select>

                            {applyFor === 'Family' && (
                                <div style={styles.familyBox}>
                                    <label style={styles.checkboxLabel}>
                                        <input type="checkbox" checked={isChild} onChange={(e) => setIsChild(e.target.checked)} /> 18 ට අඩු දරුවෙක් (No NIC)
                                    </label>
                                    
                                    {!isChild && (
                                        <>
                                            <input style={styles.input} placeholder="සාමාජිකයාගේ NIC අංකය" value={nic} onChange={(e)=>setNic(e.target.value)} required />
                                            <label style={styles.label}>Member's NIC Copy (For Grama Niladhari Review)</label>
                                            <div style={{...styles.uploadBox, borderStyle: 'dashed', borderColor: '#800000'}}>
                                                <Camera size={18} />
                                                <input type="file" onChange={(e)=>setMemberNicImage(e.target.files[0])} style={styles.fileInput} />
                                                <span style={{fontSize:'12px', color: '#800000'}}>{memberNicImage ? memberNicImage.name : "Click to Scan/Upload Member's NIC"}</span>
                                            </div>
                                        </>
                                    )}

                                    <input style={styles.input} placeholder="සාමාජිකයාගේ සම්පූර්ණ නම" value={memberName} onChange={(e)=>setMemberName(e.target.value)} required />
                                    <select style={styles.input} value={relationship} onChange={(e)=>setRelationship(e.target.value)} required>
                                        <option value="">සම්බන්ධතාවය තෝරන්න</option>
                                        <option value="Mother">මව (Mother)</option>
                                        <option value="Father">පියා (Father)</option>
                                        <option value="Spouse">සැමියා/බිරිඳ (Spouse)</option>
                                        <option value="Son">පුතා (Son)</option>
                                        <option value="Daughter">දියණිය (Daughter)</option>
                                        <option value="Brother">සහෝදරයා (Brother)</option>
                                        <option value="Sister">සහෝදරිය (Sister)</option>
                                        <option value="Grandmother">ආච්චි (Grandmother)</option>
                                        <option value="Grandfather">සීයා (Grandfather)</option>
                                    </select>
                                </div>
                            )}

                            <label style={styles.label}>Address Proof (Utility Bill / ග්‍රාම නිලධාරී සහතික)</label>
                            <div style={styles.uploadBox}>
                                <Upload size={18} />
                                <input type="file" onChange={(e)=>setSelectedFile(e.target.files[0])} style={styles.fileInput} />
                                <span style={{fontSize:'12px'}}>{selectedFile ? selectedFile.name : "Choose File"}</span>
                            </div>

                            <button type="submit" style={{...styles.mainBtn, background: editId ? '#f39c12' : '#27ae60'}} disabled={isSubmitting}>
                                {isSubmitting ? <Loader2 className="animate-spin" /> : (editId ? 'Update Application' : 'Submit Application')}
                            </button>
                            {editId && <button type="button" onClick={resetForm} style={styles.cancelBtn}>Cancel Edit</button>}
                        </form>
                    </div>
                </div>

                <div style={styles.trackingSection}>
                    <h3 style={styles.trackTitle}><Clock /> Application History</h3>
                    <div style={styles.listContainer}>
                        {myApplications.map(app => (
                            <div key={app._id} style={styles.appCard}>
                                <div style={{flex: 1}}>
                                    <p style={styles.appType}>{app.memberName}</p>
                                    <p style={styles.appDate}>{app.certificateType} - {new Date(app.appliedDate).toLocaleDateString()}</p>
                                </div>
                                <div style={{display: 'flex', gap: '8px', alignItems: 'center'}}>
                                    <span style={{...styles.statusBadge, 
                                        background: app.status === 'Approved' ? '#dcfce7' : app.status === 'Rejected' ? '#fee2e2' : '#fef9c3',
                                        color: app.status === 'Approved' ? '#15803d' : app.status === 'Rejected' ? '#b91c1c' : '#854d0e'}}>
                                        {app.status}
                                    </span>
                                    {app.status === 'Pending' && (
                                        <>
                                            <button onClick={() => handleEdit(app)} style={styles.iconBtn}><Edit3 size={14} /></button>
                                            <button onClick={() => handleDelete(app._id)} style={styles.deleteBtn}><Trash2 size={16} /></button>
                                        </>
                                    )}
                                    {app.status === 'Approved' && (
                                        <button onClick={() => downloadCertificate(app)} style={styles.downloadBtn}>
                                            {isEmailing ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

const ProgressStep = ({ label, done }) => (
    <div style={{textAlign: 'center', flex: 1}}>
        <div style={{...styles.pCircle, background: done ? '#27ae60' : '#fff', border: done ? 'none' : '2px solid #ddd'}}>
            {done && <Check size={10} color="white" />}
        </div>
        <p style={{fontSize: '10px', marginTop: '5px', color: done ? '#27ae60' : '#999'}}>{label}</p>
    </div>
);

const styles = {
    pageContent: { padding: '40px', background: '#f4f7f6', minHeight: '100vh', fontFamily: 'sans-serif' },
    liveTracker: { background: 'white', padding: '20px', borderRadius: '15px', marginBottom: '25px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', borderLeft: '5px solid #800000' },
    liveHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' },
    liveStatusTag: { background: '#fff9db', color: '#f08c00', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold' },
    liveBody: { display: 'flex', alignItems: 'center', padding: '10px 0' },
    editAlert: { fontSize: '11px', color: '#666', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '5px' },
    pulse: { width: '8px', height: '8px', background: '#e74c3c', borderRadius: '50%', animation: 'pulse 1.5s infinite' },
    gridContainer: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', maxWidth: '1300px', margin: '0 auto' },
    formSection: { background: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' },
    title: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: '#800000', fontSize: '18px' },
    scanBox: { marginBottom: '20px', position: 'relative' },
    scanLabel: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '15px', border: '2px dashed #800000', borderRadius: '10px', cursor: 'pointer', background: '#fffafa', color: '#800000', fontWeight: 'bold', fontSize: '13px', transition: '0.3s' },
    fileInput: { position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' },
    formDimmer: { transition: '0.3s' },
    toggleRow: { display: 'flex', gap: '10px', marginBottom: '20px' },
    btnActive: { flex: 1, padding: '12px', background: '#800000', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' },
    btnInactive: { flex: 1, padding: '12px', background: '#f0f0f0', color: '#666', border: 'none', borderRadius: '8px', cursor: 'pointer' },
    label: { fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', display: 'block', color: '#555' },
    input: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '15px' },
    familyBox: { background: '#fff9f9', padding: '15px', borderRadius: '10px', border: '1px solid #ffebeb', marginBottom: '15px' },
    checkboxLabel: { fontSize: '13px', display: 'block', marginBottom: '10px', fontWeight: 'bold', color: '#800000' },
    uploadBox: { display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', border: '1px solid #ddd', borderRadius: '8px', marginBottom: '20px', position: 'relative', background: '#f9f9f9' },
    mainBtn: { width: '100%', padding: '15px', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '10px' },
    cancelBtn: { width: '100%', background: 'none', border: 'none', color: '#666', marginTop: '10px', cursor: 'pointer', textDecoration: 'underline' },
    submitAlert: { padding: '10px', borderRadius: '8px', fontSize: '13px', marginBottom: '15px', textAlign: 'center' },
    trackingSection: { background: 'white', padding: '30px', borderRadius: '15px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' },
    trackTitle: { display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '25px', fontSize: '16px', color: '#333' },
    listContainer: { display: 'flex', flexDirection: 'column', gap: '12px' },
    appCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px', borderRadius: '12px', border: '1px solid #f0f0f0', background: '#fcfcfc' },
    appType: { margin: 0, fontWeight: 'bold', fontSize: '14px' },
    appDate: { margin: 0, fontSize: '11px', color: '#888' },
    statusBadge: { fontSize: '10px', fontWeight: 'bold', padding: '4px 10px', borderRadius: '20px' },
    iconBtn: { border: 'none', background: '#eee', padding: '5px', borderRadius: '5px', cursor: 'pointer' },
    deleteBtn: { background: '#fff1f0', border: 'none', color: '#e74c3c', padding: '6px', borderRadius: '6px', cursor: 'pointer' },
    downloadBtn: { background: '#27ae60', color: 'white', border: 'none', padding: '8px', borderRadius: '6px', cursor: 'pointer' },
    pCircle: { width: '18px', height: '18px', borderRadius: '50%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' },
    pLine: { flex: 1, height: '2px', marginBottom: '20px' },
};

export default Member2Certificates;