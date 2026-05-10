import Swal from 'sweetalert2';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const API_URL = 'https://abc-backend-4.onrender.com';

function Dashboard() {
  const [user, setUser] = useState(null);
  const [exposures, setExposures] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingPatient, setEditingPatient] = useState(null);
  const [reportType, setReportType] = useState('monthly');
  const [searchTerm, setSearchTerm] = useState("");
  const [signupData, setSignupData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    role: 'EMPLOYEE',
    clinicId: ''
  });
  const [signupMsg, setSignupMsg] = useState(null);
  const navigate = useNavigate();

  // Fetch user and data on mount
  useEffect(() => {
    const loggedInUser = localStorage.getItem('user');
    if (!loggedInUser) {
      navigate('/login');
      return;
    }
    try {
      const parsedUser = JSON.parse(loggedInUser);
      setUser(parsedUser);
      fetchData(parsedUser);
    } catch (err) {
      console.error("Error parsing user:", err);
      navigate('/login');
    }
  }, [navigate]);

  const fetchData = async (currentUser) => {
    setLoading(true);
    setError(null);
    try {
      // Fetch exposures based on role
      let expRes;
      if (currentUser.role === 'ADMIN') {
        expRes = await axios.get('https://abc-backend-4.onrender.com/api/dashboard/exposures');
      } else {
        expRes = await axios.get(`https://abc-backend-4.onrender.com/api/dashboard/exposures/clinic/${currentUser.clinicId}`);
      }

      // Filter out exposures without valid patient data
      const validExposures = expRes.data.filter(exp => exp.patient !== null);
      setExposures(validExposures);

      // Fetch clinics
      const clinicRes = await axios.get('https://abc-backend-4.onrender.com/api/clinics');
      setClinics(clinicRes.data);
    } catch (err) {
      console.error("Error fetching data:", err);
      setError(err.response?.data || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (user.role !== 'ADMIN') {
      Swal.fire('Access Denied', 'Only Administrators can delete records.', 'error');
      return;
    }

    const result = await Swal.fire({
      title: 'Are you sure?',
      text: "This action cannot be undone!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`https://abc-backend-4.onrender.com/api/dashboard/exposures/${id}`);
        setExposures(exposures.filter(exp => exp.id !== id));
        Swal.fire('Deleted!', 'Record has been deleted.', 'success');
      } catch (err) {
        Swal.fire('Error', 'Failed to delete record.', 'error');
      }
    }
  };

  const handleUpdateClick = (exposure) => {
    const today = new Date().toISOString().split('T')[0];

    setEditingPatient({
        id: exposure.patient?.patientId,
      exposureId: exposure.exposureId,
      firstName: exposure.patient.firstName || '',
      middleName: exposure.patient.middleName || '',
      lastName: exposure.patient.lastName || '',
      contactNumber: exposure.patient.contactNumber || '',
      exposureDate: exposure.exposureDate || today,
      biteCategory: exposure.biteCategory || '',
      animalType: exposure.animalType || '',
      exposureType: exposure.exposureType || '',
      placeOfExposure: exposure.placeOfExposure || '',

      animalConditions: exposure.animalConditions || []
    });
  };

 const handleUpdateSave = async () => {
   try {
     const payload = {
       exposureDate: editingPatient.exposureDate,
       animalType: editingPatient.animalType,
       biteCategory: editingPatient.biteCategory,
       exposureType: editingPatient.exposureType,  // This will be "Bite", "Scratch", or "Other"
       placeOfExposure: editingPatient.placeOfExposure,
       animalConditions: (editingPatient.animalConditions || []).map(cond =>
         typeof cond === 'object' ? cond.conditionName : cond
       )
     };

     // Remove otherExposureType since we don't need it
     delete payload.otherExposureType;

     const response = await axios.patch(
       `https://abc-backend-4.onrender.com/api/dashboard/patients/${editingPatient.id}/assess`,
       payload
     );

     if (response.status === 200) {
       await fetchData(user);
       setEditingPatient(null);
       Swal.fire('Success', 'Assessment saved successfully!', 'success');
     }
   } catch (err) {
     console.error("Save failed:", err);
     Swal.fire('Error', err.response?.data || 'Failed to save assessment', 'error');
   }
 };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const toggleClinicStatus = async (clinicId) => {
    try {
      await axios.put(`https://abc-backend-4.onrender.com/api/clinics/${clinicId}/toggle-status`);
      await fetchData(user);
      Swal.fire('Success', 'Clinic status updated', 'success');
    } catch (err) {
      Swal.fire('Error', 'Failed to toggle clinic status.', 'error');
    }
  };

  const handleSignupChange = (e) => {
    setSignupData({ ...signupData, [e.target.name]: e.target.value });
  };

  const handleCreateAccount = async (e) => {
    e.preventDefault();
    setSignupMsg(null);

    try {
      if (signupData.username.length < 4 || signupData.username.length > 20) {
        setSignupMsg({ text: 'Username must be between 4 and 20 characters', type: 'error' });
        return;
      }
      if (signupData.password.length < 8) {
        setSignupMsg({ text: 'Password must be at least 8 characters', type: 'error' });
        return;
      }
      if (signupData.password !== signupData.confirmPassword) {
        setSignupMsg({ text: 'Passwords do not match', type: 'error' });
        return;
      }

      const payload = {
        username: signupData.username,
        password: signupData.password,
        role: signupData.role,
        clinicId: signupData.role === 'EMPLOYEE' ? signupData.clinicId : null
      };

      await axios.post('https://abc-backend-4.onrender.com/api/auth/signup', payload);
      setSignupMsg({ text: 'Account created successfully!', type: 'success' });
      setSignupData({ username: '', password: '', confirmPassword: '', role: 'EMPLOYEE', clinicId: '' });
    } catch (err) {
      setSignupMsg({ text: err.response?.data?.message || 'Failed to create account', type: 'error' });
    }
  };

  const filterDataByTimeframe = (data, type) => {
    const now = new Date();
    return data.filter(e => {
      if (!e.exposureDate) return false;
      const d = new Date(e.exposureDate);
      if (type === 'weekly') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        return d >= oneWeekAgo && d <= now;
      } else if (type === 'monthly') {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      } else if (type === 'yearly') {
        return d.getFullYear() === now.getFullYear();
      }
      return true;
    });
  };
const filteredExposures = exposures.filter(exp => {
    const fullName = `${exp.patient.firstName} ${exp.patient.middleName || ''} ${exp.patient.lastName}`.toLowerCase();
    const contact = exp.patient.contactNumber || '';
    const q = searchQuery.toLowerCase();
    return fullName.includes(q) || contact.includes(q);
  });

  const generatePDF = (dataToExport, clinicName = "All Clinics", isMaster = false) => {
    try {
      const doc = new jsPDF('landscape');
      const now = new Date();

      let timeframeString = '';
      if (reportType === 'weekly') {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const weekNum = Math.ceil((now.getDate() + startOfMonth.getDay()) / 7);
        const monthName = now.toLocaleDateString('en-US', { month: 'long' });
        timeframeString = `Weekly: Week ${weekNum} of ${monthName} ${now.getFullYear()}`;
      } else if (reportType === 'monthly') {
        const monthName = now.toLocaleDateString('en-US', { month: 'long' });
        timeframeString = `Monthly: ${monthName} ${now.getFullYear()}`;
      } else if (reportType === 'yearly') {
        timeframeString = `Yearly: ${now.getFullYear()}`;
      }

      const pageWidth = doc.internal.pageSize.getWidth();
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text("CENTER FOR HEALTH DEVELOPMENT IV-A", pageWidth / 2, 15, { align: "center" });
      doc.text("RABIES PREVENTION AND CONTROL PROGRAM", pageWidth / 2, 21, { align: "center" });
      doc.text("CITY HEALTH OFFICE", pageWidth / 2, 27, { align: "center" });

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text("ACCOMPLISHMENT REPORT", pageWidth / 2, 35, { align: "center" });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Clinic: ${clinicName}`, 14, 45);
      doc.text(timeframeString, 14, 51);

      const groupedData = {};
      dataToExport.forEach(exp => {
        const cName = isMaster ? exp.clinic.name : clinicName;
        if (!groupedData[cName]) {
          groupedData[cName] = { patients: 0, male: 0, female: 0, under15: 0, over15: 0, dog: 0, cat: 0, others: 0, cat1: 0, cat2: 0, cat3: 0 };
        }

        const stats = groupedData[cName];
        stats.patients++;
        if (exp.patient.gender === 'Male') stats.male++;
        if (exp.patient.gender === 'Female') stats.female++;

        let calculatedAge = 0;
        if (exp.patient.birthdate) {
            const dob = new Date(exp.patient.birthdate);
            const ageDiffMs = Date.now() - dob.getTime();
            const ageDate = new Date(ageDiffMs);
            calculatedAge = Math.abs(ageDate.getUTCFullYear() - 1970);
        }
        if (calculatedAge < 15) stats.under15++;
        else stats.over15++;

        if (exp.animalType === 'Dog') stats.dog++;
        else if (exp.animalType === 'Cat') stats.cat++;
        else stats.others++;

        if (exp.biteCategory === 'Category 1') stats.cat1++;
        else if (exp.biteCategory === 'Category 2') stats.cat2++;
        else if (exp.biteCategory === 'Category 3') stats.cat3++;
      });

      const head1 = [];
      const head2 = [];

      if (isMaster) {
        head1.push({ content: 'Animal Bite Center', colSpan: 1, styles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], halign: 'center' } });
        head2.push({ content: 'Clinic', styles: { fillColor: [96, 165, 250], textColor: [0, 0, 0], halign: 'center' } });
      }

      head1.push(
        { content: 'Registered Patients', colSpan: 1, styles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], halign: 'center' } },
        { content: 'Sex', colSpan: 2, styles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], halign: 'center' } },
        { content: 'Age', colSpan: 2, styles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], halign: 'center' } },
        { content: 'AB Category', colSpan: 3, styles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], halign: 'center' } },
        { content: 'Biting Animal', colSpan: 3, styles: { fillColor: [37, 99, 235], textColor: [255, 255, 255], halign: 'center' } }
      );

      head2.push(
        { content: 'Patients', styles: { fillColor: [96, 165, 250], textColor: [0, 0, 0], halign: 'center' } },
        { content: 'Male', styles: { fillColor: [96, 165, 250], textColor: [0, 0, 0], halign: 'center' } },
        { content: 'Female', styles: { fillColor: [96, 165, 250], textColor: [0, 0, 0], halign: 'center' } },
        { content: '< 15', styles: { fillColor: [96, 165, 250], textColor: [0, 0, 0], halign: 'center' } },
        { content: '> 15', styles: { fillColor: [96, 165, 250], textColor: [0, 0, 0], halign: 'center' } },
        { content: 'CAT I', styles: { fillColor: [96, 165, 250], textColor: [0, 0, 0], halign: 'center' } },
        { content: 'CAT II', styles: { fillColor: [96, 165, 250], textColor: [0, 0, 0], halign: 'center' } },
        { content: 'CAT III', styles: { fillColor: [96, 165, 250], textColor: [0, 0, 0], halign: 'center' } },
        { content: 'Dog', styles: { fillColor: [96, 165, 250], textColor: [0, 0, 0], halign: 'center' } },
        { content: 'Cat', styles: { fillColor: [96, 165, 250], textColor: [0, 0, 0], halign: 'center' } },
        { content: 'Others', styles: { fillColor: [96, 165, 250], textColor: [0, 0, 0], halign: 'center' } }
      );

      const body = [];
      const grandTotal = { patients: 0, male: 0, female: 0, under15: 0, over15: 0, dog: 0, cat: 0, others: 0, cat1: 0, cat2: 0, cat3: 0 };

      Object.keys(groupedData).forEach(cName => {
        const stats = groupedData[cName];
        const row = [];
        if (isMaster) row.push(cName);
        row.push(
          stats.patients, stats.male, stats.female, stats.under15, stats.over15,
          stats.cat1, stats.cat2, stats.cat3, stats.dog, stats.cat, stats.others
        );
        body.push(row);

        Object.keys(grandTotal).forEach(key => grandTotal[key] += stats[key]);
      });

      const footRow = [];
      if (isMaster) footRow.push({ content: 'TOTAL', styles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], halign: 'center', fontStyle: 'bold' } });

      footRow.push(
        { content: (isMaster ? '' : 'TOTAL: ') + grandTotal.patients, styles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], halign: 'center', fontStyle: 'bold' } },
        { content: grandTotal.male, styles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], halign: 'center', fontStyle: 'bold' } },
        { content: grandTotal.female, styles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], halign: 'center', fontStyle: 'bold' } },
        { content: grandTotal.under15, styles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], halign: 'center', fontStyle: 'bold' } },
        { content: grandTotal.over15, styles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], halign: 'center', fontStyle: 'bold' } },
        { content: grandTotal.cat1, styles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], halign: 'center', fontStyle: 'bold' } },
        { content: grandTotal.cat2, styles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], halign: 'center', fontStyle: 'bold' } },
        { content: grandTotal.cat3, styles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], halign: 'center', fontStyle: 'bold' } },
        { content: grandTotal.dog, styles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], halign: 'center', fontStyle: 'bold' } },
        { content: grandTotal.cat, styles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], halign: 'center', fontStyle: 'bold' } },
        { content: grandTotal.others, styles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], halign: 'center', fontStyle: 'bold' } }
      );

      autoTable(doc, {
        startY: 55,
        head: [head1, head2],
        body: body,
        foot: [footRow],
        theme: 'grid',
        styles: {
          fontSize: 10,
          cellPadding: 3,
          lineColor: [0, 0, 0],
          lineWidth: 0.1,
          halign: 'center'
        },
        headStyles: {
          lineColor: [0, 0, 0],
          lineWidth: 0.1
        }
      });

      doc.save(`Animal_Bite_Report_${clinicName.replace(/\s+/g, '_')}.pdf`);
    } catch(err) {
      console.error("PDF Generation Error:", err);
      alert("Error generating PDF: " + err.message);
    }
  };

  const generateClinicReport = (clinicId, clinicName) => {
    const data = exposures.filter(e => e.clinic.id === clinicId);
    generatePDF(filterDataByTimeframe(data, reportType), clinicName, false);
  };

  const generateMasterReport = () => {
    generatePDF(filterDataByTimeframe(exposures, reportType), "ALL CLINICS (Master Report)", true);
  };

  const animalConditionOptions = ['Healthy', 'Lost/Missing', 'Sacrifice', 'Sicked', 'Died', 'Stray'];

  if (!user || loading) return <div className="container" style={{ textAlign: 'center', marginTop: '4rem' }}>Loading Dashboard...</div>;

  return (
    <div className="container" style={{ maxWidth: '1600px', padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2 className="text-gradient">Employee Dashboard</h2>
          <p style={{ color: 'var(--text-muted)' }}>Logged in as: <strong>{user.username}</strong> ({user.role})</p>
        </div>
        <button className="btn btn-primary" style={{ backgroundColor: 'var(--danger)', color: 'white', border: 'none' }} onClick={handleLogout}>Log Out</button>
      </div>

      <div className="dashboard-layout">
        {/* Sidebar Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <div className="glass-panel" style={{ padding: '2rem', height: 'fit-content' }}>
            <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Reports</h3>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.875rem', display: 'block', marginBottom: '0.5rem' }}>Timeframe:</label>
              <select className="form-control" value={reportType} onChange={(e) => setReportType(e.target.value)}>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            {user.role === 'ADMIN' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <button className="btn btn-primary" onClick={generateMasterReport} style={{ width: '100%', marginBottom: '1rem' }}>
                  Generate Master Report
                </button>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem', fontWeight: '500' }}>Generate report per clinic:</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {clinics.map(c => (
                    <button
                      key={c.id}
                      onClick={() => generateClinicReport(c.id, c.name)}
                      style={{
                        width: '100%',
                        fontSize: '0.85rem',
                        padding: '0.75rem 1rem',
                        backgroundColor: '#eff6ff',
                        color: '#1e40af',
                        border: '1px solid #bfdbfe',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontWeight: '600',
                        transition: 'all 0.2s ease',
                        boxShadow: 'none',
                        textAlign: 'left',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#dbeafe';
                        e.currentTarget.style.borderColor = '#93c5fd';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#eff6ff';
                        e.currentTarget.style.borderColor = '#bfdbfe';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <button className="btn btn-primary" onClick={() => generateClinicReport(user.clinicId, clinics.find(c => c.id === user.clinicId)?.name)} style={{ width: '100%' }}>
                Generate Clinic PDF
              </button>
            )}
          </div>

          <div className="glass-panel" style={{ padding: '2rem', height: 'fit-content' }}>
            <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Clinic Status</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Toggle clinics open/closed.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {clinics.map(clinic => {
                if (user.role === 'EMPLOYEE' && clinic.id !== user.clinicId) return null;
                return (
                  <div key={clinic.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: 'rgba(37, 99, 235, 0.1)', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.875rem', color: '#1e40af', fontWeight: 'bold' }}>{clinic.name}</span>
                    <button
                      onClick={() => toggleClinicStatus(clinic.id)}
                      style={{
                        padding: '0.25rem 0.5rem', borderRadius: '4px', border: clinic.isOpen ? '1px solid #4ade80' : 'none', cursor: 'pointer',
                        backgroundColor: clinic.isOpen ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                        color: clinic.isOpen ? '#166534' : 'var(--danger)',
                        fontWeight: 'bold', fontSize: '0.75rem'
                      }}
                    >
                      {clinic.isOpen ? 'OPEN' : 'CLOSED'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '2rem', height: 'fit-content' }}>
            <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Modules</h3>
            <button
              className="btn btn-secondary"
              style={{ width: '100%', backgroundColor: 'rgba(37,99,235,0.1)', color: '#1e40af', border: '1px solid rgba(37,99,235,0.3)', fontWeight: 'bold' }}
              onClick={() => alert('This module will handle the scheduling and tracking of vaccinations')}
            >
              Vaccinations
            </button>
          </div>

          {user.role === 'ADMIN' && (
            <div className="glass-panel" style={{ padding: '2rem', height: 'fit-content' }}>
              <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Create Account</h3>
              {signupMsg && (
                <div style={{
                  backgroundColor: signupMsg.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color: signupMsg.type === 'success' ? 'var(--secondary)' : 'var(--danger)',
                  padding: '0.75rem', borderRadius: '4px', marginBottom: '1rem', fontSize: '0.875rem'
                }}>
                  {signupMsg.text}
                </div>
              )}
              <form onSubmit={handleCreateAccount} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <input type="text" className="form-control" name="username" placeholder="Username" value={signupData.username} onChange={handleSignupChange} required />

                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input type={showSignupPassword ? "text" : "password"} className="form-control" name="password" placeholder="Password" value={signupData.password} onChange={handleSignupChange} required style={{ paddingRight: '2.5rem', width: '100%' }} />
                  <button type="button" onClick={() => setShowSignupPassword(!showSignupPassword)} style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {showSignupPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>

                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <input type={showSignupConfirmPassword ? "text" : "password"} className="form-control" name="confirmPassword" placeholder="Confirm Password" value={signupData.confirmPassword} onChange={handleSignupChange} required style={{ paddingRight: '2.5rem', width: '100%' }} />
                  <button type="button" onClick={() => setShowSignupConfirmPassword(!showSignupConfirmPassword)} style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {showSignupConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                  </button>
                </div>

                <select className="form-control" name="role" value={signupData.role} onChange={handleSignupChange}>
                  <option value="EMPLOYEE">Employee</option>
                  <option value="ADMIN">Admin</option>
                </select>
                {signupData.role === 'EMPLOYEE' && (
                  <select className="form-control" name="clinicId" value={signupData.clinicId} onChange={handleSignupChange} required>
                    <option value="">Select Assigned Clinic</option>
                    {clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                )}
                <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '0.5rem' }}>Create Account</button>
              </form>
            </div>
          )}
        </div>

        {/* Main Content - Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: 0 }}>

          {/* Global Search Panel - Aligned and same width as Patient Records */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary)' }}><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              <input
                type="text"
                className="form-control"
                placeholder="Search patient records by name or contact number..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{ flex: 1, fontSize: '1rem', padding: '0.75rem', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
              />
            </div>
          </div>

          {/* Patient Records Panel */}
          <div className="glass-panel" style={{ padding: '2rem', overflowX: 'auto', width: '100%', flex: 1 }}>
            <div style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, color: '#1e40af' }}>Patient Records</h3>
            </div>

            {filteredExposures.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No patient records found matching your search.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', whiteSpace: 'nowrap' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', textAlign: 'left', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '1rem 1rem', minWidth: '120px' }}>First Name</th>
                    <th style={{ padding: '1rem 1rem', minWidth: '80px' }}>M.N.</th>
                    <th style={{ padding: '1rem 1rem', minWidth: '120px' }}>Last Name</th>
                    <th style={{ padding: '1rem 1rem', minWidth: '80px' }}>Sex</th>
                    <th style={{ padding: '1rem 1rem', minWidth: '100px' }}>Birthdate</th>
                    <th style={{ padding: '1rem 1rem', minWidth: '120px' }}>Contact</th>
                    <th style={{ padding: '1rem 1rem', minWidth: '300px' }}>Full Address</th>
                    <th style={{ padding: '1rem 1rem', minWidth: '120px' }}>Exposure Date</th>
                    <th style={{ padding: '1rem 1rem', minWidth: '150px' }}>Place</th>
                    <th style={{ padding: '1rem 1rem', minWidth: '100px' }}>Type</th>
                    <th style={{ padding: '1rem 1rem', minWidth: '120px' }}>Animal</th>
                    <th style={{ padding: '1rem 1rem', minWidth: '200px' }}>Conditions</th>
                    <th style={{ padding: '1rem 1rem', minWidth: '120px' }}>Category</th>
                    {user.role === 'ADMIN' && <th style={{ padding: '1rem 1rem', minWidth: '150px' }}>Clinic</th>}
                    <th style={{ padding: '1rem 1rem', textAlign: 'right', minWidth: '150px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExposures.map(exp => (
                    <tr key={exp.id} style={{ borderBottom: '1px solid rgba(0,0,0,0.05)', transition: 'background-color 0.2s ease' }} onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.05)'} onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                      <td style={{ padding: '1rem 1rem', fontWeight: '500' }}>{exp.patient.firstName}</td>
                      <td style={{ padding: '1rem 1rem' }}>{exp.patient.middleName}</td>
                      <td style={{ padding: '1rem 1rem', fontWeight: '500' }}>{exp.patient.lastName}</td>
                      <td style={{ padding: '1rem 1rem' }}>{exp.patient.gender}</td>
                      <td style={{ padding: '1rem 1rem' }}>{exp.patient.birthdate}</td>
                      <td style={{ padding: '1rem 1rem' }}>{exp.patient.contactNumber}</td>
                      <td style={{ padding: '1rem 1rem', whiteSpace: 'normal', minWidth: '300px' }}>{`${exp.patient.streetAddress}, ${exp.patient.barangay}, ${exp.patient.city}, ${exp.patient.province}`}</td>
                      <td style={{ padding: '1rem 1rem' }}>{exp.exposureDate ? exp.exposureDate : <span style={{ color: 'var(--danger)', fontStyle: 'italic', fontWeight: 'bold' }}>Pending</span>}</td>
                      <td style={{ padding: '1rem 1rem', whiteSpace: 'normal', minWidth: '150px' }}>{exp.placeOfExposure ? exp.placeOfExposure : <span style={{ color: 'var(--danger)', fontStyle: 'italic', fontWeight: 'bold' }}>Pending</span>}</td>
                      <td style={{ padding: '1rem 1rem' }}>{exp.exposureType ? exp.exposureType : <span style={{ color: 'var(--danger)', fontStyle: 'italic', fontWeight: 'bold' }}>Pending</span>}</td>
                      <td style={{ padding: '1rem 1rem' }}>
                        {exp.animalType ? (exp.animalType === 'Others' && exp.otherAnimalSpecify ? exp.otherAnimalSpecify : exp.animalType) : <span style={{ color: 'var(--danger)', fontStyle: 'italic', fontWeight: 'bold' }}>Pending</span>}
                      </td>
                      <td style={{ padding: '1rem 1rem', whiteSpace: 'normal', minWidth: '200px' }}>
                        {exp.animalConditions && exp.animalConditions.length > 0
                          ? Array.from(new Set(exp.animalConditions.map(c => typeof c === 'string' ? c : c.conditionName))).filter(c => c && c.trim() !== '').join(', ')
                          : <span style={{ color: 'var(--danger)', fontStyle: 'italic', fontWeight: 'bold' }}>Pending</span>}
                      </td>
                      <td style={{ padding: '1rem 1rem' }}>
                        {exp.biteCategory ? (
                          <span style={{ backgroundColor: 'rgba(37,99,235,0.1)', color: '#1e40af', padding: '0.4rem 0.8rem', borderRadius: '50px', fontWeight: '600', fontSize: '0.75rem' }}>
                            {exp.biteCategory.replace('Category ', 'CAT ')}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--danger)', fontStyle: 'italic', fontWeight: 'bold' }}>Pending</span>
                        )}
                      </td>
                      {user.role === 'ADMIN' && <td style={{ padding: '1rem 1rem' }}>{exp.clinic.name}</td>}
                      <td style={{ padding: '1rem 1rem', textAlign: 'right' }}>
                        <button
                          onClick={() => handleUpdateClick(exp)}
                          style={{ backgroundColor: 'var(--primary)', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', marginRight: '0.5rem', fontWeight: '500' }}
                        >
                          Edit
                        </button>
                        {user.role === 'ADMIN' && (
                          <button
                            onClick={() => handleDelete(exp.id)}
                            style={{ backgroundColor: 'var(--danger)', color: 'white', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editingPatient && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(37, 99, 235, 0.1)', backdropFilter: 'blur(3px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, padding: '2rem' }}>
          <div className="glass-panel" style={{ padding: '2.5rem', width: '100%', maxWidth: '800px', backgroundColor: 'rgba(235, 244, 255, 0.95)', maxHeight: '90vh', overflowY: 'auto', border: '2px solid rgba(59, 130, 246, 0.5)', borderRadius: '16px', boxShadow: '0 8px 32px rgba(37, 99, 235, 0.2)' }}>
            <h3 style={{ marginBottom: '1.5rem', color: '#1e40af', borderBottom: '1px solid rgba(59, 130, 246, 0.2)', paddingBottom: '0.5rem', fontWeight: 'bold' }}>Edit Patient & Exposure Info</h3>

            {/* 1. Patient Info Section */}
            <h4 style={{ color: '#1e40af', marginBottom: '1rem', fontWeight: '600' }}>Patient Personal Info</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#1e40af', fontWeight: 'bold' }}>Name (First Middle Last)</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input type="text" className="form-control" value={editingPatient.firstName || ''} onChange={e => setEditingPatient({...editingPatient, firstName: e.target.value})} placeholder="First" style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.9)', border: '1px solid rgba(147, 197, 253, 0.8)' }} />
                  <input type="text" className="form-control" value={editingPatient.middleName || ''} onChange={e => setEditingPatient({...editingPatient, middleName: e.target.value})} placeholder="Middle" style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.9)', border: '1px solid rgba(147, 197, 253, 0.8)' }} />
                  <input type="text" className="form-control" value={editingPatient.lastName || ''} onChange={e => setEditingPatient({...editingPatient, lastName: e.target.value})} placeholder="Last" style={{ flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.9)', border: '1px solid rgba(147, 197, 253, 0.8)' }} />
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#1e40af', fontWeight: 'bold' }}>Contact Number</label>
                <input
                  type="text"
                  className="form-control"
                  value={editingPatient.contactNumber || ''}
                  onChange={e => {
                    const numericValue = e.target.value.replace(/[^0-9]/g, '');
                    if (numericValue.length <= 11) {
                      setEditingPatient({...editingPatient, contactNumber: numericValue});
                    }
                  }}
                  maxLength="11"
                  placeholder="Contact"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', border: '1px solid rgba(147, 197, 253, 0.8)' }}
                />
              </div>
            </div>

            {/* 2. Exposure Details Section */}
            <h4 style={{ color: '#1e40af', marginBottom: '1rem', fontWeight: '600', borderTop: '1px solid rgba(59, 130, 246, 0.2)', paddingTop: '1rem' }}>Exposure Details</h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#1e40af', fontWeight: 'bold' }}>Date of Exposure <span style={{ color: 'var(--danger)' }}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <DatePicker
                    selected={editingPatient.exposureDate ? new Date(editingPatient.exposureDate) : null}
                    onChange={handleExposureDateChange}
                    maxDate={new Date()}
                    showYearDropdown
                    showMonthDropdown
                    dropdownMode="select"
                    className="form-control"
                    placeholderText="mm/dd/yyyy"
                    dateFormat="MM/dd/yyyy"
                    strictParsing
                    customInput={
                      <input
                        maxLength="10"
                        onInput={(e) => {
                          e.target.value = e.target.value.replace(/[^0-9/]/g, '');
                        }}
                        style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', border: '1px solid rgba(147, 197, 253, 0.8)' }}
                      />
                    }
                  />
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="20" height="20"
                    viewBox="0 0 24 24" fill="none"
                    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                    style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--primary)', pointerEvents: 'none' }}
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#1e40af', fontWeight: 'bold' }}>Place of Exposure <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input
                  type="text"
                  className="form-control"
                  value={editingPatient.placeOfExposure || ''}
                  onChange={e => setEditingPatient({...editingPatient, placeOfExposure: e.target.value})}
                  placeholder="Where did it happen?"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', border: '1px solid rgba(147, 197, 253, 0.8)' }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#1e40af', fontWeight: 'bold' }}>Type of Exposure <span style={{ color: 'var(--danger)' }}>*</span></label>
                <select
                  className="form-control"
                  value={editingPatient.exposureType || ''}
                  onChange={e => setEditingPatient({...editingPatient, exposureType: e.target.value})}
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', border: '1px solid rgba(147, 197, 253, 0.8)' }}
                >
                  <option value="">Select Type</option>
                  <option value="Bite">Bite</option>
                  <option value="Scratch">Scratch</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#1e40af', fontWeight: 'bold' }}>Type of Animal <span style={{ color: 'var(--danger)' }}>*</span></label>
                <select
                  className="form-control"
                  value={editingPatient.animalType || ''}
                  onChange={e => setEditingPatient({...editingPatient, animalType: e.target.value})}
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', border: '1px solid rgba(147, 197, 253, 0.8)' }}
                >
                  <option value="">Select Animal</option>
                  <option value="Dog">Dog</option>
                  <option value="Cat">Cat</option>
                  <option value="Others">Others</option>
                </select>
              </div>
            </div>

            {editingPatient.animalType === 'Others' && (
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.8rem', color: '#1e40af', fontWeight: 'bold' }}>Specify Other Animal <span style={{ color: 'var(--danger)' }}>*</span></label>
                <input
                  type="text"
                  className="form-control"
                  value={editingPatient.otherAnimalSpecify || ''}
                  onChange={e => setEditingPatient({...editingPatient, otherAnimalSpecify: e.target.value})}
                  placeholder="Specify animal"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', border: '1px solid rgba(147, 197, 253, 0.8)' }}
                />
              </div>
            )}

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ fontSize: '0.8rem', color: '#1e40af', fontWeight: 'bold', display: 'block', marginBottom: '0.5rem' }}>
                Condition of Animal (Select all that apply) <span style={{ color: 'var(--danger)' }}>*</span>
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                {animalConditionOptions.map(condition => (
                  <label key={condition} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: 'var(--text-main)' }}>
                    <input
                      type="checkbox"
                      checked={(editingPatient.animalConditions || []).includes(condition)}
                      onChange={() => handleConditionChange(condition)}
                      style={{ cursor: 'pointer' }}
                    />
                    {condition}
                  </label>
                ))}
              </div>
            </div>

            {/* 3. Medical Assessment */}
            <h4 style={{ color: '#1e40af', marginBottom: '1rem', fontWeight: '600', borderTop: '1px solid rgba(59, 130, 246, 0.2)', paddingTop: '1rem' }}>Medical Assessment</h4>
            <div style={{ marginBottom: '2rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', color: '#1e40af', fontWeight: 'bold' }}>Assign Bite Category: <span style={{ color: 'var(--danger)' }}>*</span></label>
              <select
                className="form-control"
                value={editingPatient.biteCategory || ''}
                onChange={e => setEditingPatient({...editingPatient, biteCategory: e.target.value})}
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', border: '1px solid rgba(147, 197, 253, 0.8)' }}
              >
                <option value="">Select Category</option>
                <option value="Category 1">Category 1</option>
                <option value="Category 2">Category 2</option>
                <option value="Category 3">Category 3</option>
              </select>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid rgba(59, 130, 246, 0.2)', paddingTop: '1.5rem' }}>
              <button className="btn btn-secondary" onClick={() => setEditingPatient(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleUpdateSave}>Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
