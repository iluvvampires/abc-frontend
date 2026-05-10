import Swal from 'sweetalert2';
import { PHILIPPINE_LOCATIONS } from '../locationData';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const API_URL = 'https://abc-backend-4.onrender.com';

function PatientRegistration() {
  const navigate = useNavigate();
  const [clinic, setClinic] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('selectedClinic');
    if (!saved) {
      navigate('/select-clinic');
    } else {
      setClinic(JSON.parse(saved));
    }
  }, [navigate]);

  const initialFormState = {
    firstName: '', middleName: '', lastName: '', birthdate: '', gender: '',
    contactNumber: '', region: '', province: '', city: '', barangay: '', zone: '', streetAddress: '',
    exposureDate: '', placeOfExposure: '', exposureType: '', animalType: '',
    otherAnimalSpecify: '', animalConditions: []
  };

  const [formData, setFormData] = useState(initialFormState);

  const animalConditionOptions = ['healthy', 'lost/missing', 'sacrifice', 'sicked', 'died', 'stray'];

const handleNameChange = (e) => {
  const { name, value } = e.target;

  // This removes numbers and special characters instantly
  const cleanValue = value.replace(/[^a-zA-Z\s]/g, '');

  setFormData({
    ...formData,
    [name]: cleanValue
  });
};
const handleBirthdateChange = (e) => {
  const dob = e.target.value;
  if (!dob) return;

  const birthDate = new Date(dob);
  const today = new Date();

  // 1. Check if the date is in the future
  if (birthDate > today) {
    alert("Birthdate cannot be in the future!");
    setFormData({ ...formData, birthdate: '', age: '' });
    return;
  }

  // 2. Calculate Age
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();

  // Adjust if the birthday hasn't happened yet this year
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  setFormData({
    ...formData,
    birthdate: dob,
    age: age >= 0 ? age : 0 // Ensure it's never negative
  });
};
const handleContactChange = (e) => {
  const { name, value } = e.target;

  // 1. Remove any non-numeric characters
  const cleanValue = value.replace(/\D/g, '');

  // 2. Prevent entering anything that doesn't start with '0'
  if (cleanValue.length === 1 && cleanValue !== '0') return;

  // 3. Prevent entering anything that doesn't start with '09'
  if (cleanValue.length === 2 && cleanValue !== '09') return;

  // 4. Update the state
  setFormData({
    ...formData,
    [name]: cleanValue
  });
};


  // --- Place these inside your component ---
  const regions = Object.keys(PHILIPPINE_LOCATIONS);

  const provinces = formData.region
    ? Object.keys(PHILIPPINE_LOCATIONS[formData.region])
    : [];

  const cities = (formData.region && formData.province)
    ? Object.keys(PHILIPPINE_LOCATIONS[formData.region][formData.province])
    : [];

  const barangays = (formData.region && formData.province && formData.city)
    ? PHILIPPINE_LOCATIONS[formData.region][formData.province][formData.city]
    : [];

