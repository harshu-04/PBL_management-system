import { useState, useEffect } from 'react';
import Select from 'react-select';
import { useAuth } from '../context/AuthContext';
import { getProfile, updateProfile } from '../utils/api';
import DashboardLayout from '../components/DashboardLayout';
import MagneticButton from '../components/MagneticButton';

export const SKILL_OPTIONS = [
  { label: "Programming Languages", options: [{ value: "C++", label: "C++" }, { value: "Python", label: "Python" }, { value: "JavaScript", label: "JavaScript" }, { value: "TypeScript", label: "TypeScript" }, { value: "Java", label: "Java" }, { value: "C#", label: "C#" }, { value: "Go", label: "Go" }, { value: "Rust", label: "Rust" }] },
  { label: "Frontend Web Development", options: [{ value: "React.js", label: "React.js" }, { value: "Next.js", label: "Next.js" }, { value: "Vue.js", label: "Vue.js" }, { value: "Angular", label: "Angular" }, { value: "HTML/CSS", label: "HTML/CSS" }, { value: "Tailwind CSS", label: "Tailwind CSS" }, { value: "Redux", label: "Redux" }, { value: "Figma (UI/UX)", label: "Figma (UI/UX)" }] },
  { label: "Backend Web Development", options: [{ value: "Node.js", label: "Node.js" }, { value: "Express.js", label: "Express.js" }, { value: "Django", label: "Django" }, { value: "Flask", label: "Flask" }, { value: "Spring Boot", label: "Spring Boot" }, { value: "REST APIs", label: "REST APIs" }, { value: "GraphQL", label: "GraphQL" }] },
  { label: "Databases & Storage", options: [{ value: "MongoDB", label: "MongoDB" }, { value: "PostgreSQL", label: "PostgreSQL" }, { value: "MySQL", label: "MySQL" }, { value: "Redis", label: "Redis" }, { value: "Firebase", label: "Firebase" }, { value: "Supabase", label: "Supabase" }, { value: "DBMS", label: "DBMS Architecture" }] },
  { label: "DevOps & Cloud", options: [{ value: "Git/GitHub", label: "Git/GitHub" }, { value: "Docker", label: "Docker" }, { value: "Kubernetes", label: "Kubernetes" }, { value: "AWS", label: "AWS" }, { value: "Google Cloud (GCP)", label: "Google Cloud (GCP)" }, { value: "Azure", label: "Azure" }, { value: "CI/CD Pipelines", label: "CI/CD Pipelines" }, { value: "Linux/Bash", label: "Linux/Bash" }] },
  { label: "Machine Learning & AI", options: [{ value: "Machine Learning", label: "Machine Learning" }, { value: "Deep Learning", label: "Deep Learning" }, { value: "TensorFlow", label: "TensorFlow" }, { value: "PyTorch", label: "PyTorch" }, { value: "Scikit-Learn", label: "Scikit-Learn" }, { value: "Computer Vision (OpenCV)", label: "Computer Vision (OpenCV)" }, { value: "NLP", label: "Natural Language Processing" }] },
  { label: "Core CS & Specializations", options: [{ value: "Data Structures & Algorithms", label: "Data Structures & Algorithms" }, { value: "Object-Oriented Programming", label: "Object-Oriented Programming" }, { value: "Computer Networks", label: "Computer Networks" }, { value: "Cybersecurity", label: "Cybersecurity" }, { value: "Blockchain / Web3", label: "Blockchain / Web3" }, { value: "Internet of Things (IoT)", label: "Internet of Things (IoT)" }, { value: "App Development", label: "App Development" }] }
];

