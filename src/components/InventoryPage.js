import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    Package, Plus, Edit, Trash2, Search, Download, 
    AlertTriangle, Activity, FileText, CheckCircle2, ListFilter,
    BarChart3, PieChart as PieIcon, LayoutDashboard
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

function InventoryPage() {
    const [assets, setAssets] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({ 
        itemName: '', 
        quantity: '', 
        condition: 'Good', 
        lastServiceDate: new Date().toISOString().split('T')[0] 
    });
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [showConfirm, setShowConfirm] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState(null);

    const governmentAssetList = [
        "Office Desk - Wooden", "Office Chair - Ergonomic", "Steel Cupboard", "Computer Desktop Set", 
        "Laptop Computer", "Laser Printer", "Photocopy Machine", "Air Conditioner Unit", 
        "Ceiling Fan", "Water Dispenser", "Conference Table", "File Rack", 
        "Projector", "Scanner", "UPS Unit", "Telephone System", 
        "Fire Extinguisher", "Wall Clock", "First Aid Box", "Paper Shredder",
        "Motor Vehicle", "Office Van", "Motorcycle", "Bicycle",
        "Office Sofa Set", "Whiteboard", "Notice Board", "Calculators",
        "Fingerprint Machine", "CCTV Camera", "Network Router", "Server Rack",
        "Public Address System", "Water Tank", "Generator", "Grass Cutter",
        "Electric Kettle", "Microphone Set", "Tool Kit", "Heavy Duty Stapler",
        "Library Cupboard", "Wooden Bench", "Digital Camera", "Refrigerator",
        "Microwave Oven", "Handheld GPS", "Binoculars", "Solar Panel System",
        "Extension Cord", "Emergency Lamp"
    ].sort();

    useEffect(() => {
        fetchAssets();
    }, []);

    const fetchAssets = async () => {
        try {
            const res = await axios.get('https://villageflow-backend.onrender.com/api/assets/all');
            setAssets(Array.isArray(res.data) ? res.data : []);
        } catch (err) { 
            console.error("Error fetching data:", err);
        }
    };

    const calculateHealth = (lastDate, condition) => {
        const lastService = new Date(lastDate);
        const diffDays = Math.ceil(Math.abs(new Date() - lastService) / (1000 * 60 * 60 * 24));
        let score = 100;
        if (diffDays > 180) score -= 30;
        if (condition === 'Damaged') score -= 50;
        if (condition === 'Need Repair') score -= 40;
        return Math.max(score, 10);
    };

    // Statistics logic
    const stats = {
        total: assets.length,
        good: assets.filter(a => a.condition === 'Good').length,
        repair: assets.filter(a => a.condition === 'Need Repair').length,
        damaged: assets.filter(a => a.condition === 'Damaged').length,
    };

    const chartData = [
        { name: 'Good', value: stats.good, color: '#22c55e' },
        { name: 'Repair', value: stats.repair, color: '#f59e0b' },
        { name: 'Damaged', value: stats.damaged, color: '#ef4444' },
    ];

    const generatePDF = () => {
        const doc = new jsPDF();
        const timestamp = new Date().toLocaleString();
        
        doc.setFont("times", "bold");
        doc.setFontSize(16);
        doc.text("DEMOCRATIC SOCIALIST REPUBLIC OF SRI LANKA", 105, 15, { align: "center" });
        
        doc.setFontSize(12);
        doc.text("DISTRICT SECRETARIAT - VILLAGEFLOW INVENTORY DIVISION", 105, 22, { align: "center" });
        
        doc.setFont("times", "normal");
        doc.setFontSize(10);
        doc.text(`Report Ref: VF/INV/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`, 14, 32);
        doc.text(`Issued Date: ${timestamp}`, 14, 37);

        doc.setLineWidth(0.5);
        doc.line(14, 40, 196, 40);

        const tableColumn = ["Ref ID", "Description of Asset", "Qty", "Current Condition", "Health Status", "Last Audit"];
        const tableRows = assets.map((asset, i) => [
            `ASSET-${asset._id ? asset._id.slice(-5).toUpperCase() : i+1}`,
            asset.itemName.toUpperCase(),
            asset.quantity,
            asset.condition,
            `${calculateHealth(asset.lastServiceDate, asset.condition)}%`,
            asset.lastServiceDate || 'N/A'
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 45,
            theme: 'grid',
            headStyles: { fillColor: [44, 62, 80], textColor: [255, 255, 255], fontStyle: 'bold' },
            styles: { font: "times", fontSize: 9 },
            columnStyles: { 1: { cellWidth: 50 } }
        });

        const finalY = doc.lastAutoTable.finalY + 30;
        doc.setFontSize(10);
        doc.text("..........................................", 14, finalY);
        doc.text("Prepared By (Officer)", 14, finalY + 5);
        
        doc.text("..........................................", 140, finalY);
        doc.text("Certified By (Director)", 140, finalY + 5);

        doc.save(`Asset_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    };

    const generateAuditReport = async () => {
        try {
            const res = await axios.get('https://villageflow-backend.onrender.com/api/audit/all');
            const auditLogs = res.data;

            const doc = new jsPDF();
            doc.setFont("times", "bold");
            doc.setFontSize(14);
            doc.text("VILLAGEFLOW - OFFICIAL SYSTEM AUDIT EVIDENCE", 105, 15, { align: "center" });
            
            doc.setFontSize(10);
            doc.setFont("times", "normal");
            doc.text(`Generated Date: ${new Date().toLocaleString()}`, 14, 25);
            doc.line(14, 28, 196, 28);

            const tableColumn = ["Timestamp", "Officer", "Action Performed", "Reference/NIC"];
            const tableRows = auditLogs.map(log => [
                new Date(log.timestamp).toLocaleString(),
                log.officerName.toUpperCase(),
                log.action,
                log.targetNic || "SYSTEM"
            ]);

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 35,
                theme: 'grid',
                headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
                styles: { font: "times", fontSize: 9 }
            });

            doc.save(`Audit_Log_Report_${new Date().toISOString().split('T')[0]}.pdf`);
        } catch (err) {
            alert("Audit logs ලබා ගැනීමට නොහැකි විය. Backend එක පරීක්ෂා කරන්න.");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await axios.put(`https://villageflow-backend.onrender.com/api/assets/update/${editId}`, formData);
            } else {
                await axios.post('https://villageflow-backend.onrender.com/api/assets/add', formData);
            }
            resetForm();
            fetchAssets();
        } catch (err) { alert("Error saving data"); }
    };

    const resetForm = () => {
        setFormData({ itemName: '', quantity: '', condition: 'Good', lastServiceDate: new Date().toISOString().split('T')[0] });
        setIsEditing(false);
        setEditId(null);
    };

    const confirmDelete = async () => {
        try {
            await axios.delete(`https://villageflow-backend.onrender.com/api/assets/delete/${deleteTargetId}`);
            setShowConfirm(false);
            setDeleteTargetId(null);
            fetchAssets();
        } catch(err) { alert("Delete failed"); }
    };

    return (
        <div style={styles.container}>
            <div style={styles.headerRow}>
                <div>
                    <h2 style={styles.header}><Activity size={32} color="#800000" /> Inventory & Asset Lifecycle</h2>
                    <p style={styles.subHeader}>සම්පත් කළමනාකරණය සහ නඩත්තු විශ්ලේෂණ පද්ධතිය [Member 03]</p>
                </div>
                <div style={{display: 'flex', gap: '10px'}}>
                    <button onClick={generatePDF} style={styles.pdfBtn}>
                        <Download size={18} /> Government Report
                    </button>
                    <button onClick={generateAuditReport} style={{...styles.pdfBtn, backgroundColor: '#1e293b'}}>
                        <FileText size={18} /> Audit Log Report
                    </button>
                </div>
            </div>

            <div style={styles.statsRow}>
                <div style={styles.statCard}>
                    <LayoutDashboard size={24} color="#64748b" />
                    <div><div style={styles.statLabel}>Total Assets</div><div style={styles.statValue}>{stats.total}</div></div>
                </div>
                <div style={styles.statCard}>
                    <CheckCircle2 size={24} color="#22c55e" />
                    <div><div style={styles.statLabel}>Good Condition</div><div style={styles.statValue}>{stats.good}</div></div>
                </div>
                <div style={styles.statCard}>
                    <AlertTriangle size={24} color="#f59e0b" />
                    <div><div style={styles.statLabel}>Need Repair</div><div style={styles.statValue}>{stats.repair}</div></div>
                </div>
                <div style={{...styles.statCard, borderRight: 'none'}}>
                    <Trash2 size={24} color="#ef4444" />
                    <div><div style={styles.statLabel}>Damaged</div><div style={styles.statValue}>{stats.damaged}</div></div>
                </div>
            </div>

            <div style={styles.mainGrid}>
                <div style={{display: 'flex', flexDirection: 'column', gap: '20px'}}>
                    <div style={styles.formCard}>
                        <h4 style={styles.cardTitle}><Plus size={18} /> {isEditing ? "Edit Asset Details" : "Register New Asset"}</h4>
                        <form onSubmit={handleSubmit} style={styles.verticalForm}>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>භාණ්ඩයේ නාමය (Select Item)</label>
                                <select 
                                    style={styles.select} 
                                    value={formData.itemName} 
                                    onChange={e => setFormData({...formData, itemName: e.target.value})} 
                                    required
                                >
                                    <option value="">-- භාණ්ඩයක් තෝරන්න --</option>
                                    {governmentAssetList.map((item, index) => (
                                        <option key={index} value={item}>{item}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>ප්‍රමාණය (Quantity)</label>
                                <input type="number" style={styles.input} value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} required />
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>අවසන් සේවා දිනය (Audit Date)</label>
                                <input type="date" style={styles.input} value={formData.lastServiceDate} onChange={e => setFormData({...formData, lastServiceDate: e.target.value})} />
                            </div>
                            <div style={styles.inputGroup}>
                                <label style={styles.label}>වත්මන් තත්ත්වය (Asset Condition)</label>
                                <select style={styles.select} value={formData.condition} onChange={e => setFormData({...formData, condition: e.target.value})}>
                                    <option value="Good">Good Condition</option>
                                    <option value="Damaged">Damaged</option>
                                    <option value="Need Repair">Needs Maintenance</option>
                                </select>
                            </div>
                            <button type="submit" style={styles.submitBtn}>{isEditing ? "Update Database" : "Save to Inventory"}</button>
                            {isEditing && <button type="button" onClick={resetForm} style={{...styles.submitBtn, backgroundColor: '#64748b'}}>Cancel</button>}
                        </form>
                    </div>

                    <div style={styles.formCard}>
                        <h4 style={styles.cardTitle}><PieIcon size={18} /> Condition Analysis</h4>
                        <div style={{height: '200px'}}>
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie data={chartData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend verticalAlign="bottom" height={36}/>
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                <div style={styles.tableCard}>
                    <div style={styles.tableHeader}>
                        <Search size={18} color="#64748b" />
                        <input type="text" placeholder="වත්කම් නාමයෙන් සොයන්න..." style={styles.tableSearch} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <div style={{maxHeight: '600px', overflowY: 'auto'}}>
                        <table style={styles.table}>
                            <thead>
                                <tr style={styles.thRow}>
                                    <th style={styles.th}>Asset Info</th>
                                    <th style={styles.th}>Status</th>
                                    <th style={styles.th}>Lifecycle Health</th>
                                    <th style={styles.th}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {assets.filter(a => a.itemName.toLowerCase().includes(searchTerm.toLowerCase())).length > 0 ? (
                                    assets.filter(a => a.itemName.toLowerCase().includes(searchTerm.toLowerCase())).map(asset => {
                                        const health = calculateHealth(asset.lastServiceDate, asset.condition);
                                        return (
                                            <tr key={asset._id} style={styles.tr}>
                                                <td style={styles.td}>
                                                    <div style={styles.assetName}>{asset.itemName}</div>
                                                    <div style={styles.assetSubText}>Units: {asset.quantity}</div>
                                                </td>
                                                <td style={styles.td}>
                                                    <span style={{
                                                        ...styles.statusBadge,
                                                        color: asset.condition === 'Good' ? '#166534' : '#991b1b',
                                                        backgroundColor: asset.condition === 'Good' ? '#dcfce7' : '#fee2e2'
                                                    }}>{asset.condition}</span>
                                                </td>
                                                <td style={styles.td}>
                                                    <div style={styles.healthWrapper}>
                                                        <div style={styles.healthTrack}>
                                                            <div style={{...styles.healthFill, width: `${health}%`, backgroundColor: health > 70 ? '#22c55e' : health > 40 ? '#f59e0b' : '#ef4444'}}></div>
                                                        </div>
                                                        <span style={styles.healthText}>{health}% Healthy</span>
                                                    </div>
                                                </td>
                                                <td style={styles.td}>
                                                    <button onClick={() => { setIsEditing(true); setEditId(asset._id); setFormData(asset); window.scrollTo(0,0); }} style={styles.editBtn}><Edit size={16}/></button>
                                                    <button onClick={() => { setDeleteTargetId(asset._id); setShowConfirm(true); }} style={styles.delBtn}><Trash2 size={16}/></button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="4" style={{textAlign: 'center', padding: '40px', color: '#64748b'}}>දත්ත කිසිවක් හමු නොවීය.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {showConfirm && (
                <div style={styles.overlay}>
                    <div style={styles.modal}>
                        <div style={{display: 'flex', justifyContent: 'center', marginBottom: '15px'}}>
                            <AlertTriangle size={48} color="#ef4444" />
                        </div>
                        <h3 style={{margin: '0 0 10px 0'}}>දත්තය ඉවත් කරන්නද?</h3>
                        <p style={{color: '#64748b', fontSize: '14px'}}>මෙම ක්‍රියාව ආපසු හැරවිය නොහැක.</p>
                        <div style={styles.modalBtns}>
                            <button onClick={() => setShowConfirm(false)} style={styles.cancelBtn}>අවලංගු කරන්න</button>
                            <button onClick={confirmDelete} style={styles.confirmBtn}>ඔව්, මකන්න</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

const styles = {
    container: { padding: '30px', backgroundColor: '#f1f5f9', minHeight: '100vh', fontFamily: "'Inter', sans-serif" },
    headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    header: { margin: 0, display: 'flex', alignItems: 'center', gap: '10px', color: '#1e293b' },
    subHeader: { fontSize: '13px', color: '#64748b', margin: '5px 0 0 42px' },
    statsRow: { display: 'flex', backgroundColor: '#fff', padding: '20px', borderRadius: '15px', marginBottom: '25px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' },
    statCard: { flex: 1, display: 'flex', alignItems: 'center', gap: '15px', padding: '0 20px', borderRight: '1px solid #f1f5f9' },
    statLabel: { fontSize: '12px', color: '#64748b', fontWeight: '600' },
    statValue: { fontSize: '20px', fontWeight: 'bold', color: '#1e293b' },
    pdfBtn: { padding: '10px 20px', backgroundColor: '#334155', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '600' },
    mainGrid: { display: 'grid', gridTemplateColumns: '350px 1fr', gap: '25px' },
    formCard: { backgroundColor: '#fff', padding: '25px', borderRadius: '15px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' },
    cardTitle: { margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '8px', color: '#1e293b' },
    verticalForm: { display: 'flex', flexDirection: 'column', gap: '15px' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '5px' },
    label: { fontSize: '12px', fontWeight: '600', color: '#475569' },
    input: { padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', outlineColor: '#800000' },
    select: { padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#fff', cursor: 'pointer' },
    submitBtn: { marginTop: '10px', padding: '12px', backgroundColor: '#800000', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' },
    tableCard: { backgroundColor: '#fff', borderRadius: '15px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' },
    tableHeader: { padding: '15px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '10px' },
    tableSearch: { border: 'none', outline: 'none', width: '100%', fontSize: '14px' },
    table: { width: '100%', borderCollapse: 'collapse' },
    thRow: { backgroundColor: '#f8fafc' },
    th: { padding: '15px 20px', textAlign: 'left', fontSize: '11px', color: '#64748b', textTransform: 'uppercase' },
    tr: { borderBottom: '1px solid #f1f5f9' },
    td: { padding: '15px 20px' },
    assetName: { fontWeight: 'bold', color: '#1e293b' },
    assetSubText: { fontSize: '11px', color: '#94a3b8' },
    statusBadge: { padding: '4px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: 'bold' },
    healthWrapper: { display: 'flex', flexDirection: 'column', gap: '4px' },
    healthTrack: { width: '100px', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '10px', overflow: 'hidden' },
    healthFill: { height: '100%', transition: '0.4s' },
    healthText: { fontSize: '10px', fontWeight: 'bold', color: '#64748b' },
    editBtn: { color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', marginRight: '10px' },
    delBtn: { color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' },
    overlay: { position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
    modal: { backgroundColor: '#fff', padding: '30px', borderRadius: '15px', textAlign: 'center', width: '350px' },
    modalBtns: { display: 'flex', gap: '10px', marginTop: '20px' },
    cancelBtn: { flex: 1, padding: '10px', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: 'pointer' },
    confirmBtn: { flex: 1, padding: '10px', border: 'none', borderRadius: '8px', backgroundColor: '#ef4444', color: '#fff', cursor: 'pointer' }
};

export default InventoryPage;