const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    // 1. Handle Checkboxes
    if (type === 'checkbox') {
      let updatedConditions = [...formData.animalConditions];
      if (checked) {
        updatedConditions.push(value);
      } else {
        updatedConditions = updatedConditions.filter(c => c !== value);
      }
      setFormData({ ...formData, animalConditions: updatedConditions });
    }
    // 2. Handle Barangay & Auto-Zone
    else if (name === "barangay") {
      const selectedBarangayObj = barangays.find(b => b.name === value);
      setFormData({
        ...formData,
        barangay: value,
        zone: selectedBarangayObj ? selectedBarangayObj.zone : ""
      });
    }
    // 3. Handle Cascading Resets
    else if (name === "region") {
      setFormData({ ...formData, region: value, province: "", city: "", barangay: "", zone: "" });
    }
    else if (name === "province") {
      setFormData({ ...formData, province: value, city: "", barangay: "", zone: "" });
    }
    else if (name === "city") {
      setFormData({ ...formData, city: value, barangay: "", zone: "" });
    }
    // 4. Default for all other inputs
    else {
      setFormData({ ...formData, [name]: value });
    }
  }; // This closes the function correctly


  const calculateAge = () => {
    if (!formData.birthdate) return '';
    const today = new Date();
    const birthDate = new Date(formData.birthdate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleClear = () => {
    if (window.confirm("Are you sure you want to delete all the information you entered?")) {
      setFormData(initialFormState);
    }
  };

const attemptSubmit = (e) => {
  e.preventDefault();
  setError(null);

  // --- 1. VALIDATION LOGIC ---
  // Check Contact Number
  if (formData.contactNumber.length !== 11 || !formData.contactNumber.startsWith('09')) {
    setError("Please enter a valid 11-digit contact number starting with '09'.");
    window.scrollTo(0, 0); // Scroll up so user sees the red error box
    return;
  }

  // Check Names (No numbers allowed)
  const nameRegex = /^[a-zA-Z\s]*$/;
  if (!nameRegex.test(formData.firstName) || !nameRegex.test(formData.lastName)) {
    setError("Names should not contain numbers or special characters.");
    window.scrollTo(0, 0);
    return;
  }

  // --- 2. SHOW MODAL ---
  // If we reach this line, it means the data is valid!
  setShowConfirm(true);
};

  const confirmSubmit = async () => {
    setShowConfirm(false);
    setSubmitting(true); // This makes the button show "Submitting..."
    setError(null);

    try {
      const payload = {
        ...formData,
        exposureDate: formData.exposureDate || new Date().toISOString().split('T')[0],
        otherAnimalSpecify: formData.animalType !== 'Others' ? null : formData.otherAnimalSpecify,
        exposureType: formData.exposureType,
        placeOfExposure: formData.placeOfExposure,
        clinicId: clinic.clinicId || clinic.id,
      };
        console.log('Sending payload:', payload);

      const response = await axios.post('https://abc-backend-4.onrender.com/api/register', payload);

      if (response.status === 200) {
        // 1. Turn off the submitting state immediately so the UI isn't "stuck"
        setSubmitting(false);

        // 2. Show the SweetAlert
        Swal.fire({
          title: 'Successfully Registered!',
          text: 'The patient record has been saved.',
          icon: 'success',
          confirmButtonColor: '#3B82F6',
          confirmButtonText: 'OK'
        }).then((result) => {
          if (result.isConfirmed) {
            // 3. Trigger your big checkmark screen or redirect
            setSuccess(true);
          }
        });
      }
    } catch (err) {
      console.error("Full Error:", err);

      // Extract a STRING from the error object
      const errorMessage =
        err.response?.data?.message || // Detailed Spring error
        (typeof err.response?.data === 'string' ? err.response.data : null) ||
        "Server Error: Check if you deleted columns from Patient.java";

      setError(errorMessage); // Now it's a string, React won't crash!

      Swal.fire({
        title: 'Registration Failed',
        text: errorMessage,
        icon: 'error'
      });
    } finally {
      setSubmitting(false);
    }
}

  if (success) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '5rem' }}>
        <div className="glass-panel" style={{ padding: '4rem 2rem', border: '1px solid var(--secondary)' }}>
          <div style={{ color: 'var(--secondary)', marginBottom: '1rem' }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
          </div>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'var(--text-main)' }}>Registration Successful!</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.25rem', marginBottom: '2rem' }}>
            Your information has been successfully recorded in the centralized database.
          </p>
          <button className="btn btn-primary" onClick={() => navigate('/')}>Return Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="glass-panel" style={{ padding: '2rem 3rem', position: 'relative' }}>
        <h2 style={{ marginBottom: '0.5rem' }} className="text-gradient">Patient Registration</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
          Registering at: <strong style={{ color: 'var(--primary)' }}>{clinic?.name}</strong>
        </p>

        {error && (
          <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', padding: '1rem', borderRadius: '8px', marginBottom: '2rem', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
            {error}
          </div>
        )}

        <form onSubmit={attemptSubmit}>
          <h3 style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem', marginBottom: '1.5rem', marginTop: '2rem' }}>Personal Information</h3>

         <div className="grid grid-cols-3 gap-4">
           {/* FIRST NAME */}
           <div className="form-group">
             <label>First Name <span style={{ color: 'red' }}>*</span></label>
             <input
               type="text"
               name="firstName"
               className="form-control"
               value={formData.firstName}
               onChange={handleNameChange}
               required
             />
           </div>

           {/* MIDDLE NAME */}
           <div className="form-group">
             <label>Middle Name</label>
             <input
               type="text"
               name="middleName"
               className="form-control"
               value={formData.middleName}
               onChange={handleNameChange}
             />
           </div>

           {/* LAST NAME */}
           <div className="form-group">
             <label>Last Name <span style={{ color: 'red' }}>*</span></label>
             <input
               type="text"
               name="lastName"
               className="form-control"
               value={formData.lastName}
               onChange={handleNameChange}
               required
             />
           </div>
         </div>

          <div className="grid grid-cols-3">
                      <div className="form-group">
                        <label>Birthdate <span style={{ color: 'var(--danger)' }}>*</span></label>
                        <div style={{ width: '100%', position: 'relative' }}>
                          <DatePicker
                            selected={formData.birthdate ? new Date(formData.birthdate) : null}
                            onChange={handleBirthdateChange}
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
                              />
                            }
                            required
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
                      <div className="form-group">
                        <label>Age (Auto-computed)</label>
                        <input type="text" className="form-control" value={calculateAge()} disabled style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: '#1e40af', fontWeight: 'bold', border: '1px solid rgba(59, 130, 246, 0.3)' }} />
                      </div>
            <div className="form-group">
              <label>Gender <span style={{ color: 'red' }}>*</span></label>
              <select className="form-control" name="gender" value={formData.gender} onChange={handleChange} required>
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2">
            <div className="form-group">
              <label>Contact Number <span style={{ color: 'red' }}>*</span></label>
              <input
                type="text" // Use "text" instead of "number" to prevent the "e" character and arrows
                name="contactNumber"
                placeholder="Ex. 09123456789"
                value={formData.contactNumber}
                onChange={handleContactChange}
                maxLength="11" // Prevents typing more than 11 characters
                className="form-control"
                required // Added this to ensure it's not empty