export default function Profile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });
  
  const [formData, setFormData] = useState({
    skills: [],
    github: '',
    linkedin: '',
    universityRollNo: '',
    studentId: '',
    semester: '',
    section: '',
    specialization: '',
    employeeId: '',
    department: '',
    expertise: [],
    experienceYears: '',
    availability: true
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getProfile();
        const data = res.data;
        setFormData({
          skills: data.skills || [],
          github: data.github || '',
          linkedin: data.linkedin || '',
          universityRollNo: data.universityRollNo || '',
          studentId: data.studentId || '',
          semester: data.semester || '',
          section: data.section || '',
          specialization: data.specialization || '',
          employeeId: data.employeeId || '',
          department: data.department || '',
          expertise: data.expertise || [],
          experienceYears: data.experienceYears !== undefined && data.experienceYears !== null ? data.experienceYears : '',
          availability: data.availability !== undefined ? data.availability : true
        });
      } catch (err) {
        setMsg({ text: 'Failed to load profile', type: 'error' });
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSkillsChange = (selectedOptions) => {
    setFormData(prev => ({
      ...prev,
      skills: selectedOptions ? selectedOptions.map(opt => opt.value) : []
    }));
  };

  const handleExpertiseChange = (selectedOptions) => {
    setFormData(prev => ({
      ...prev,
      expertise: selectedOptions ? selectedOptions.map(opt => opt.value) : []
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg({ text: '', type: '' });
    try {
      // Build payload based on role
      const payload = {
        skills: formData.skills,
        github: formData.github,
        linkedin: formData.linkedin,
      };

      if (user?.role === 'Student') {
        payload.universityRollNo = formData.universityRollNo;
        payload.studentId = formData.studentId;
        payload.semester = formData.semester ? Number(formData.semester) : undefined;
        payload.section = formData.section;
        payload.specialization = formData.specialization;
      } else if (user?.role === 'Mentor') {
        payload.employeeId = formData.employeeId;
        payload.department = formData.department;
        payload.expertise = formData.expertise;
        payload.experienceYears = formData.experienceYears !== '' ? Number(formData.experienceYears) : undefined;
        payload.availability = formData.availability;
      }

      await updateProfile(payload);
      setMsg({ text: 'Profile updated successfully!', type: 'success' });
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Error updating profile', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  // Check if profile is incomplete
  const isProfileIncomplete = () => {
    if (user?.role === 'Student') {
      return !formData.semester || !formData.universityRollNo || formData.skills.length === 0;
    }
    if (user?.role === 'Mentor') {
      return formData.experienceYears === '' || formData.expertise.length === 0;
    }
    return false; // admins or unknown default to false
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center p-12">
           <svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      </DashboardLayout>
    );
  }

  // Define react-select mapped values
  const getMappedOptions = (selectedValues) => {
    let result = [];
    SKILL_OPTIONS.forEach(group => {
      group.options.forEach(opt => {
        if (selectedValues.includes(opt.value)) {
          result.push(opt);
        }
      });
    });
    return result;
  };

  const selectStyles = {
    control: (base) => ({ ...base, backgroundColor: 'rgba(22, 27, 34, 0.5)', borderColor: 'rgba(255, 255, 255, 0.2)', color: '#e2e8f0' }),
    menu: (base) => ({ ...base, backgroundColor: '#161b22' }),
    option: (base, state) => ({ ...base, backgroundColor: state.isFocused ? 'rgba(59, 130, 246, 0.5)' : '#161b22', color: '#e2e8f0' }),
    singleValue: (base) => ({ ...base, color: '#e2e8f0' }),
    multiValue: (base) => ({ ...base, backgroundColor: 'rgba(59, 130, 246, 0.2)' }),
    multiValueLabel: (base) => ({ ...base, color: '#e2e8f0' }),
    input: (base) => ({ ...base, color: '#e2e8f0' }),
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-200">My Profile</h1>
          <p className="text-slate-500 mt-1">Manage your personal information and {user?.role === 'Mentor' ? 'expertise' : 'skills'}.</p>
        </div>

        {isProfileIncomplete() && (
          <div className="mb-6 p-4 rounded-xl bg-orange-50 border border-orange-200 flex items-start gap-3">
            <span className="text-orange-500 text-xl">⚠️</span>
            <div>
              <h3 className="font-semibold text-orange-800">Incomplete Profile</h3>
              <p className="text-sm text-orange-600 mt-1">Please complete your profile. This helps us match you with the right projects or mentors.</p>
            </div>
          </div>
        )}

        {msg.text && (
          <div className={`mb-6 p-4 rounded-xl text-sm font-medium border ${
            msg.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
            : 'bg-red-50 border-red-200 text-red-700'
          }`}>
            {msg.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="glass-panel rounded-2xl shadow-sm border border-white/10 overflow-hidden">
          
          {/* Shared Information */}
          <div className="p-6 border-b border-white/10">
            <h2 className="text-lg font-semibold text-slate-200 mb-4">Basic Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Name</label>
                <input type="text" value={user?.name || ''} disabled 
                  className="w-full px-4 py-2.5 bg-[#161b22]/50 border border-white/20 rounded-xl text-sm text-slate-500 cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                <input type="text" value={user?.email || ''} disabled 
                  className="w-full px-4 py-2.5 bg-[#161b22]/50 border border-white/20 rounded-xl text-sm text-slate-500 cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">GitHub Profile</label>
                <input type="url" name="github" value={formData.github} onChange={handleChange} placeholder="https://github.com/..."
                  className="w-full px-4 py-2.5 glass-panel border border-white/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-200" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">LinkedIn Profile</label>
                <input type="url" name="linkedin" value={formData.linkedin} onChange={handleChange} placeholder="https://linkedin.com/in/..."
                  className="w-full px-4 py-2.5 glass-panel border border-white/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-200" />
              </div>
            </div>
          </div>

          {/* Student Specific Information */}
          {user?.role === 'Student' && (
            <div className="p-6 border-b border-white/10 bg-[#161b22]/50/50">
              <h2 className="text-lg font-semibold text-slate-200 mb-4">Academic Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">University Roll No *</label>
                  <input type="text" name="universityRollNo" value={formData.universityRollNo} onChange={handleChange} required
                    className="w-full px-4 py-2.5 glass-panel border border-white/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-200" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Student ID</label>
                  <input type="text" name="studentId" value={formData.studentId} onChange={handleChange} 
                    className="w-full px-4 py-2.5 glass-panel border border-white/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-200" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Semester *</label>
                  <input type="number" name="semester" min="1" max="10" value={formData.semester} onChange={handleChange} required
                    className="w-full px-4 py-2.5 glass-panel border border-white/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-200" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Section</label>
                  <input type="text" name="section" value={formData.section} onChange={handleChange} 
                    className="w-full px-4 py-2.5 glass-panel border border-white/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-200" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-300 mb-1">Specialization</label>
                  <input type="text" name="specialization" value={formData.specialization} onChange={handleChange} placeholder="e.g. Artificial Intelligence, Web Dev..."
                    className="w-full px-4 py-2.5 glass-panel border border-white/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-200" />
                </div>
              </div>

              <h2 className="text-lg font-semibold text-slate-200 mb-4 mt-6">Technical Skills *</h2>
              <div className="mb-2">
                <Select
                  isMulti
                  options={SKILL_OPTIONS}
                  value={getMappedOptions(formData.skills)}
                  onChange={handleSkillsChange}
                  className="text-sm"
                  styles={selectStyles}
                  placeholder="Select your skills..."
                  theme={(theme) => ({
                    ...theme,
                    colors: {
                      ...theme.colors,
                      primary: '#3b82f6',
                    },
                  })}
                />
              </div>
            </div>
          )}

          {/* Mentor Specific Information */}
          {user?.role === 'Mentor' && (
            <div className="p-6 border-b border-white/10 bg-[#161b22]/50/50">
              <h2 className="text-lg font-semibold text-slate-200 mb-4">Professional Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Employee ID</label>
                  <input type="text" name="employeeId" value={formData.employeeId} onChange={handleChange} 
                    className="w-full px-4 py-2.5 glass-panel border border-white/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-200" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Department</label>
                  <input type="text" name="department" value={formData.department} onChange={handleChange} 
                    className="w-full px-4 py-2.5 glass-panel border border-white/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-200" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Experience (Years) *</label>
                  <input type="number" name="experienceYears" min="0" value={formData.experienceYears} onChange={handleChange} required
                    className="w-full px-4 py-2.5 glass-panel border border-white/20 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-200" />
                </div>
                <div className="flex items-center mt-7">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" name="availability" checked={formData.availability} onChange={handleChange} className="bg-[#161b22]/50 sr-only peer text-slate-200" />
                    <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:glass-panel after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                    <span className="ml-3 text-sm font-medium text-slate-300">Available for mentoring</span>
                  </label>
                </div>
              </div>

              <h2 className="text-lg font-semibold text-slate-200 mb-4 mt-6">Areas of Expertise *</h2>
              <div className="mb-2">
                <Select
                  isMulti
                  options={SKILL_OPTIONS}
                  value={getMappedOptions(formData.expertise)}
                  onChange={handleExpertiseChange}
                  className="text-sm"
                  styles={selectStyles}
                  placeholder="Select your areas of expertise..."
                  required={formData.expertise.length === 0}
                  theme={(theme) => ({
                    ...theme,
                    colors: {
                      ...theme.colors,
                      primary: '#3b82f6',
                    },
                  })}
                />
                 {formData.expertise.length === 0 && <p className="text-xs text-red-500 mt-2">Please select at least one area of expertise.</p>}
              </div>

            </div>
          )}

          <div className="p-6 bg-[#161b22]/50 flex justify-end">
            <MagneticButton 
              type="submit" 
              disabled={submitting || (user?.role === 'Mentor' && formData.expertise.length === 0)}
              className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Profile'}
            </MagneticButton>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
