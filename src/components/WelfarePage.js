import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Heart, UserPlus, ShieldCheck, Edit, Trash2, Filter, Search, FileDown, AlertCircle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function WelfarePage() {
    const [beneficiaries, setBeneficiaries] = useState([]);
    const [isEditing, setIsEditing] = useState(null);
    const [formData, setFormData] = useState({ 
        fullName: '', nic: '', householdNo: '', type: 'Aswasuma', amount: '', income: '' 
    });
    const [maxIncome, setMaxIncome] = useState('');

    // Validation state
    const [errors, setErrors] = useState({ nic: false });

    useEffect(() => {
        fetchBeneficiaries();
    }, []);

    const fetchBeneficiaries = async () => {
        try {
            const res = await axios.get('https://villageflow-backend.onrender.com/api/welfare/all');
            setBeneficiaries(res.data);
        } catch (err) { console.log("දත්ත ලබාගැනීම අසාර්ථකයි"); }
    };

    const validateNIC = (value) => {
        const oldNic = /^[0-9]{9}[vVxX]$/;
        const newNic = /^[0-9]{12}$/;
        const isValid = oldNic.test(value) || newNic.test(value);
        setErrors({ nic: !isValid && value.length > 0 });
        return isValid;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        if (name === 'nic') validateNIC(value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateNIC(formData.nic)) return;

        try {
            if (isEditing) {
                await axios.put(`https://villageflow-backend.onrender.com/api/welfare/update/${isEditing}`, formData);
            } else {
                await axios.post('https://villageflow-backend.onrender.com/api/welfare/add', formData);
            }
            resetForm();
            fetchBeneficiaries();
        } catch (err) { console.log("දෝෂයකි"); }
    };

    const handleDelete = async (id) => {
        if (window.confirm("මෙම දත්ත ඉවත් කිරීමට ඔබට විශ්වාසද?")) {
            try {
                await axios.delete(`https://villageflow-backend.onrender.com/api/welfare/delete/${id}`);
                fetchBeneficiaries();
            } catch (err) { console.log("ඉවත් කිරීම අසාර්ථකයි"); }
        }
    };

    const toggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'Active' ? 'Suspended' : 'Active';
        try {
            await axios.put(`https://villageflow-backend.onrender.com/api/welfare/update/${id}`, { status: newStatus });
            fetchBeneficiaries();
        } catch (err) { console.log("තත්ත්වය වෙනස් කිරීම අසාර්ථකයි"); }
    };

    const resetForm = () => {
        setIsEditing(null);
        setFormData({ fullName: '', nic: '', householdNo: '', type: 'Aswasuma', amount: '', income: '' });
        setErrors({ nic: false });
    };

    // Member 03: PDF Report Generator
    const downloadPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("VillageFlow - Welfare Beneficiaries Report", 14, 20);
        doc.setFontSize(11);
        doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 30);

        const tableColumn = ["Name", "NIC", "Type", "Income", "Amount", "Status"];
        const tableRows = beneficiaries.map(person => [
            person.fullName, person.nic, person.type, `Rs. ${person.income}`, `Rs. ${person.amount}`, person.status
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 40,
            theme: 'striped',
            headStyles: { fillColor: [128, 0, 0] }
        });
        doc.save("Welfare_Report.pdf");
    };

    // Member 04: Income Filter
    const handleFilterByIncome = async () => {
        if (!maxIncome) { fetchBeneficiaries(); return; }
        try {
            const res = await axios.get(`https://villageflow-backend.onrender.com/api/welfare/filter/income/${maxIncome}`);
            setBeneficiaries(res.data);
        } catch (err) { console.log("පෙරහන් කිරීම අසාර්ථකයි"); }
    };

    return (
        <div style={styles.container}>
            <div style={styles.topBar}>
                <h2 style={styles.header}><Heart color="#e11d48" fill="#e11d48" size={24} /> සහනාධාර කළමනාකරණය</h2>
                
                <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                    <div style={styles.filterSection}>
                        <Filter size={18} color="#64748b" />
                        <input type="number" placeholder="උපරිම ආදායම" value={maxIncome} onChange={(e) => setMaxIncome(e.target.value)} style={styles.filterInput} />
                        <button onClick={handleFilterByIncome} style={styles.filterBtn}><Search size={14} /> Filter</button>
                    </div>
                    <button onClick={downloadPDF} style={styles.downloadBtn}><FileDown size={16} /> PDF Report</button>
                </div>
            </div>

            <div style={styles.card}>
                <h4 style={styles.cardTitle}>{isEditing ? <Edit size={18} /> : <UserPlus size={18} />} {isEditing ? "සංස්කරණය" : "ලියාපදිංචිය"}</h4>
                <form onSubmit={handleSubmit} style={styles.form}>
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>සම්පූර්ණ නම</label>
                        <input name="fullName" type="text" placeholder="නම" value={formData.fullName} onChange={handleInputChange} style={styles.input} required />
                    </div>
                    
                    <div style={styles.inputGroup}>
                        <label style={styles.label}>NIC අංකය</label>
                        <input 
                            name="nic" 
                            type="text" 
                            placeholder="9V හෝ අංක 12" 
                            value={formData.nic} 
                            onChange={handleInputChange} 
                            style={{
                                ...styles.input, 
                                borderColor: errors.nic ? '#ef4444' : '#e2e8f0',
                                backgroundColor: errors.nic ? '#fef2f2' : 'white'
                            }} 
                            required 
                        />
                        {errors.nic && (
                            <span style={styles.errorText}>
                                <AlertCircle size={12}/> නිවැරදි NIC අංකයක් ඇතුළත් කරන්න.
                            </span>
                        )}
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>නිවාස අංකය</label>
                        <input name="householdNo" type="text" placeholder="අංකය" value={formData.householdNo} onChange={handleInputChange} style={styles.input} required />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>සහනාධාර වර්ගය</label>
                        <select name="type" value={formData.type} onChange={handleInputChange} style={styles.select}>
                            <option value="Aswasuma">අස්වැසුම</option>
                            <option value="Samurdhi">සමෘද්ධි</option>
                            <option value="Elderly Allowance">වැඩිහිටි දීමනාව</option>
                        </select>
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>දීමනා මුදල</label>
                        <input name="amount" type="number" placeholder="රුපියල්" value={formData.amount} onChange={handleInputChange} style={styles.input} required />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={styles.label}>මාසික ආදායම</label>
                        <input name="income" type="number" placeholder="රුපියල්" value={formData.income} onChange={handleInputChange} style={styles.input} required />
                    </div>

                    <div style={{display: 'flex', gap: '10px', width: '100%', marginTop: '10px'}}>
                        <button 
                            type="submit" 
                            disabled={errors.nic} 
                            style={{...styles.submitBtn, opacity: errors.nic ? 0.5 : 1, cursor: errors.nic ? 'not-allowed' : 'pointer'}}
                        >
                            {isEditing ? "යාවත්කාලීන කරන්න" : "ලියාපදිංචි කරන්න"}
                        </button>
                        {isEditing && (
                            <button type="button" onClick={resetForm} style={styles.cancelBtn}>අවලංගු කරන්න</button>
                        )}
                    </div>
                </form>
            </div>

            <div style={styles.tableWrapper}>
                <table style={styles.table}>
                    <thead>
                        <tr>
                            <th style={styles.th}>නම</th>
                            <th style={styles.th}>NIC</th>
                            <th style={styles.th}>වර්ගය</th>
                            <th style={styles.th}>ආදායම</th>
                            <th style={styles.th}>මුදල</th>
                            <th style={styles.th}>තත්ත්වය</th>
                            <th style={styles.th}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {beneficiaries.map(person => (
                            <tr key={person._id}>
                                <td style={styles.td}>{person.fullName}</td>
                                <td style={styles.td}>{person.nic}</td>
                                <td style={styles.td}>{person.type}</td>
                                <td style={styles.td}>Rs. {person.income}</td>
                                <td style={styles.td}>Rs. {person.amount}</td>
                                <td style={styles.td}>
                                    <span style={{
                                        padding: '4px 8px', 
                                        borderRadius: '4px', 
                                        fontSize: '12px',
                                        backgroundColor: person.status === 'Active' ? '#dcfce7' : '#fee2e2',
                                        color: person.status === 'Active' ? '#166534' : '#991b1b'
                                    }}>
                                        {person.status}
                                    </span>
                                </td>
                                <td style={styles.td}>
                                    <button onClick={() => { setIsEditing(person._id); setFormData(person); }} style={styles.actionBtn}><Edit size={14} color="#64748b"/></button>
                                    <button onClick={() => toggleStatus(person._id, person.status)} style={styles.actionBtn}><ShieldCheck size={14} color="#166534"/></button>
                                    <button onClick={() => handleDelete(person._id)} style={styles.actionBtn}><Trash2 size={14} color="#ef4444"/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

const styles = {
    container: { padding: '20px', maxWidth: '1200px', margin: 'auto', fontFamily: 'sans-serif' },
    topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' },
    header: { fontSize: '22px', fontWeight: 'bold', margin: 0, display: 'flex', alignItems: 'center', gap: '10px', color: '#1e293b' },
    downloadBtn: { backgroundColor: '#334155', color: 'white', border: 'none', padding: '10px 18px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500' },
    filterSection: { display: 'flex', alignItems: 'center', gap: '8px', backgroundColor: 'white', padding: '8px 15px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e2e8f0' },
    filterInput: { border: 'none', outline: 'none', width: '130px', fontSize: '14px' },
    filterBtn: { backgroundColor: '#800000', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px' },
    card: { backgroundColor: 'white', padding: '25px', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', marginBottom: '30px', border: '1px solid #f1f5f9' },
    cardTitle: { margin: '0 0 20px 0', display: 'flex', alignItems: 'center', gap: '10px', color: '#334155' },
    form: { display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-start' },
    inputGroup: { display: 'flex', flexDirection: 'column', gap: '6px', flex: '1 1 200px' },
    label: { fontSize: '13px', fontWeight: '600', color: '#64748b' },
    input: { padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', transition: 'all 0.2s ease' },
    select: { padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', backgroundColor: 'white', height: '45px' },
    errorText: { color: '#ef4444', fontSize: '11px', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' },
    submitBtn: { padding: '12px 25px', backgroundColor: '#800000', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', transition: 'background 0.2s' },
    cancelBtn: { padding: '12px 25px', backgroundColor: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px' },
    tableWrapper: { backgroundColor: 'white', borderRadius: '15px', overflowX: 'auto', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #f1f5f9' },
    table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
    th: { padding: '15px', backgroundColor: '#f8fafc', color: '#64748b', fontSize: '13px', fontWeight: 'bold', borderBottom: '2px solid #edf2f7' },
    td: { padding: '15px', borderBottom: '1px solid #f1f5f9', fontSize: '14px', color: '#334155' },
    actionBtn: { padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px', cursor: 'pointer', backgroundColor: 'white', marginRight: '8px', transition: 'all 0.2s' }
};

export default WelfarePage;