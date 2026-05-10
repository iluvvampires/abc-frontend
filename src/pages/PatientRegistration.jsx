import Swal from 'sweetalert2';
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
    contactNumber: '', province: '', city: '', barangay: '', streetAddress: '',
    exposureDate: '', placeOfExposure: '', exposureType: '', animalType: '',
    otherAnimalSpecify: '', animalConditions: []
  };

  const [formData, setFormData] = useState(initialFormState);

  // Mapping of Luzon Provinces to their Cities/Municipalities
    const provinceCities = {
      "Abra": ["Bangued", "Boliney", "Bucay", "Bucloc", "Daguioman", "Danglas", "Dolores", "La Paz", "Lacub", "Lagangilang", "Lagayan", "Langiden", "Licuan-Baay", "Luba", "Malibcong", "Manabo", "Peñarrubia", "Pidigan", "Pilar", "Sallapadan", "San Isidro", "San Juan", "San Quintin", "Tayum", "Tineg", "Tubo", "Villaviciosa"],
      "Albay": ["Bacacay", "Camalig", "Daraga", "Guinobatan", "Jovellar", "Legazpi City", "Libon", "Ligao City", "Malilipot", "Malinao", "Manito", "Oas", "Pio Duran", "Polangui", "Rapu-Rapu", "Santo Domingo", "Tabaco City", "Tiwi"],
      "Apayao": ["Calanasan", "Conner", "Flora", "Kabugao", "Luna", "Pudtol", "Santa Marcela"],
      "Aurora": ["Baler", "Casiguran", "Dilasag", "Dinalungan", "Dingalan", "Dipaculao", "Maria Aurora", "San Luis"],
      "Bataan": ["Abucay", "Bagac", "Balanga City", "Dinalupihan", "Hermosa", "Limay", "Mariveles", "Morong", "Orani", "Orion", "Pilar", "Samal"],
      "Batanes": ["Basco", "Itbayat", "Ivana", "Mahatao", "Sabtang", "Uyugan"],
      "Batangas": ["Agoncillo", "Alitagtag", "Balayan", "Balete", "Batangas City", "Bauan", "Calaca", "Calatagan", "Cuenca", "Ibaan", "Laurel", "Lemery", "Lian", "Lipa City", "Lobo", "Mabini", "Malvar", "Mataasnakahoy", "Nasugbu", "Padre Garcia", "Rosario", "San Jose", "San Juan", "San Luis", "San Nicolas", "San Pascual", "Santa Teresita", "Santo Tomas City", "Taal", "Talisay", "Tanauan City", "Taysan", "Tingloy", "Tuy"],
      "Benguet": ["Atok", "Baguio City", "Bakun", "Bokod", "Buguias", "Itogon", "Kabayan", "Kapangan", "Kibungan", "La Trinidad", "Mankayan", "Sablan", "Tuba", "Tublay"],
      "Bulacan": ["Angat", "Balagtas", "Baliuag", "Bocaue", "Bulakan", "Bustos", "Calumpit", "Doña Remedios Trinidad", "Guiguinto", "Hagonoy", "Malolos City", "Marilao", "Meycauayan City", "Norzagaray", "Obando", "Pandi", "Paombong", "Plaridel", "Pulilan", "San Ildefonso", "San Jose del Monte City", "San Miguel", "San Rafael", "Santa Maria"],
      "Cagayan": ["Abulug", "Alcala", "Allacapan", "Amulung", "Aparri", "Baggao", "Ballesteros", "Buguey", "Calayan", "Camalaniugan", "Claveria", "Enrile", "Gattaran", "Gonzaga", "Iguig", "Lal-lo", "Lasam", "Pamplona", "Peñablanca", "Piat", "Rizal", "Sanchez-Mira", "Santa Ana", "Santa Praxedes", "Santa Teresita", "Santo Niño", "Solana", "Tuao", "Tuguegarao City"],
      "Camarines Norte": ["Basud", "Capalonga", "Daet", "Jose Panganiban", "Labo", "Mercedes", "Paracale", "San Lorenzo Ruiz", "San Vicente", "Santa Elena", "Talisay", "Vinzons"],
      "Camarines Sur": ["Baao", "Balatan", "Bato", "Bombon", "Buhi", "Bula", "Cabusao", "Calabanga", "Camaligan", "Canaman", "Caramoan", "Del Gallego", "Gainza", "Garchitorena", "Goa", "Iriga City", "Lagonoy", "Libmanan", "Lupi", "Magarao", "Milaor", "Minalabac", "Nabua", "Naga City", "Ocampo", "Pamplona", "Pasacao", "Pili", "Presentacion", "Ragay", "Sagñay", "San Fernando", "San Jose", "Sipocot", "Siruma", "Tigaon", "Tinambac"],
      "Catanduanes": ["Bagamanoc", "Baras", "Bato", "Caramoran", "Gigmoto", "Pandan", "Panganiban", "San Andres", "San Miguel", "Viga", "Virac"],
      "Cavite": ["Alfonso", "Amadeo", "Bacoor City", "Carmona", "Cavite City", "Dasmariñas City", "General Emilio Aguinaldo", "General Mariano Alvarez", "General Trias City", "Imus City", "Indang", "Kawit", "Magallanes", "Maragondon", "Mendez", "Naic", "Noveleta", "Rosario", "Silang", "Tagaytay City", "Tanza", "Ternate", "Trece Martires City"],
      "Ifugao": ["Aguinaldo", "Alfonso Lista", "Asipulo", "Banaue", "Hingyon", "Hungduan", "Kiangan", "Lagawe", "Lamut", "Mayoyao", "Tinoc"],
      "Ilocos Norte": ["Adams", "Bacarra", "Badoc", "Bangui", "Banna", "Batac City", "Burgos", "Carasi", "Currimao", "Dingras", "Dumalneg", "Laoag City", "Marcos", "Nueva Era", "Pagudpud", "Paoay", "Pasuquin", "Piddig", "Pinili", "San Nicolas", "Sarrat", "Solsona", "Vintar"],
      "Ilocos Sur": ["Alilem", "Banayoyo", "Bantay", "Burgos", "Cabugao", "Candon City", "Caoayan", "Cervantes", "Galimuyod", "Gregorio del Pilar", "Lidlidda", "Magsingal", "Nagbukel", "Narvacan", "Quirino", "Salcedo", "San Emilio", "San Esteban", "San Ildefonso", "San Juan", "San Vicente", "Santa", "Santa Catalina", "Santa Cruz", "Santa Lucia", "Santa Maria", "Santiago", "Santo Domingo", "Sigay", "Sinait", "Sugpon", "Suyo", "Tagudin", "Vigan City"],
      "Isabela": ["Alicia", "Angadanan", "Aurora", "Benito Soliven", "Burgos", "Cabagan", "Cabatuan", "Cauayan City", "Cordon", "Delfin Albano", "Dinapigue", "Divilacan", "Echague", "Gamu", "Ilagan City", "Jones", "Luna", "Maconacon", "Mallig", "Naguilian", "Palanan", "Quezon", "Quirino", "Ramon", "Reina Mercedes", "Roxas", "San Agustin", "San Guillermo", "San Isidro", "San Manuel", "San Mariano", "San Mateo", "San Pablo", "Santa Maria", "Santiago City", "Santo Tomas", "Tumauini"],
      "Kalinga": ["Balbalan", "Lubuagan", "Pasil", "Pinukpuk", "Rizal", "Tabuk City", "Tanudan", "Tinglayan"],
      "La Union": ["Agoo", "Aringay", "Bacnotan", "Bagulin", "Balaoan", "Bangar", "Bauang", "Burgos", "Caba", "Luna", "Naguilian", "Pugo", "Rosario", "San Fernando City", "San Gabriel", "San Juan", "Santo Tomas", "Santol", "Sudipen", "Tubao"],
      "Laguna": ["Alaminos", "Bay", "Biñan City", "Cabuyao City", "Calamba City", "Calauan", "Cavinti", "Famy", "Kalayaan", "Liliw", "Los Baños", "Luisiana", "Lumban", "Mabitac", "Magdalena", "Majayjay", "Nagcarlan", "Paete", "Pagsanjan", "Pakil", "Pangil", "Pila", "Rizal", "San Pablo City", "San Pedro City", "Santa Cruz", "Santa Maria", "Santa Rosa City", "Siniloan", "Victoria"],
      "Marinduque": ["Boac", "Buenavista", "Gasan", "Mogpog", "Santa Cruz", "Torrijos"],
      "Masbate": ["Aroroy", "Baleno", "Balud", "Batuan", "Cataingan", "Cawayan", "Claveria", "Dimasalang", "Esperanza", "Mandaon", "Masbate City", "Milagros", "Mobo", "Monreal", "Palanas", "Pio V. Corpuz", "Placer", "San Fernando", "San Jacinto", "San Pascual", "Uson"],
      "Mountain Province": ["Barlig", "Bauko", "Besao", "Bontoc", "Natonin", "Paracelis", "Sabangan", "Sadanga", "Sagada", "Tadian"],
      "Nueva Ecija": ["Aliaga", "Bongabon", "Cabanatuan City", "Cabiao", "Carranglan", "Cuyapo", "Gabaldon", "Gapan City", "General Mamerto Natividad", "General Tinio", "Guimba", "Jaen", "Laur", "Licab", "Llanera", "Lupao", "Muñoz City", "Nampicuan", "Palayan City", "Pantabangan", "Peñaranda", "Quezon", "Rizal", "San Antonio", "San Isidro", "San Jose City", "San Leonardo", "Santa Rosa", "Santo Domingo", "Talavera", "Talugtug", "Zaragoza"],
      "Nueva Vizcaya": ["Alfonso Castañeda", "Ambaguio", "Aritao", "Bagabag", "Bambang", "Bayombong", "Diadi", "Dupax del Norte", "Dupax del Sur", "Kasibu", "Kayapa", "Quezon", "Santa Fe", "Solano", "Villaverde"],
      "Occidental Mindoro": ["Abra de Ilog", "Calintaan", "Looc", "Lubang", "Magsaysay", "Mamburao", "Paluan", "Rizal", "Sablayan", "San Jose", "Santa Cruz"],
      "Oriental Mindoro": ["Baco", "Bansud", "Bongabong", "Bulalacao", "Calapan City", "Gloria", "Mansalay", "Naujan", "Pinamalayan", "Pola", "Puerto Galera", "Roxas", "San Teodoro", "Socorro", "Victoria"],
      "Palawan": ["Aborlan", "Agutaya", "Araceli", "Balabac", "Bataraza", "Brooke's Point", "Busuanga", "Cagayancillo", "Coron", "Culion", "Cuyo", "Dumaran", "El Nido", "Kalayaan", "Linapacan", "Magsaysay", "Narra", "Puerto Princesa City", "Quezon", "Rizal", "Roxas", "San Vicente", "Sofronio Española", "Taytay"],
      "Pampanga": ["Apalit", "Arayat", "Bacolor", "Candaba", "Floridablanca", "Guagua", "Lubao", "Mabalacat City", "Macabebe", "Magalang", "Masantol", "Mexico", "Minalin", "Porac", "San Fernando City", "San Luis", "San Simon", "Santa Ana", "Santa Rita", "Santo Tomas", "Sasmuan"],
      "Pangasinan": ["Agno", "Aguilar", "Alaminos City", "Alcala", "Anda", "Asingan", "Balungao", "Bani", "Basista", "Bautista", "Bayambang", "Binalonan", "Binmaley", "Bolinao", "Bugallon", "Burgos", "Calasiao", "Dagupan City", "Dasol", "Infanta", "Labrador", "Laoac", "Lingayen", "Mabini", "Malasiqui", "Manaoag", "Mangaldan", "Mangatarem", "Mapandan", "Natividad", "Pozorrubio", "Rosales", "San Carlos City", "San Fabian", "San Jacinto", "San Manuel", "San Nicolas", "San Quintin", "Santa Barbara", "Santa Maria", "Santo Tomas", "Sison", "Sual", "Tayug", "Umingan", "Urbiztondo", "Urdaneta City", "Villasis"],
      "Quezon": ["Agdangan", "Alabat", "Atimonan", "Buenavista", "Burdeos", "Calauag", "Candelaria", "Catanauan", "Dolores", "General Luna", "General Nakar", "Guinyangan", "Gumaca", "Infanta", "Jomalig", "Lopez", "Lucban", "Lucena City", "Macalelon", "Mauban", "Mulanay", "Padre Burgos", "Pagbilao", "Panukulan", "Patnanungan", "Perez", "Pitogo", "Plaridel", "Polillo", "Quezon", "Real", "Sampaloc", "San Andres", "San Antonio", "San Francisco", "San Narciso", "Sariaya", "Tagkawayan", "Tayabas City", "Tiaong", "Unisan"],
      "Quirino": ["Aglipay", "Cabarroguis", "Diffun", "Maddela", "Nagtipunan", "Saguday"],
      "Rizal": ["Angono", "Antipolo City", "Baras", "Binangonan", "Cainta", "Cardona", "Jalajala", "Morong", "Pililla", "Rodriguez", "San Mateo", "Tanay", "Taytay", "Teresa"],
      "Romblon": ["Alcantara", "Banton", "Cajidiocan", "Calatrava", "Concepcion", "Corcuera", "Ferrol", "Looc", "Magdiwang", "Odiongan", "Romblon", "San Agustin", "San Andres", "San Fernando", "San Jose", "Santa Fe"],
      "Sorsogon": ["Barcelona", "Bulan", "Bulusan", "Casiguran", "Castilla", "Donsol", "Gubat", "Irosin", "Juban", "Magallanes", "Matnog", "Pilar", "Prieto Diaz", "Santa Magdalena", "Sorsogon City"],
      "Tarlac": ["Anao", "Bamban", "Camiling", "Capas", "Concepcion", "Gerona", "La Paz", "Mayantoc", "Moncada", "Paniqui", "Pura", "Ramos", "San Clemente", "San Jose", "San Manuel", "Santa Ignacia", "Tarlac City", "Victoria"],
      "Zambales": ["Botolan", "Cabangan", "Candelaria", "Castillejos", "Iba", "Masinloc", "Olongapo City", "Palauig", "San Antonio", "San Felipe", "San Marcelino", "San Narciso", "Santa Cruz", "Subic"]
    };

    const luzonProvinces = Object.keys(provinceCities).sort();

    // Get cities dynamically based on selected province
    const availableCities = formData.province ? provinceCities[formData.province] : [];

    // Mapping of Cities to their Barangays (Example: Batangas cities)
    const cityBarangays = {
      "Lipa City": [
        "Adya", "Anilao", "Antipolo del Norte", "Antipolo del Sur", "Bagong Pook", "Balintawak", "Banaybanay",
        "Bolbok", "Bugtong na Pulo", "Bulacnin", "Bulihan", "Calamias", "Cumba", "Dagatan", "Duhatan", "Halang",
        "Inosluban", "Kayumanggi", "Latag", "Lodlod", "Lumbang", "Mabini", "Malagonlong", "Malitlit", "Marauoy",
        "Mataas na Lupa", "Munting Pulo", "Pagolingin Bata", "Pagolingin East", "Pagolingin West", "Pangao",
        "Pinagkawitan", "Pinagtongulan", "Plaridel", "Quezon", "Rizal", "Sabang", "Sampaguita", "San Benito",
        "San Carlos", "San Celestino", "San Francisco", "San Guillermo", "San Isidro", "San Jose", "San Lucas",
        "San Salvador", "San Sebastian", "Sapac", "Sico", "Talisay", "Tambo", "Tangob", "Tanguay", "Tibig",
        "Tipacan", "Poblacion Barangay 1", "Poblacion Barangay 2", "Poblacion Barangay 3", "Poblacion Barangay 4",
        "Poblacion Barangay 5", "Poblacion Barangay 6", "Poblacion Barangay 7", "Poblacion Barangay 8",
        "Poblacion Barangay 9", "Poblacion Barangay 9-A", "Poblacion Barangay 10", "Poblacion Barangay 11",
        "Poblacion Barangay 12"
      ],
      "Batangas City": [
        "Alangilan", "Balagtas", "Balete", "Banaba Center", "Banaba East", "Banaba South", "Banaba West",
        "Banalo", "Bolbok", "Calicanto", "Cuta", "Dumantay", "Gulod Itaas", "Gulod Labac", "Ilijan",
        "Kumintang Ibaba", "Kumintang Ilaya", "Libjo", "Malitam", "Pallocan Kanluran", "Pallocan Silangan",
        "San Isidro", "Santa Clara", "Santa Rita Aplaya", "Santa Rita Karsada", "Wawa"
        // Added a substantial sample, but a text input fallback will handle unlisted ones
      ]
    };

    const availableBarangays = formData.city && cityBarangays[formData.city] ? cityBarangays[formData.city] : null;

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
    // 2. Handle Barangay
    else if (name === "barangay") {
        setFormData({
            ...formData,
            barangay: value
        });
    }
    // 3. Handle Cascading Resets
    else if (name === "province") {
        setFormData({ ...formData, province: value, city: "", barangay: "" });
    }
    else if (name === "city") {
        setFormData({ ...formData, city: value, barangay: "" });
    }
    // 4. Default for all other inputs
    else {
        setFormData({ ...formData, [name]: value });
    }
};


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
           </div> {/* Closes the first name/middle name/last name grid */}

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
                         <label>Gender <span style={{ color: 'var(--danger)' }}>*</span></label>
                         <select className="form-control" name="gender" value={formData.gender} onChange={handleChange} required>
                           <option value="">Select Gender</option>
                           <option value="Male">Male</option>
                           <option value="Female">Female</option>
                         </select>
                       </div>
                     </div>

           {/* Contact Number - Single, not duplicate */}
           <div className="grid grid-cols-2">
             <div className="form-group">
               <label>Contact Number <span style={{ color: 'red' }}>*</span></label>
               <input
                 type="text"
                 name="contactNumber"
                 placeholder="Ex. 09123456789"
                 value={formData.contactNumber}
                 onChange={handleContactChange}
                 maxLength="11"
                 className="form-control"
                 required
               />
               {formData.contactNumber && formData.contactNumber.length < 11 && (
                 <small style={{ color: 'red' }}>Must be 11 digits</small>
               )}
             </div>
           </div>



            <div className="grid grid-cols-2">
                        <div className="form-group">
                          <label>Province <span style={{ color: 'var(--danger)' }}>*</span></label>
                          <select className="form-control" name="province" value={formData.province} onChange={handleChange} required>
                            <option value="">Select Province</option>
                            {luzonProvinces.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </div>
                        <div className="form-group">
                          <label>City / Municipality <span style={{ color: 'var(--danger)' }}>*</span></label>
                          <select className="form-control" name="city" value={formData.city} onChange={handleChange} required disabled={!formData.province}>
                            <option value="">{formData.province ? "Select City / Municipality" : "Select Province First"}</option>
                            {availableCities.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2">
                        <div className="form-group">
                          <label>Barangay <span style={{ color: 'var(--danger)' }}>*</span></label>
                          {availableBarangays ? (
                            <select className="form-control" name="barangay" value={formData.barangay} onChange={handleChange} required disabled={!formData.city}>
                              <option value="">Select Barangay</option>
                              {availableBarangays.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                          ) : (
                            <input type="text" className="form-control" name="barangay" value={formData.barangay} onChange={handleChange} required placeholder={formData.city ? "Ex: Brgy. San Isidro" : "Select City First"} disabled={!formData.city} />
                          )}
                        </div>
                        <div className="form-group">
                          <label>Street Address / House No. <span style={{ color: 'var(--danger)' }}>*</span></label>
                          <input
                            type="text"
                            className="form-control"
                            name="streetAddress"
                            value={formData.streetAddress}
                            onChange={handleChange}
                            required
                            placeholder={formData.barangay ? "Ex: 123 Main St. / Blk 1 Lot 2" : "Select Barangay First"}
                            disabled={!formData.province || !formData.city || !formData.barangay}
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