/>
                                    {/* Optional: Add a small hint for the user */}
                                    {formData.contactNumber && formData.contactNumber.length < 11 && (
                                      <small style={{ color: 'red' }}>Must be 11 digits</small>
                                    )}

            </div>
          </div>

          <div className="grid grid-cols-2">
            {/* REGION */}
            <div className="form-group">
              <label>Region <span style={{ color: 'red' }}>*</span></label>
              <select className="form-control" name="region" value={formData.region} onChange={handleChange} required>
                <option value="">Select Region</option>
                {regions.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            {/* PROVINCE */}
            <div className="form-group">
              <label>Province <span style={{ color: 'red' }}>*</span></label>
              <select className="form-control" name="province" value={formData.province} onChange={handleChange} required disabled={!formData.region}>
                <option value="">Select Province</option>
                {provinces.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            {/* CITY */}
            <div className="form-group">
              <label>City/Municipality <span style={{ color: 'red' }}>*</span></label>
              <select className="form-control" name="city" value={formData.city} onChange={handleChange} required disabled={!formData.province}>
                <option value="">Select City</option>
                {cities.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* BARANGAY */}
            <div className="form-group">
              <label>Barangay <span style={{ color: 'red' }}>*</span></label>
              <select className="form-control" name="barangay" value={formData.barangay} onChange={handleChange} required disabled={!formData.city}>
                <option value="">Select Barangay</option>
                {barangays.map(b => <option key={b.name} value={b.name}>{b.name}</option>)}
              </select>
            </div>

            {/* AUTOMATED ZONE (Read Only) */}
            <div className="form-group">
              <label>Zone</label>

              <input
                type="text"
                name="zone"
                className="form-control"
                value={formData.zone}
                readOnly

                style={{ backgroundColor: 'rgba(0,0,0,0.3)', color: 'var(--text-muted)' }} // Matches your Age field style
              />
            </div>

            {/* STREET ADDRESS */}
            <div className="form-group">
              <label>Street Address / House No. <span style={{ color: 'red' }}>*</span></label>
              <input
                type="text"
                className="form-control"
                name="streetAddress"
                value={formData.streetAddress}
                onChange={handleChange}
                required
                placeholder="123 Street Name"
              />
            </div>
            </div>



          <div style={{ marginTop: '3rem', display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)} style={{ padding: '0.5rem 1rem' }}>
                &larr; Back
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleClear} style={{ color: 'var(--danger)', borderColor: 'rgba(239, 68, 68, 0.3)', padding: '0.5rem 1rem' }}>
                Clear Form
              </button>
            </div>
            <button type="submit" className="btn btn-primary" style={{ padding: '1rem 3rem', fontSize: '1.125rem' }} disabled={submitting}>
              {submitting ? 'Submitting...' : 'Complete Registration'}
            </button>
          </div>
        </form>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ padding: '2rem', width: '100%', maxWidth: '400px', backgroundColor: 'var(--bg-card)', textAlign: 'center' }}>
            <h3 style={{ marginBottom: '1rem', color: 'var(--text-main)' }}>Confirm Submission</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
              Are you sure you want to complete this registration? Please ensure all details are correct to prevent human error.
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => setShowConfirm(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={confirmSubmit}>Yes, Complete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


export default PatientRegistration;
