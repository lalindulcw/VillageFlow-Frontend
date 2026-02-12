import React, { useState, useEffect } from 'react';
import axios from 'axios';
import * as Lucide from 'lucide-react'; 

function NoticePage() {
    const [notices, setNotices] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [isEditing, setIsEditing] = useState(null); // Edit කරන Notice එකේ ID එක
    const [formData, setFormData] = useState({ 
        title: '', 
        desc_si: '', 
        desc_ta: '', 
        desc_en: '', 
        category: 'General' 
    });
    
    const user = JSON.parse(localStorage.getItem('user'));
    const isOfficer = user?.role === 'officer';

    useEffect(() => {
        fetchNotices();
    }, []);

    const fetchNotices = async () => {
        try {
            const res = await axios.get('https://villageflow-backend.onrender.com/api/notices/all');
            setNotices(res.data);
        } catch (err) {
            console.error("දත්ත ලබාගැනීම අසාර්ථකයි");
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await axios.put(`https://villageflow-backend.onrender.com/api/notices/update/${isEditing}`, formData);
                alert("නිවේදනය යාවත්කාලීන කළා!");
            } else {
                await axios.post('https://villageflow-backend.onrender.com/api/notices/add', formData);
                alert("නව නිවේදනය පළ කළා!");
            }
            resetForm();
            fetchNotices();
        } catch (err) {
            alert("ක්‍රියාවලිය අසාර්ථකයි");
        }
    };

    const handleEdit = (notice) => {
        setFormData({
            title: notice.title,
            desc_si: notice.desc_si || notice.description, // පැරණි ඒවා සඳහා fallback
            desc_ta: notice.desc_ta || '',
            desc_en: notice.desc_en || '',
            category: notice.category
        });
        setIsEditing(notice._id);
        setShowForm(true);
    };

    const resetForm = () => {
        setFormData({ title: '', desc_si: '', desc_ta: '', desc_en: '', category: 'General' });
        setIsEditing(null);
        setShowForm(false);
    };

    const handleDelete = async (id) => {
        if (window.confirm("මෙම නිවේදනය මකා දැමීමට අවශ්‍යද?")) {
            await axios.delete(`https://villageflow-backend.onrender.com/api/notices/delete/${id}`);
            fetchNotices();
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.headerBar}>
                <div>
                    <h2 style={styles.title}>
                        <Lucide.Megaphone color="#800000" size={28} /> නිවේදන පුවරුව | அறிவிப்பு பலகை | Notice Board
                    </h2>
                </div>
                {isOfficer && (
                    <button onClick={() => showForm ? resetForm() : setShowForm(true)} style={styles.addBtn}>
                        {showForm ? <Lucide.X size={18}/> : <Lucide.PlusCircle size={18}/>}
                        {showForm ? " වසන්න" : " නව නිවේදනයක්"}
                    </button>
                )}
            </div>

            {isOfficer && showForm && (
                <div style={styles.formCard}>
                    <h3>{isEditing ? "නිවේදනය සංස්කරණය" : "නව නිවේදනයක්"}</h3>
                    <form onSubmit={handleSubmit} style={styles.form}>
                        <div style={styles.inputGroup}>
                            <input placeholder="මාතෘකාව (Title)" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} style={styles.input} required />
                            <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} style={styles.select}>
                                <option value="General">General</option>
                                <option value="Welfare">Welfare</option>
                                <option value="Meeting">Meeting</option>
                                <option value="Emergency">Emergency</option>
                            </select>
                        </div>
                        
                        <textarea placeholder="සිංහල විස්තරය (Sinhala Description)" value={formData.desc_si} onChange={e => setFormData({...formData, desc_si: e.target.value})} style={styles.textarea} required />
                        <textarea placeholder="தமிழ் விளக்கம் (Tamil Description)" value={formData.desc_ta} onChange={e => setFormData({...formData, desc_ta: e.target.value})} style={styles.textarea} />
                        <textarea placeholder="English Description" value={formData.desc_en} onChange={e => setFormData({...formData, desc_en: e.target.value})} style={styles.textarea} />
                        
                        <button type="submit" style={styles.submitBtn}>
                            {isEditing ? "යාවත්කාලීන කරන්න (Update)" : "පළ කරන්න (Publish)"}
                        </button>
                    </form>
                </div>
            )}

            <div style={styles.grid}>
                {notices.map(notice => (
                    <div key={notice._id} style={{...styles.noticeCard, borderTop: `5px solid ${notice.category === 'Emergency' ? '#ef4444' : '#800000'}`}}>
                        <div style={styles.cardHeader}>
                            <span style={styles.categoryBadge}><Lucide.Tag size={12} /> {notice.category}</span>
                            {isOfficer && (
                                <div>
                                    <button onClick={() => handleEdit(notice)} style={styles.editBtn}><Lucide.Edit2 size={16} /></button>
                                    <button onClick={() => handleDelete(notice._id)} style={styles.deleteBtn}><Lucide.Trash2 size={16} /></button>
                                </div>
                            )}
                        </div>
                        <h3 style={styles.noticeHeading}>{notice.title}</h3>
                        
                        <div style={styles.langSection}>
                            <p style={styles.desc}><b>SI:</b> {notice.desc_si || notice.description}</p>
                            {notice.desc_ta && <p style={styles.desc}><b>TA:</b> {notice.desc_ta}</p>}
                            {notice.desc_en && <p style={styles.desc}><b>EN:</b> {notice.desc_en}</p>}
                        </div>

                        <div style={styles.cardFooter}>
                            <span style={styles.date}><Lucide.Clock size={14}/> {new Date(notice.postedDate).toLocaleDateString()}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

const styles = {
    container: { padding: '40px 20px', maxWidth: '1200px', margin: 'auto', fontFamily: 'sans-serif' },
    headerBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px', borderBottom: '2px solid #800000', paddingBottom: '15px' },
    title: { display: 'flex', alignItems: 'center', gap: '10px', fontSize: '22px' },
    addBtn: { backgroundColor: '#800000', color: 'white', border: 'none', padding: '10px 15px', borderRadius: '5px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' },
    formCard: { background: '#fff3f3', padding: '25px', borderRadius: '10px', marginBottom: '30px', border: '1px solid #ffcccc' },
    form: { display: 'flex', flexDirection: 'column', gap: '12px' },
    inputGroup: { display: 'flex', gap: '10px' },
    input: { flex: 2, padding: '10px', borderRadius: '5px', border: '1px solid #ccc' },
    select: { flex: 1, padding: '10px', borderRadius: '5px', border: '1px solid #ccc' },
    textarea: { padding: '10px', borderRadius: '5px', border: '1px solid #ccc', minHeight: '60px', fontFamily: 'inherit' },
    submitBtn: { padding: '12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '25px' },
    noticeCard: { background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' },
    cardHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: '10px' },
    categoryBadge: { fontSize: '12px', background: '#eee', padding: '4px 8px', borderRadius: '5px' },
    noticeHeading: { color: '#800000', marginBottom: '15px' },
    langSection: { display: 'flex', flexDirection: 'column', gap: '8px' },
    desc: { fontSize: '14px', margin: 0, color: '#333', lineHeight: '1.4' },
    cardFooter: { marginTop: '15px', paddingTop: '10px', borderTop: '1px solid #eee' },
    date: { fontSize: '12px', color: '#777', display: 'flex', alignItems: 'center', gap: '5px' },
    editBtn: { background: 'none', border: 'none', color: '#007bff', cursor: 'pointer', marginRight: '10px' },
    deleteBtn: { background: 'none', border: 'none', color: '#dc3545', cursor: 'pointer' }
};

export default NoticePage;