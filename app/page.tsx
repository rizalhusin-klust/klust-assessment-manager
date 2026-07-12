'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  BookOpen, 
  ArrowRight, 
  Layers, 
  TrendingUp, 
  Award,
  FileSpreadsheet,
  CheckCircle2,
  ChevronRight,
  Users,
  FolderOpen,
  FileCheck,
  ShieldCheck,
  Zap,
  Plus,
  Calendar,
  X,
  UserCheck
} from 'lucide-react';

interface Course {
  id: string;
  code: string;
  name: string;
  semester: string;
  coordinator: string;
  studentsCount: number;
  lastUpdate: string;
}

const DEFAULT_COURSES: Course[] = [
  {
    id: 'CS302_SEM1_2026',
    code: 'CS302',
    name: 'Advanced Software Engineering',
    semester: 'Semester 1 - 2026/2027',
    coordinator: 'Dr. Rizal Husin',
    studentsCount: 10,
    lastUpdate: '2026-07-12',
  },
  {
    id: 'CS101_SEM2_2026',
    code: 'CS101',
    name: 'Introduction to Programming',
    semester: 'Semester 2 - 2026/2027',
    coordinator: 'Dr. Rizal Husin',
    studentsCount: 10,
    lastUpdate: '2026-07-12',
  }
];

