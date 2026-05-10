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
      otherAnimalSpecify: exposure.otherAnimalSpecify || '',
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
       otherAnimalSpecify: editingPatient.animalType === "Other" ? editingPatient.otherAnimalSpecify : null,
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
    const { name, value } = e.target;
    setSignupData(prev => ({
        ...prev,
        [name]: value
    }));
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

        // FIX: Make sure clinicId is sent as a number, not string
        const payload = {
            username: signupData.username,
            password: signupData.password,
            role: signupData.role,
            clinicId: signupData.role === 'EMPLOYEE' ? parseInt(signupData.clinicId, 10) : null
        };

        console.log('Payload being sent:', payload);  // DEBUG: Check what's being sent

        await axios.post('https://abc-backend-4.onrender.com/api/auth/signup', payload);
        setSignupMsg({ text: 'Account created successfully!', type: 'success' });
        setSignupData({ username: '', password: '', confirmPassword: '', role: 'EMPLOYEE', clinicId: '' });

        // Refresh the clinics list or user data
        fetchData(user);

    } catch (err) {
        console.error('Signup error:', err.response?.data);
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
const generateClinicReport = (clinicId, clinicName) => {
  // Filter exposures to ONLY this clinic
  const clinicExposures = exposures.filter(e => e.clinic?.clinicId === clinicId);
  // Filter by timeframe
  const filteredData = filterDataByTimeframe(clinicExposures, reportType);
  // Generate PDF with the clinic name
  generatePDF(filteredData, clinicName);
};
   const generatePDF = (dataToExport, clinicName) => {
     try {
       const doc = new jsPDF('landscape');
       const now = new Date();

       // Timeframe string logic
       let timeframeString = '';
       if (reportType === 'weekly') {
         const monthName = now.toLocaleDateString('en-US', { month: 'long' });
         timeframeString = `Weekly: ${monthName} ${now.getFullYear()}`;
       } else if (reportType === 'monthly') {
         const monthName = now.toLocaleDateString('en-US', { month: 'long' });
         timeframeString = `Monthly: ${monthName} ${now.getFullYear()}`;
       } else if (reportType === 'yearly') {
         timeframeString = `Yearly: ${now.getFullYear()}`;
       }

       // DOH OFFICIAL HEADER
       doc.setFontSize(10);
       doc.text("CENTER FOR HEALTH DEVELOPMENT IV-A", 148, 15, { align: 'center' });
       doc.text("RABIES PREVENTION AND CONTROL PROGRAM", 148, 20, { align: 'center' });
       doc.text("CITY HEALTH OFFICE", 148, 25, { align: 'center' });

       doc.setFontSize(14);
       doc.setFont(undefined, 'bold');
       doc.text("ACCOMPLISHMENT REPORT", 148, 32, { align: 'center' });

       doc.setFontSize(10);
       doc.setFont(undefined, 'normal');
       doc.text(`Clinic: ${clinicName}`, 14, 40);
       doc.text(`Period: ${timeframeString}`, 14, 45);

       // Calculate totals
       let totalPatients = dataToExport.length;
       let maleCount = 0;
       let femaleCount = 0;
       let u15Count = 0;
       let o15Count = 0;
       let cat1Count = 0;
       let cat2Count = 0;
       let cat3Count = 0;
       let dogCount = 0;
       let catCount = 0;
       let otherCount = 0;

       dataToExport.forEach(exp => {
         if (exp.patient?.gender === 'Male') maleCount++;
         else if (exp.patient?.gender === 'Female') femaleCount++;

         const birthDate = exp.patient?.birthdate ? new Date(exp.patient.birthdate) : null;
         if (birthDate) {
           const age = Math.floor((new Date() - birthDate) / 31557600000);
           if (age < 15) u15Count++;
           else o15Count++;
         }

         const biteCat = exp.biteCategory || '';
         if (biteCat === 'Category 1') cat1Count++;
         else if (biteCat === 'Category 2') cat2Count++;
         else if (biteCat === 'Category 3') cat3Count++;

         const animal = exp.animalType || '';
         if (animal === 'Dog') dogCount++;
         else if (animal === 'Cat') catCount++;
         else if (animal && animal !== 'Dog' && animal !== 'Cat') otherCount++;
       });

       // TABLE HEADERS
       const head1 = [
         { content: 'Registered Patients', rowSpan: 2, styles: { valign: 'middle', halign: 'center', fillColor: [37, 99, 235] } },
         { content: 'Sex', colSpan: 2, styles: { halign: 'center', fillColor: [37, 99, 235] } },
         { content: 'Age', colSpan: 2, styles: { halign: 'center', fillColor: [37, 99, 235] } },
         { content: 'AB Category', colSpan: 3, styles: { halign: 'center', fillColor: [37, 99, 235] } },
         { content: 'Biting Animal', colSpan: 3, styles: { halign: 'center', fillColor: [37, 99, 235] } }
       ];

       const head2 = [
         'Male', 'Female', '<15', '>15', 'CAT I', 'CAT II', 'CAT III', 'Dog', 'Cat', 'Others'
       ];

       // TABLE BODY
       const body = [[
         totalPatients,
         maleCount,
         femaleCount,
         u15Count,
         o15Count,
         cat1Count,
         cat2Count,
         cat3Count,
         dogCount,
         catCount,
         otherCount
       ]];

       // TABLE FOOTER (TOTAL row at the bottom)
       const foot = [[
         { content: 'TOTAL', styles: { fontStyle: 'bold', fillColor: [0, 0, 0] } },
         { content: maleCount, styles: { fontStyle: 'bold', fillColor: [0, 0, 0] } },
         { content: femaleCount, styles: { fontStyle: 'bold', fillColor: [0, 0, 0] } },
         { content: u15Count, styles: { fontStyle: 'bold', fillColor: [0, 0, 0] } },
         { content: o15Count, styles: { fontStyle: 'bold', fillColor: [0, 0, 0] } },
         { content: cat1Count, styles: { fontStyle: 'bold', fillColor: [0, 0, 0] } },
         { content: cat2Count, styles: { fontStyle: 'bold', fillColor: [0, 0, 0] } },
         { content: cat3Count, styles: { fontStyle: 'bold', fillColor: [0, 0, 0] } },
         { content: dogCount, styles: { fontStyle: 'bold', fillColor: [0, 0, 0] } },
         { content: catCount, styles: { fontStyle: 'bold', fillColor: [0, 0, 0] } },
         { content: otherCount, styles: { fontStyle: 'bold', fillColor: [0, 0, 0] } }
       ]];

       autoTable(doc, {
         startY: 50,
         head: [head1, head2],
         body: body,
         foot: foot,
         theme: 'grid',
         styles: {
           fontSize: 9,
           halign: 'center',
           valign: 'middle',
           cellPadding: 4
         },
         headStyles: {
           textColor: [255, 255, 255],
           fillColor: [37, 99, 235],
           fontStyle: 'bold'
         }
       });

       doc.save(`DOH_Report_${clinicName.replace(/\s+/g, '_')}_${now.toISOString().split('T')[0]}.pdf`);

     } catch (err) {
       console.error("PDF Generation Error:", err);
       Swal.fire('Error', 'Failed to generate PDF: ' + err.message, 'error');
     }
   };

const generateMasterReport = () => {
  // Filter data by timeframe
  const filteredData = filterDataByTimeframe(exposures, reportType);

  try {
    const doc = new jsPDF('landscape');
    const now = new Date();

    // Timeframe string
    let timeframeString = '';
    if (reportType === 'weekly') {
      const monthName = now.toLocaleDateString('en-US', { month: 'long' });
      timeframeString = `Weekly: ${monthName} ${now.getFullYear()}`;
    } else if (reportType === 'monthly') {
      const monthName = now.toLocaleDateString('en-US', { month: 'long' });
      timeframeString = `Monthly: ${monthName} ${now.getFullYear()}`;
    } else {
      timeframeString = `Yearly: ${now.getFullYear()}`;
    }

    // Header

    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text("MASTER ACCOMPLISHMENT REPORT (ALL CLINICS)", 148, 32, { align: 'center' });

    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Period: ${timeframeString}`, 14, 40);

    // Group by Clinic
    const clinicSummary = {};
    clinics.forEach(clinic => {
      clinicSummary[clinic.name] = {
        m: 0, f: 0, u15: 0, o15: 0, c1: 0, c2: 0, c3: 0, dog: 0, cat: 0, oth: 0, total: 0
      };
    });

    filteredData.forEach(exp => {
      const clinicName = exp.clinic?.name || "Unassigned";
      if (!clinicSummary[clinicName]) {
        clinicSummary[clinicName] = { m: 0, f: 0, u15: 0, o15: 0, c1: 0, c2: 0, c3: 0, dog: 0, cat: 0, oth: 0, total: 0 };
      }
      const s = clinicSummary[clinicName];
      s.total++;

      if (exp.patient?.gender === 'Male') s.m++;
      else if (exp.patient?.gender === 'Female') s.f++;

      const birthDate = exp.patient?.birthdate ? new Date(exp.patient.birthdate) : null;
      if (birthDate) {
        const age = Math.floor((new Date() - birthDate) / 31557600000);
        if (age < 15) s.u15++;
        else s.o15++;
      }

      if (exp.biteCategory === 'Category 1') s.c1++;
      else if (exp.biteCategory === 'Category 2') s.c2++;
      else if (exp.biteCategory === 'Category 3') s.c3++;

      if (exp.animalType === 'Dog') s.dog++;
      else if (exp.animalType === 'Cat') s.cat++;
      else if (exp.animalType && exp.animalType !== 'Dog' && exp.animalType !== 'Cat') s.oth++;
    });

    const head1 = [
      { content: 'CLINIC NAME', rowSpan: 2, styles: { valign: 'middle', fillColor: [37, 99, 235] } },
      { content: 'SEX', colSpan: 2, styles: { fillColor: [37, 99, 235] } },
      { content: 'AGE', colSpan: 2, styles: { fillColor: [37, 99, 235] } },
      { content: 'AB CATEGORY', colSpan: 3, styles: { fillColor: [37, 99, 235] } },
      { content: 'BITING ANIMAL', colSpan: 3, styles: { fillColor: [37, 99, 235] } },
      { content: 'TOTAL', rowSpan: 2, styles: { valign: 'middle', fillColor: [37, 99, 235] } }
    ];
    const head2 = ['M', 'F', '<15', '>15', 'CAT I', 'CAT II', 'CAT III', 'DOG', 'CAT', 'OTHERS'];

    const body = Object.keys(clinicSummary).map(name => [
      name,
      clinicSummary[name].m, clinicSummary[name].f,
      clinicSummary[name].u15, clinicSummary[name].o15,
      clinicSummary[name].c1, clinicSummary[name].c2, clinicSummary[name].c3,
      clinicSummary[name].dog, clinicSummary[name].cat, clinicSummary[name].oth,
      { content: clinicSummary[name].total, styles: { fontStyle: 'bold' } }
    ]);

    // Add total row
    const totalRow = [
      'TOTAL',
      Object.values(clinicSummary).reduce((sum, s) => sum + s.m, 0),
      Object.values(clinicSummary).reduce((sum, s) => sum + s.f, 0),
      Object.values(clinicSummary).reduce((sum, s) => sum + s.u15, 0),
      Object.values(clinicSummary).reduce((sum, s) => sum + s.o15, 0),
      Object.values(clinicSummary).reduce((sum, s) => sum + s.c1, 0),
      Object.values(clinicSummary).reduce((sum, s) => sum + s.c2, 0),
      Object.values(clinicSummary).reduce((sum, s) => sum + s.c3, 0),
      Object.values(clinicSummary).reduce((sum, s) => sum + s.dog, 0),
      Object.values(clinicSummary).reduce((sum, s) => sum + s.cat, 0),
      Object.values(clinicSummary).reduce((sum, s) => sum + s.oth, 0),
      { content: Object.values(clinicSummary).reduce((sum, s) => sum + s.total, 0), styles: { fontStyle: 'bold', fillColor: [240, 240, 240] } }
    ];
    body.push(totalRow);

    autoTable(doc, {
      startY: 45,
      head: [head1, head2],
      body: body,
      theme: 'grid',
      styles: { fontSize: 8, halign: 'center', cellPadding: 3 },
      headStyles: { textColor: [255, 255, 255], fillColor: [37, 99, 235] }
    });

    doc.save(`Master_Report_${now.toISOString().split('T')[0]}.pdf`);
  } catch (err) {
    console.error(err);
    Swal.fire('Error', 'Failed to generate master report', 'error');
  }
};

  const pendingAssessments = exposures.filter(exp => !exp.biteCategory || exp.biteCategory === "" || exp.biteCategory === null);

    if (loading) {
      return (
        <div className="container" style={{ textAlign: 'center', marginTop: '4rem' }}>
          <div className="glass-panel" style={{ padding: '3rem' }}>
            <h2>Loading Dashboard...</h2>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="container" style={{ textAlign: 'center', marginTop: '4rem' }}>
          <div className="glass-panel" style={{ padding: '3rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)' }}>
            <h3 style={{ color: 'var(--danger)' }}>Error Loading Dashboard</h3>
            <p>{error}</p>
            <button className="btn btn-primary" onClick={() => window.location.reload()}>Retry</button>
          </div>
        </div>
      );
    }

    if (!user) return null;

    return (
      <div className="container" style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h2 className="text-gradient" style={{ fontSize: '2rem' }}>Employee Dashboard</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Logged in as: <strong>{user.username}</strong> ({user.role})
            </p>
          </div>
          <button
            className="btn btn-primary"
            style={{ backgroundColor: 'var(--danger)', color: 'white', border: 'none', padding: '0.75rem 1.5rem' }}
            onClick={handleLogout}
          >
            Log Out
          </button>
        </div>

        {/* Main Grid Layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '2rem' }}>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Reports Panel */}
            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Reports</h3>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ fontSize: '0.875rem', display: 'block', marginBottom: '0.5rem' }}>Timeframe:</label>
                <select className="form-control" value={reportType} onChange={(e) => setReportType(e.target.value)} style={{ width: '100%' }}>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              {user.role === 'EMPLOYEE' && (
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    // Find the clinic name using user.clinicId
                    const userClinic = clinics.find(c => c.clinicId === user.clinicId);
                    const clinicName = userClinic?.name || 'My Clinic';
                    const clinicExposures = exposures.filter(e => e.clinic?.clinicId === user.clinicId);
                    generatePDF(filterDataByTimeframe(clinicExposures, reportType), clinicName);
                  }}
                  style={{ width: '100%' }}
                >
                  Generate Clinic PDF
                </button>
              )}

              {user.role === 'ADMIN' && (
                <>
                  <button className="btn btn-primary" onClick={generateMasterReport} style={{ width: '100%', marginBottom: '0.5rem' }}>
                    Generate Master Report
                  </button>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem', marginBottom: '0.5rem' }}>Per Clinic:</p>
                  {clinics.map(c => (
                    <button
                      key={c.clinicId}  // Changed from c.id
                      className="btn btn-secondary"
                      onClick={() => generateClinicReport(c.clinicId, c.name)}  // Changed from c.id
                      style={{ width: '100%', fontSize: '0.8rem', padding: '0.5rem', marginBottom: '0.25rem' }}
                    >
                      {c.name}
                    </button>
                  ))}
                </>
              )}
          </div>
            {/* Clinic Status Panel */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Clinic Status</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {clinics.map(clinic => {
                  if (user.role === 'EMPLOYEE' && clinic.clinicId !== user.clinicId) return null;
                  return (
                    <div key={clinic.clinicId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: 'rgba(37, 99, 235, 0.1)', borderRadius: '8px' }}>
                      <span style={{ fontSize: '0.875rem', fontWeight: 'bold' }}>{clinic.name}</span>
                      <button
                        onClick={() => toggleClinicStatus(clinic.clinicId)}
                        style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '20px',
                          border: 'none',
                          cursor: 'pointer',
                          backgroundColor: clinic.isOpen ? '#10b981' : '#ef4444',
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: '0.75rem'
                        }}
                      >
                        {clinic.isOpen ? 'OPEN' : 'CLOSED'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Admin Signup Panel */}
            {user.role === 'ADMIN' && (
              <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>Create Account</h3>
                {signupMsg && (
                  <div style={{
                    backgroundColor: signupMsg.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                    color: signupMsg.type === 'success' ? 'var(--secondary)' : 'var(--danger)',
                    padding: '0.75rem',
                    borderRadius: '4px',
                    marginBottom: '1rem',
                    fontSize: '0.875rem'
                  }}>
                    {signupMsg.text}
                  </div>
                )}
                <form onSubmit={handleCreateAccount} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <input type="text" className="form-control" name="username" placeholder="Username" value={signupData.username} onChange={handleSignupChange} required />
                  <input type="password" className="form-control" name="password" placeholder="Password" value={signupData.password} onChange={handleSignupChange} required />
                  <input type="password" className="form-control" name="confirmPassword" placeholder="Confirm Password" value={signupData.confirmPassword} onChange={handleSignupChange} required />
                  <select className="form-control" name="role" value={signupData.role} onChange={handleSignupChange}>
                    <option value="EMPLOYEE">Employee</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                  {signupData.role === 'EMPLOYEE' && (
                      <select
                          className="form-control"
                          name="clinicId"
                          value={signupData.clinicId}
                          onChange={handleSignupChange}
                          required
                      >
                          <option value="">Select Assigned Clinic</option>
                          {clinics.map(c => (
                              <option key={c.clinicId} value={c.clinicId}>
                                  {c.name}
                              </option>
                          ))}
                      </select>
                  )}
                  <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Create Account</button>
                </form>
              </div>
            )}
          </div>

          {/* Patient Records Section */}
          <div className="glass-panel" style={{ padding: '1.5rem', overflowX: 'auto' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>Patient Records</h3>

            <div style={{ marginBottom: '1rem' }}>
              <input
                type="text"
                placeholder="Search by name, contact, or address..."
                className="form-control"
                style={{ maxWidth: '300px' }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {exposures.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem' }}>No patient records found.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', minWidth: '1200px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #3b82f6', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem', fontSize: '0.9rem', fontWeight: 'bold', color: '#1e40af' }}>Name</th>
                    <th style={{ padding: '0.75rem', fontSize: '0.9rem', fontWeight: 'bold', color: '#1e40af' }}>Birthdate</th>
                    <th style={{ padding: '0.75rem', fontSize: '0.9rem', fontWeight: 'bold', color: '#1e40af' }}>Age</th>
                    <th style={{ padding: '0.75rem', fontSize: '0.9rem', fontWeight: 'bold', color: '#1e40af' }}>Gender</th>
                    <th style={{ padding: '0.75rem', fontSize: '0.9rem', fontWeight: 'bold', color: '#1e40af' }}>Contact</th>
                    <th style={{ padding: '0.75rem', fontSize: '0.9rem', fontWeight: 'bold', color: '#1e40af' }}>Full Address</th>
                    <th style={{ padding: '0.75rem', fontSize: '0.9rem', fontWeight: 'bold', color: '#1e40af' }}>Exposure Date</th>
                    <th style={{ padding: '0.75rem', fontSize: '0.9rem', fontWeight: 'bold', color: '#1e40af' }}>Place</th>
                    <th style={{ padding: '0.75rem', fontSize: '0.9rem', fontWeight: 'bold', color: '#1e40af' }}>Type</th>
                    <th style={{ padding: '0.75rem', fontSize: '0.9rem', fontWeight: 'bold', color: '#1e40af' }}>Animal</th>
                    <th style={{ padding: '0.75rem', fontSize: '0.9rem', fontWeight: 'bold', color: '#1e40af' }}>Conditions</th>
                    <th style={{ padding: '0.75rem', fontSize: '0.9rem', fontWeight: 'bold', color: '#1e40af' }}>Category</th>
                    {user.role === 'ADMIN' && <th style={{ padding: '0.75rem', fontSize: '0.9rem', fontWeight: 'bold', color: '#1e40af' }}>Clinic</th>}
                    <th style={{ padding: '0.75rem', fontSize: '0.9rem', fontWeight: 'bold', color: '#1e40af', textAlign: 'center' }}>Actions</th>
                   </tr>
                </thead>
                <tbody>
                  {exposures
                    .filter((exp) => {
                      const searchString = `${exp.patient?.firstName} ${exp.patient?.lastName} ${exp.patient?.contactNumber} ${exp.patient?.city}`.toLowerCase();
                      return searchString.includes(searchTerm.toLowerCase());
                    })
                    .map((exp, index) => (
                      <tr
                        key={exp.id}
                        style={{
                          backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc',
                          borderBottom: '1px solid #e2e8f0',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = index % 2 === 0 ? '#ffffff' : '#f8fafc'}
                      >
                        <td style={{ padding: '0.9rem 0.75rem', fontWeight: '500', whiteSpace: 'nowrap', color: '#1e293b' }}>
                          {`${exp.patient?.firstName || ''} ${exp.patient?.lastName || ''}`}
                        </td>
                        <td style={{ padding: '0.9rem 0.75rem', whiteSpace: 'nowrap', color: '#475569' }}>
                          {exp.patient?.birthdate || 'N/A'}
                        </td>
                        <td style={{ padding: '0.9rem 0.75rem', whiteSpace: 'nowrap', color: '#475569' }}>
                          {exp.patient?.age || 'N/A'}
                        </td>
                        <td style={{ padding: '0.9rem 0.75rem', whiteSpace: 'nowrap', color: '#475569' }}>
                          {exp.patient?.gender || 'N/A'}
                        </td>
                        <td style={{ padding: '0.9rem 0.75rem', whiteSpace: 'nowrap', color: '#475569' }}>
                          {exp.patient?.contactNumber || 'N/A'}
                        </td>
                        <td style={{ padding: '0.9rem 0.75rem', minWidth: '250px', color: '#475569' }}>
                          {`${exp.patient?.streetAddress || ''}, ${exp.patient?.barangay || ''}, ${exp.patient?.city || ''}, ${exp.patient?.province || ''}`}
                        </td>
                        <td style={{ padding: '0.9rem 0.75rem', whiteSpace: 'nowrap' }}>
                          {exp.exposureDate ? (
                            <span style={{ color: '#475569' }}>{exp.exposureDate}</span>
                          ) : (
                            <span style={{ color: '#ef4444', fontStyle: 'italic', fontWeight: '500' }}>Pending</span>
                          )}
                        </td>
                        <td style={{ padding: '0.9rem 0.75rem', minWidth: '150px', color: '#475569' }}>
                          {exp.placeOfExposure || <span style={{ color: '#ef4444', fontStyle: 'italic', fontWeight: '500' }}>Pending</span>}
                        </td>
                        <td style={{ padding: '0.9rem 0.75rem', whiteSpace: 'nowrap' }}>
                          {exp.exposureType ? (
                            <span style={{
                              backgroundColor: '#e0e7ff',
                              color: '#3730a3',
                              padding: '0.25rem 0.6rem',
                              borderRadius: '20px',
                              fontSize: '0.75rem',
                              fontWeight: '500'
                            }}>
                              {exp.exposureType}
                            </span>
                          ) : (
                            <span style={{ color: '#ef4444', fontStyle: 'italic', fontWeight: '500' }}>Pending</span>
                          )}
                        </td>
                        <td style={{ padding: '0.9rem 0.75rem', whiteSpace: 'nowrap', color: '#475569' }}>
                          {exp.animalType ? (exp.animalType === 'Others' && exp.otherAnimalSpecify ? exp.otherAnimalSpecify : exp.animalType) : <span style={{ color: '#ef4444', fontStyle: 'italic', fontWeight: '500' }}>Pending</span>}
                        </td>
                        <td style={{ padding: '0.9rem 0.75rem', minWidth: '200px', color: '#475569' }}>
                          {exp.animalConditions && exp.animalConditions.length > 0
                            ? [...new Set(exp.animalConditions.map(c => typeof c === 'string' ? c : c.conditionName))].filter(c => c && c.trim() !== '').join(', ')
                            : <span style={{ color: '#ef4444', fontStyle: 'italic', fontWeight: '500' }}>Pending</span>}
                        </td>
                        <td style={{ padding: '0.9rem 0.75rem', whiteSpace: 'nowrap' }}>
                          {exp.biteCategory ? (
                            <span style={{
                              backgroundColor: '#dbeafe',
                              color: '#1e40af',
                              padding: '0.3rem 0.75rem',
                              borderRadius: '30px',
                              fontWeight: '600',
                              fontSize: '0.7rem',
                              letterSpacing: '0.5px'
                            }}>
                              {exp.biteCategory.replace('Category ', 'CAT ')}
                            </span>
                          ) : (
                            <span style={{ color: '#ef4444', fontStyle: 'italic', fontWeight: '500' }}>Pending</span>
                          )}
                        </td>
                        {user.role === 'ADMIN' && (
                          <td style={{ padding: '0.9rem 0.75rem', whiteSpace: 'nowrap', color: '#475569' }}>
                            {exp.clinic?.name || 'N/A'}
                          </td>
                        )}
                        <td style={{ padding: '0.9rem 0.75rem', textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleUpdateClick(exp)}
                              style={{
                                background: '#3b82f6',
                                color: 'white',
                                border: 'none',
                                padding: '0.35rem 0.9rem',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: '500',
                                transition: 'background 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.background = '#2563eb'}
                              onMouseLeave={(e) => e.currentTarget.style.background = '#3b82f6'}
                            >
                              Edit
                            </button>
                            {user.role === 'ADMIN' && (
                              <button
                                onClick={() => handleDelete(exp.id)}
                                style={{
                                  background: '#ef4444',
                                  color: 'white',
                                  border: 'none',
                                  padding: '0.35rem 0.9rem',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                  fontSize: '0.75rem',
                                  fontWeight: '500',
                                  transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = '#dc2626'}
                                onMouseLeave={(e) => e.currentTarget.style.background = '#ef4444'}
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Edit Modal */}
        {editingPatient && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}>
            <div className="glass-panel" style={{
              padding: '2rem',
              width: '100%',
              maxWidth: '650px',
              maxHeight: '90vh',
              overflowY: 'auto',
              backgroundColor: 'white',
              borderRadius: '16px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)'
            }}>
              <h3 style={{
                marginBottom: '1.5rem',
                color: '#1e3a8a',
                borderBottom: '2px solid #3b82f6',
                paddingBottom: '0.75rem',
                fontSize: '1.5rem',
                fontWeight: 'bold'
              }}>
                Assess Patient
              </h3>

              {/* --- PATIENT NAME & CONTACT SECTION (BLUE CONTAINER) --- */}
              <div style={{
                backgroundColor: '#eff6ff',
                padding: '1.5rem',
                borderRadius: '12px',
                marginBottom: '1.5rem',
                border: '1px solid #bfdbfe'
              }}>
                <h4 style={{
                  color: '#1e40af',
                  marginBottom: '1rem',
                  fontWeight: '600',
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span style={{ width: '4px', height: '18px', backgroundColor: '#3b82f6', borderRadius: '2px' }}></span>
                  Patient Information
                </h4>

                {/* Name Fields */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.75rem', color: '#1e40af', fontWeight: 'bold', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
                    Full Name
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      className="form-control"
                      value={editingPatient.firstName || ''}
                      onChange={e => setEditingPatient({...editingPatient, firstName: e.target.value})}
                      placeholder="First Name"
                      style={{ flex: 1, backgroundColor: 'white', border: '1px solid #bfdbfe' }}
                    />
                    <input
                      type="text"
                      className="form-control"
                      value={editingPatient.middleName || ''}
                      onChange={e => setEditingPatient({...editingPatient, middleName: e.target.value})}
                      placeholder="Middle Name"
                      style={{ flex: 1, backgroundColor: 'white', border: '1px solid #bfdbfe' }}
                    />
                    <input
                      type="text"
                      className="form-control"
                      value={editingPatient.lastName || ''}
                      onChange={e => setEditingPatient({...editingPatient, lastName: e.target.value})}
                      placeholder="Last Name"
                      style={{ flex: 1, backgroundColor: 'white', border: '1px solid #bfdbfe' }}
                    />
                  </div>
                </div>

                {/* Contact Number */}
                <div style={{ marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.75rem', color: '#1e40af', fontWeight: 'bold', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
                    Contact Number
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={editingPatient.contactNumber || ''}
                    onChange={e => setEditingPatient({...editingPatient, contactNumber: e.target.value})}
                    placeholder="Contact Number"
                    style={{ backgroundColor: 'white', border: '1px solid #bfdbfe' }}
                  />
                </div>
              </div>

              {/* --- MEDICAL ASSESSMENT SECTION --- */}
              <div style={{
                backgroundColor: '#f8fafc',
                padding: '1.5rem',
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                marginBottom: '1.5rem'
              }}>
                <h4 style={{
                  color: '#1e3a8a',
                  marginBottom: '1.25rem',
                  fontWeight: '700',
                  fontSize: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}>
                  <span style={{ backgroundColor: '#2563eb', width: '4px', height: '18px', borderRadius: '2px' }}></span>
                  Medical Assessment
                </h4>

                {/* Exposure Date */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.75rem', color: '#1e40af', fontWeight: 'bold', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
                    Exposure Date
                  </label>
                  <input
                    type="date"
                    className="form-control"
                    value={editingPatient.exposureDate || ''}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => setEditingPatient({...editingPatient, exposureDate: e.target.value})}
                    style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', padding: '0.5rem', borderRadius: '6px', width: '100%' }}
                  />
                </div>

                {/* Animal Type */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.75rem', color: '#1e40af', fontWeight: 'bold', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
                    Type of Animal
                  </label>
                  <select
                    className="form-control"
                    value={editingPatient.animalType || ''}
                    onChange={e => setEditingPatient({...editingPatient, animalType: e.target.value, otherAnimalSpecify: e.target.value === "Other" ? editingPatient.otherAnimalSpecify : ""})}
                    style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', padding: '0.5rem', borderRadius: '6px', width: '100%' }}
                  >
                    <option value="">Select Animal</option>
                    <option value="Dog">Dog</option>
                    <option value="Cat">Cat</option>
                    <option value="Other">Others</option>
                  </select>

                  {editingPatient.animalType === "Other" && (
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Specify type of animal"
                      value={editingPatient.otherAnimalSpecify || ''}
                      onChange={e => setEditingPatient({...editingPatient, otherAnimalSpecify: e.target.value})}
                      style={{ marginTop: '0.5rem', backgroundColor: '#ffffff', border: '1px solid #cbd5e1', padding: '0.5rem', borderRadius: '6px', width: '100%' }}
                    />
                  )}
                </div>

                {/* Place of Exposure / Place of Incident */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.75rem', color: '#1e40af', fontWeight: 'bold', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
                    Place of Incident
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    value={editingPatient.placeOfExposure || ''}
                    onChange={e => setEditingPatient({...editingPatient, placeOfExposure: e.target.value})}
                    placeholder="e.g. Street, Park, House"
                    style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', padding: '0.5rem', borderRadius: '6px', width: '100%' }}
                  />
                </div>

                {/* Injury Type / Exposure Type */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.75rem', color: '#1e40af', fontWeight: 'bold', textTransform: 'uppercase', display: 'block', marginBottom: '0.25rem' }}>
                    Injury Type
                  </label>
                  <select
                    className="form-control"
                    value={editingPatient.exposureType || ''}
                    onChange={e => setEditingPatient({...editingPatient, exposureType: e.target.value})}
                    style={{ backgroundColor: '#ffffff', border: '1px solid #cbd5e1', padding: '0.5rem', borderRadius: '6px', width: '100%' }}
                  >
                    <option value="">Select Type</option>
                    <option value="Bite">Bite</option>
                    <option value="Scratch">Scratch</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Condition of Animal */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ fontSize: '0.75rem', color: '#1e40af', fontWeight: 'bold', textTransform: 'uppercase', display: 'block', marginBottom: '0.75rem' }}>
                    Condition of Animal
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                    {["Healthy", "Lost/Missing", "Sacrifice", "Sicked", "Died", "Stray"].map(option => (
                      <label key={option} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={editingPatient.animalConditions?.includes(option) || false}
                          onChange={(e) => {
                            const current = editingPatient.animalConditions || [];
                            const updated = e.target.checked
                              ? [...current, option]
                              : current.filter(item => item !== option);
                            setEditingPatient({...editingPatient, animalConditions: updated});
                          }}
                          style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                        />
                        <span style={{ fontSize: '0.875rem' }}>{option}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Bite Category */}
                <div style={{ marginBottom: '0.5rem' }}>
                  <label style={{ fontSize: '0.75rem', color: '#1e40af', fontWeight: 'bold', textTransform: 'uppercase', display: 'block', marginBottom: '0.5rem' }}>
                    Assign Bite Category
                  </label>
                  <select
                    className="form-control"
                    value={editingPatient.biteCategory || ''}
                    onChange={e => setEditingPatient({...editingPatient, biteCategory: e.target.value})}
                    style={{
                      backgroundColor: '#ffffff',
                      border: '2px solid #3b82f6',
                      fontWeight: '600',
                      color: '#1e3a8a',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      width: '100%'
                    }}
                  >
                    <option value="">Select Category</option>
                    <option value="Category 1">Category 1 (Non-exposure - No wound)</option>
                    <option value="Category 2">Category 2 (Minor - Scratch/abrasion without bleeding)</option>
                    <option value="Category 3">Category 3 (Severe - Single/multiple transdermal bites/bleeding)</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', borderTop: '1px solid #e2e8f0', paddingTop: '1.5rem' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => setEditingPatient(null)}
                  style={{ padding: '0.6rem 1.5rem', fontSize: '0.875rem' }}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleUpdateSave}
                  style={{ padding: '0.6rem 1.5rem', fontSize: '0.875rem', backgroundColor: '#2563eb' }}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  export default Dashboard;