export default function Home() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form states for new course
  const [newCode, setNewCode] = useState('');
  const [newName, setNewName] = useState('');
  const [newSemester, setNewSemester] = useState('Semester 1 - 2026/2027');
  const [newCoordinator, setNewCoordinator] = useState('Dr. Rizal Husin');
  const [newStudentsCount, setNewStudentsCount] = useState(10);

  // Lecturer profile state
  const [lecturerName, setLecturerName] = useState('Dr. Rizal Husin');
  const [lecturerStaffNo, setLecturerStaffNo] = useState('STF90811');
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // Duplication Modal states
  const [duplicateTarget, setDuplicateTarget] = useState<Course | null>(null);
  const [dupCode, setDupCode] = useState('');
  const [dupName, setDupName] = useState('');
  const [dupSemester, setDupSemester] = useState('Semester 1 - 2026/2027');
  const [dupClassSize, setDupClassSize] = useState(10);

  // Load courses on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('course_architect_courses');
      if (stored) {
        try {
          setCourses(JSON.parse(stored));
        } catch (e) {
          setCourses(DEFAULT_COURSES);
        }
      } else {
        localStorage.setItem('course_architect_courses', JSON.stringify(DEFAULT_COURSES));
        setCourses(DEFAULT_COURSES);
      }
      // Load lecturer profile
      const storedName = localStorage.getItem('lecturer_profile_name');
      const storedStaff = localStorage.getItem('lecturer_profile_staff_no');
      if (storedName) setLecturerName(storedName);
      if (storedStaff) setLecturerStaffNo(storedStaff);

      setIsLoading(false);
    }
  }, []);

  const handleAddCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCode.trim() || !newName.trim() || !newSemester.trim()) {
      alert('Please fill in all required fields.');
      return;
    }

    const newId = `${newCode.trim().toUpperCase()}_${newSemester.replace(/\s+/g, '_').toUpperCase()}`;
    
    // Check if course already exists
    if (courses.some(c => c.id === newId)) {
      alert('A course with this code for this semester already exists.');
      return;
    }

    const newCourse: Course = {
      id: newId,
      code: newCode.toUpperCase(),
      name: newName,
      semester: newSemester,
      coordinator: newCoordinator || 'Dr. Rizal Husin',
      studentsCount: Number(newStudentsCount) || 10,
      lastUpdate: new Date().toISOString().split('T')[0],
    };

    const updated = [newCourse, ...courses];
    setCourses(updated);
    localStorage.setItem('course_architect_courses', JSON.stringify(updated));

    // Reset Form & Close Modal
    setNewCode('');
    setNewName('');
    setIsModalOpen(false);
  };

  const handleDeleteCourse = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this course profile? This will clear its design files locally.')) {
      const updated = courses.filter(c => c.id !== id);
      setCourses(updated);
      localStorage.setItem('course_architect_courses', JSON.stringify(updated));

      // Clean up course specific states
      localStorage.removeItem(`course_state_${id}`);
    }
  };
  const handleInitiateDuplicate = (course: Course, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDuplicateTarget(course);
    setDupCode(`${course.code}-COPY`);
    setDupName(`${course.name} (Copy)`);
    setDupSemester(course.semester);
    setDupClassSize(course.studentsCount);
  };

  const handleConfirmDuplicate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!duplicateTarget) return;

    if (!dupCode.trim() || !dupName.trim() || !dupSemester.trim()) {
      alert('Please fill in all required fields.');
      return;
    }

    const newId = `${dupCode.trim().toUpperCase()}_${dupSemester.replace(/\s+/g, '_').toUpperCase()}`;
    
    // Check if course already exists
    if (courses.some(c => c.id === newId)) {
      alert('A course with this code for this semester already exists.');
      return;
    }

    // 1. Create new Course Card profile record
    const duplicatedCourse: Course = {
      id: newId,
      code: dupCode.toUpperCase(),
      name: dupName,
      semester: dupSemester,
      coordinator: duplicateTarget.coordinator,
      studentsCount: Number(dupClassSize) || 10,
      lastUpdate: new Date().toISOString().split('T')[0],
    };

    // 2. Duplicate course coursework state from local storage
    const originalStateStored = localStorage.getItem(`course_state_${duplicateTarget.id}`);
    if (originalStateStored) {
      try {
        const state = JSON.parse(originalStateStored);
        
        // Duplicate state fields EXCEPT the roster, grades, simulation, and provisioning states
        const newState = {
          ...state,
          // Roster is reset to new class size students list
          students: Array.from({ length: duplicatedCourse.studentsCount }, (_, i) => {
            const idNum = 101 + i;
            return {
              id: `S${idNum}`,
              name: `Student Name ${idNum}`,
              email: `student${idNum}@klust.edu.my`,
              status: 'Pending',
              grades: {}
            };
          }),
          // Grades are cleared
          markerGrades: {},
          // Sync & Simulation status are reset
          submissionsSimulated: false,
          provisionState: {
            provisioned: false,
            folderLinks: {},
            isLoading: false
          }
        };

        localStorage.setItem(`course_state_${newId}`, JSON.stringify(newState));
      } catch (err) {
        console.error("Error duplicating state:", err);
      }
    }

    const updated = [duplicatedCourse, ...courses];
    setCourses(updated);
    localStorage.setItem('course_architect_courses', JSON.stringify(updated));

    // Reset and Close
    setDuplicateTarget(null);
  };

  const stages = [
    {
      id: 'design',
      num: 1,
      title: 'Coursework Design',
      desc: 'Set weightages (validation to 100%) and map CLOs to PLOs.',
      icon: Layers,
    },
    {
      id: 'rubrics',
      num: 2,
      title: 'Scoring Rubrics',
      desc: 'Create detailed criteria matrices for each assessment.',
      icon: FileSpreadsheet,
    },
    {
      id: 'distribution',
      num: 3,
      title: 'Assignment Distribution',
      desc: 'Setup Google Drive folders and mock student submission sync.',
      icon: FolderOpen,
    },
    {
      id: 'grading',
      num: 4,
      title: 'Grading Workspace',
      desc: 'Interactive rubric scoring. Sync grades directly to Sheets.',
      icon: FileCheck,
    },
    {
      id: 'sampling',
      num: 5,
      title: 'Quality Sampling',
      desc: 'Export Moderator Packs (Top/Mid/Bottom) for QA auditing.',
      icon: ShieldCheck,
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">
      
      {/* Decorative background glow */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
      <div className="absolute bottom-10 right-1/4 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>

      {/* Top Navbar */}
      <header className="border-b border-slate-900/60 bg-slate-950/40 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white">KLUST Assessment Manager</span>
              <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                v2.1-MultiCourse
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Sheets & Drive Connected (Simulator Mode)</span>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Courses Overview Section */}
      <section className="max-w-7xl mx-auto w-full px-6 pt-12 pb-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-1">Lecturer Workstation</h2>
            <h3 className="text-2xl font-extrabold text-white tracking-tight">Active Course Portfolios</h3>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-500/15"
          >
            <Plus className="h-4 w-4" />
            <span>Add Course Profile</span>
          </button>
        </div>

        {/* Lecturer Profile Configuration Panel */}
        <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-5 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 backdrop-blur-sm shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <UserCheck className="h-5 w-5" />
            </div>
            {isEditingProfile ? (
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Lecturer Name</span>
                  <input
                    type="text"
                    value={lecturerName}
                    onChange={(e) => setLecturerName(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. Dr. Rizal Husin"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Staff No</span>
                  <input
                    type="text"
                    value={lecturerStaffNo}
                    onChange={(e) => setLecturerStaffNo(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                    placeholder="e.g. STF90811"
                  />
                </div>
              </div>
            ) : (
              <div>
                <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Active Lecturer Profile</span>
                <h4 className="text-sm font-bold text-white mt-0.5">
                  {lecturerName || 'Not Set'} <span className="text-slate-500 font-normal ml-1">({lecturerStaffNo || 'Staff No: Not Set'})</span>
                </h4>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              if (isEditingProfile) {
                // Save to localStorage
                localStorage.setItem('lecturer_profile_name', lecturerName);
                localStorage.setItem('lecturer_profile_staff_no', lecturerStaffNo);
                setIsEditingProfile(false);
              } else {
                setIsEditingProfile(true);
              }
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              isEditingProfile
                ? 'bg-emerald-650 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/15'
                : 'bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-350 hover:text-white'
            }`}
          >
            {isEditingProfile ? 'Save Profile' : 'Edit Profile'}
          </button>
        </div>

        {isLoading ? (
          <div className="h-48 rounded-3xl border border-slate-900 bg-slate-900/20 flex items-center justify-center">
            <span className="text-xs text-slate-500 font-mono animate-pulse">Loading active course database...</span>
          </div>
        ) : courses.length === 0 ? (
          <div className="h-48 rounded-3xl border border-dashed border-slate-900 bg-slate-900/10 flex flex-col items-center justify-center gap-3">
            <p className="text-slate-500 text-xs font-semibold">No active courses defined in your workstation.</p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="py-2 px-4 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 text-indigo-400 text-xs font-bold rounded-xl cursor-pointer"
            >
              Add Your First Course
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {courses.map((course) => (
              <div 
                key={course.id}
                className="bg-gradient-to-r from-indigo-950/20 via-slate-900/40 to-slate-900/20 border border-slate-900 hover:border-slate-800 rounded-3xl p-6 backdrop-blur-md relative overflow-hidden flex flex-col justify-between gap-6 transition-all group"
              >
                <div className="absolute top-0 right-0 h-32 w-32 bg-indigo-500/5 rounded-full blur-2xl"></div>
                
                <div className="flex flex-col gap-2">
                   <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">{course.code}</span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleInitiateDuplicate(course, e)}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold bg-transparent border-0 cursor-pointer transition-colors"
                        title="Duplicate this coursework portfolio template (without roster)"
                      >
                        Duplicate Profile
                      </button>
                      <span className="text-[10px] text-slate-800">|</span>
                      <button
                        onClick={(e) => handleDeleteCourse(course.id, e)}
                        className="text-[10px] text-slate-600 hover:text-rose-450 font-bold bg-transparent border-0 cursor-pointer transition-colors"
                      >
                        Delete Profile
                      </button>
                    </div>
                  </div>
                  
                  <h4 className="text-xl font-bold text-white tracking-tight group-hover:text-indigo-200 transition-colors">
                    {course.name}
                  </h4>
                  
                  <div className="flex flex-col gap-1.5 mt-2 text-xs text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5 text-slate-500" />
                      <span>Semester: <strong>{course.semester}</strong></span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <UserCheck className="h-3.5 w-3.5 text-slate-500" />
                      <span>Coordinator: <strong>{course.coordinator}</strong></span>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 text-slate-500" />
                      <span>Students Enrolled: <strong>{course.studentsCount}</strong></span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-900/60 pt-4 mt-2">
                  <span className="text-[10px] font-mono text-slate-600">Sync: {course.lastUpdate}</span>
                  <Link
                    href={`/coursework?course=${course.id}`}
                    className="px-4 py-2 bg-slate-950 border border-slate-900 group-hover:border-indigo-500 group-hover:bg-indigo-600/10 text-white font-bold rounded-xl flex items-center gap-2 text-xs transition-all active:scale-95"
                  >
                    <span>Launch Workspace</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 5-Stage Assessment Lifecycle Overview */}
      <section className="max-w-7xl mx-auto w-full px-6 py-6 flex-1 flex flex-col gap-6">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">Workspace Integration Roadmap</h3>
          <p className="text-slate-400 text-sm font-light">Each coursework module links into Google Sheets databases and creates organized Drive folders.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {stages.map((stage) => {
            const Icon = stage.icon;
            return (
              <div 
                key={stage.id} 
                className="bg-slate-900/10 border border-slate-900/50 rounded-2xl p-5 flex flex-col justify-between transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-3 text-[50px] font-black text-slate-900/40 select-none pointer-events-none group-hover:text-indigo-500/5 transition-colors">
                  0{stage.num}
                </div>

                <div className="flex flex-col gap-4 z-10">
                  <div className="h-10 w-10 rounded-xl bg-slate-950 flex items-center justify-center border border-slate-800 text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-500 transition-all">
                    <Icon className="h-5 w-5" />
                  </div>
                  
                  <div>
                    <h4 className="text-xs font-bold text-white tracking-tight">{stage.title}</h4>
                    <p className="text-slate-500 text-[10px] leading-relaxed mt-1">{stage.desc}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Add Course Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md flex flex-col gap-6 relative shadow-2xl">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <h3 className="text-lg font-bold text-white">Create Course Profile</h3>
              <p className="text-slate-400 text-xs mt-1">Add a new course syllabus to your workstation database.</p>
            </div>

            <form onSubmit={handleAddCourse} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Course Code *</label>
                <input 
                  type="text" 
                  value={newCode} 
                  onChange={(e) => setNewCode(e.target.value)} 
                  placeholder="e.g. CS102"
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-700 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Course Name *</label>
                <input 
                  type="text" 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)} 
                  placeholder="e.g. Data Structures & Algorithms"
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-700 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Semester *</label>
                <select
                  value={newSemester}
                  onChange={(e) => setNewSemester(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="Semester 1 - 2026/2027">Semester 1 - 2026/2027</option>
                  <option value="Semester 2 - 2026/2027">Semester 2 - 2026/2027</option>
                  <option value="Summer Term - 2027">Summer Term - 2027</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Coordinator</label>
                <input 
                  type="text" 
                  value={newCoordinator} 
                  onChange={(e) => setNewCoordinator(e.target.value)} 
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Class Size (Expected Students)</label>
                <input 
                  type="number" 
                  min="2" 
                  max="50"
                  value={newStudentsCount} 
                  onChange={(e) => setNewStudentsCount(Number(e.target.value))} 
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="mt-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-500/15"
              >
                Create Course Profile
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Duplicate Course Modal */}
      {duplicateTarget && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-6 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md flex flex-col gap-6 relative shadow-2xl">
            <button
              onClick={() => setDuplicateTarget(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <h3 className="text-lg font-bold text-white">Duplicate Course Portfolio</h3>
              <p className="text-slate-400 text-xs mt-1">
                This duplicates all coursework components, outcomes mapping, briefs, VBE/ESD settings, and rubrics, but resets the student roster and marks list.
              </p>
            </div>

            <form onSubmit={handleConfirmDuplicate} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">New Course Code *</label>
                <input 
                  type="text" 
                  value={dupCode} 
                  onChange={(e) => setDupCode(e.target.value)} 
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-700 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">New Course Name *</label>
                <input 
                  type="text" 
                  value={dupName} 
                  onChange={(e) => setDupName(e.target.value)} 
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-700 focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Semester *</label>
                <select
                  value={dupSemester}
                  onChange={(e) => setDupSemester(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="Semester 1 - 2026/2027">Semester 1 - 2026/2027</option>
                  <option value="Semester 2 - 2026/2027">Semester 2 - 2026/2027</option>
                  <option value="Summer Term - 2027">Summer Term - 2027</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Class Size (Expected Students)</label>
                <input 
                  type="number" 
                  min="2" 
                  max="50"
                  value={dupClassSize} 
                  onChange={(e) => setDupClassSize(Number(e.target.value))} 
                  className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                className="mt-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-500/15"
              >
                Confirm Duplication
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-8 text-center text-xs text-slate-600 mt-auto">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© 2026 KLUST Assessment Manager. Built for educational alignment and quality assurance.</p>
          <div className="flex gap-4">
            <span className="text-slate-500">Framework: Next.js (App Router)</span>
            <span className="text-slate-700">•</span>
            <span className="text-slate-500">Database: Google Sheets API</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
