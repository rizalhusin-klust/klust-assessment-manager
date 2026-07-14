'use client';

import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Trash2, 
  Save, 
  AlertTriangle, 
  CheckCircle2, 
  BookOpen, 
  Loader2, 
  Check,
  Award,
  Layers,
  LayoutGrid,
  ArrowRight,
  TrendingUp,
  Info,
  FolderOpen,
  FileSpreadsheet,
  FileCheck,
  ShieldCheck,
  ChevronRight,
  Upload,
  RefreshCw,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Settings,
  ChevronDown,
  Download,
  Users,
  Sparkles,
  Copy,
  Printer
} from 'lucide-react';
import Link from 'next/link';

interface AssessmentComponent {
  id: string;
  name: string;
  weight: number;
  assessmentType?: 'qualitative' | 'quantitative';
}

interface RubricLevel {
  score: number;
  label: string;
  desc: string;
}

interface RubricCriteria {
  id: string;
  name: string;
  weight: number; // percentage of this criteria within the component
  levels: RubricLevel[];
  selectedLevel?: number | null;
}

interface Student {
  id: string;
  name: string;
  email: string;
  submissionLink?: string;
  status: 'Graded' | 'Pending';
  grades: Record<string, number>; // componentId -> percentage score (0-100)
  finalMark?: number; // weighted total score based on coursework components
}

interface FormField {
  label: string;
  type: string;
  req: boolean;
  note?: string;
  options?: string[];
  points?: number;
}

interface FormSection {
  name: string;
  fields: FormField[];
}

interface FormBlueprint {
  title: string;
  desc: string;
  sections: FormSection[];
  settings: { key: string; val: string }[];
}

interface AssessmentBrief {
  startDate: string;
  endDate: string;
  instructions: string;
  tasks: string;
  submissionFormat: string;
  evidenceToSubmit?: string;
  maxPoints: number;
  allowedAttempts: number;
  attachmentName?: string;
  attachmentUrl?: string;
}

interface Outcome {
  id: string;
  code: string;
  desc: string;
  category: string; // domain for CLOs, category/type for PLOs
  level?: string;   // expected domain level for CLOs
}

const DEFAULT_CLOS: Outcome[] = [
  { id: 'CLO1', code: 'CLO-1', desc: 'Analyze software requirements and specify design architectures.', category: 'Cognitive', level: 'C4' },
  { id: 'CLO2', code: 'CLO-2', desc: 'Implement modular codebases satisfying clean-code design patterns.', category: 'Psychomotor', level: 'P4' },
  { id: 'CLO3', code: 'CLO-3', desc: 'Collaborate in team environments and present system designs.', category: 'Affective', level: 'A3' }
];

const DEFAULT_PLOS: Outcome[] = [
  { id: 'PLO1', code: 'PLO-1', desc: 'Apply engineering principles to solve complex problems.', category: 'Theory' },
  { id: 'PLO3', code: 'PLO-3', desc: 'Design and model hardware/software components matching specifications.', category: 'Design' },
  { id: 'PLO6', code: 'PLO-6', desc: 'Communicate technical solutions effectively to professional audiences.', category: 'Comm' }
];

const DEFAULT_CLO_PLO_MAPPING: Record<string, boolean> = {
  'CLO1_PLO1': true,
  'CLO2_PLO3': true,
  'CLO3_PLO6': true,
};

const DEFAULT_BRIEFS: Record<string, AssessmentBrief> = {
  '1': {
    startDate: '2026-08-01T09:00',
    endDate: '2026-08-01T12:00',
    instructions: 'Complete all MCQ concept verification and upload your handwritten calculation scans as a single PDF.',
    tasks: 'Part A: 20 points MCQs.\nPart B: 80 points written working scans uploads.',
    submissionFormat: 'PDF',
    evidenceToSubmit: 'Handwritten calculation scans PDF, Student verification form',
    maxPoints: 100,
    allowedAttempts: 1,
    attachmentName: 'midterm_exam_outline_syllabus.pdf',
    attachmentUrl: 'https://docs.google.com/document/d/1t38b1tA86aZ741qF3YxW19yFqD77s4qfD3pB2w/preview'
  },
  '2': {
    startDate: '2026-07-12T10:00',
    endDate: '2026-09-01T23:59',
    instructions: 'Build and deploy a CourseArchitect coursework outcomes and quality manager application syncing with Google Drive.',
    tasks: 'Task 1: Next.js scaffold and portal layouts.\nTask 2: Google Sheets API database sync integration.\nTask 3: Automatic Drive folder provisioning.\nTask 4: Quality Auditor moderation pack draws.',
    submissionFormat: 'ZIP',
    evidenceToSubmit: 'ZIP archive of code, Presentation Slides PDF, System Architecture Blueprint',
    maxPoints: 100,
    allowedAttempts: 3,
    attachmentName: 'final_project_specifications.docx',
    attachmentUrl: 'https://docs.google.com/document/d/1X45vWf_vXpP6eYt4W-4wR19yFqD77s4qfD3pB2w/preview'
  },
  '3': {
    startDate: '2026-07-15T08:00',
    endDate: '2026-07-30T18:00',
    instructions: 'Complete weekly MCQ concepts check quizzes.',
    tasks: 'Task 1: Complete online self-graded MCQ form.\nTask 2: Verify submit outcomes.',
    submissionFormat: 'Google Form MCQ Submits',
    evidenceToSubmit: 'Google Form submit confirmation screenshot',
    maxPoints: 100,
    allowedAttempts: 2,
    attachmentName: '',
    attachmentUrl: ''
  }
};

const DEFAULT_COMPONENTS: AssessmentComponent[] = [
  { id: '1', name: 'Midterm Exam', weight: 30 },
  { id: '2', name: 'Final Project', weight: 40 },
  { id: '3', name: 'Quizzes & Assignments', weight: 30 },
];

const DEFAULT_STUDENTS: Student[] = [
  { id: 'S101', name: 'Alice Tan', email: 'alice.tan@university.edu', status: 'Pending', grades: {} },
  { id: 'S102', name: 'Benjamin Lim', email: 'benjamin.lim@university.edu', status: 'Pending', grades: {} },
  { id: 'S103', name: 'Catherine Ng', email: 'catherine.ng@university.edu', status: 'Pending', grades: {} },
  { id: 'S104', name: 'Daniel Yeoh', email: 'daniel.yeoh@university.edu', status: 'Pending', grades: {} },
  { id: 'S105', name: 'Elena Rostova', email: 'elena.rostova@university.edu', status: 'Pending', grades: {} },
  { id: 'S106', name: 'Farhan Idris', email: 'farhan.idris@university.edu', status: 'Pending', grades: {} },
  { id: 'S107', name: 'Geraldine Khoo', email: 'geraldine.khoo@university.edu', status: 'Pending', grades: {} },
  { id: 'S108', name: 'Haris Munandar', email: 'haris.munandar@university.edu', status: 'Pending', grades: {} },
  { id: 'S109', name: 'Irene Adler', email: 'irene.adler@university.edu', status: 'Pending', grades: {} },
  { id: 'S110', name: 'Jason Statham', email: 'jason.statham@university.edu', status: 'Pending', grades: {} },
];

const DEFAULT_RUBRICS: Record<string, RubricCriteria[]> = {
  // Midterm Exam
  '1': [
    {
      id: 'r1',
      name: 'Conceptual Knowledge',
      weight: 50,
      levels: [
        { score: 1, label: 'Unsatisfactory', desc: 'Comprehends under 20% of basic concepts and definitions.' },
        { score: 2, label: 'Developing', desc: 'Identifies basic concepts but struggles with deep analysis.' },
        { score: 3, label: 'Proficient', desc: 'Accurately explains major concepts and basic applications.' },
        { score: 4, label: 'Advanced', desc: 'Displays clear conceptual structures and resolves core sub-questions.' },
        { score: 5, label: 'Outstanding', desc: 'Displays deep theoretical grasp, articulating nuances and edge cases.' }
      ]
    },
    {
      id: 'r2',
      name: 'Problem Solving Accuracy',
      weight: 50,
      levels: [
        { score: 1, label: 'Unsatisfactory', desc: 'Solutions are incorrect or lack working details.' },
        { score: 2, label: 'Developing', desc: 'Applies correct formula but errs in calculation steps.' },
        { score: 3, label: 'Proficient', desc: 'Solves complex problems accurately with minor structural errors.' },
        { score: 4, label: 'Advanced', desc: 'Solves complex problems with complete calculation details.' },
        { score: 5, label: 'Outstanding', desc: 'Flawless logic showing elegant mathematical steps and derivations.' }
      ]
    }
  ],
  // Final Project
  '2': [
    {
      id: 'rp1',
      name: 'Technical Implementation',
      weight: 40,
      levels: [
        { score: 1, label: 'Unsatisfactory', desc: 'Code fails to run, has major security flaws, or lacks formatting.' },
        { score: 2, label: 'Developing', desc: 'Runs but exhibits poor architectural patterns or code duplication.' },
        { score: 3, label: 'Proficient', desc: 'Robust implementation satisfying features with clean modules.' },
        { score: 4, label: 'Advanced', desc: 'Implements modules with good test coverage and robust handlers.' },
        { score: 5, label: 'Outstanding', desc: 'Outstanding codebase: high test coverage, optimal design, clean architecture.' }
      ]
    },
    {
      id: 'rp2',
      name: 'CLO-2 Design Alignment',
      weight: 30,
      levels: [
        { score: 1, label: 'Unsatisfactory', desc: 'Fails to trace project modules to design blueprints.' },
        { score: 2, label: 'Developing', desc: 'Shows partial mapping with weak architectural diagrams.' },
        { score: 3, label: 'Proficient', desc: 'Correctly maps component classes back to design pattern targets.' },
        { score: 4, label: 'Advanced', desc: 'Details class diagrams mapping components with trace files.' },
        { score: 5, label: 'Outstanding', desc: 'Provides flawless UML blueprints mapping software components with traces.' }
      ]
    },
    {
      id: 'rp3',
      name: 'Presentation & Defense',
      weight: 30,
      levels: [
        { score: 1, label: 'Unsatisfactory', desc: 'Struggles to describe architectural decisions during Q&A.' },
        { score: 2, label: 'Developing', desc: 'Explanations are hesitant; presentation slides are incomplete.' },
        { score: 3, label: 'Proficient', desc: 'Communicates code designs confidently; answers team questions.' },
        { score: 4, label: 'Advanced', desc: 'Delivers clear defense of design decisions; handles standard questions.' },
        { score: 5, label: 'Outstanding', desc: 'Delivers exceptional pitch; answers difficult structural questions with authority.' }
      ]
    }
  ],
  // Quizzes & Assignments
  '3': [
    {
      id: 'rq1',
      name: 'Timeliness & Format',
      weight: 30,
      levels: [
        { score: 1, label: 'Poor', desc: 'Submitted late or in wrong file formats.' },
        { score: 2, label: 'Acceptable', desc: 'Minor formatting issues, submitted within grace time.' },
        { score: 3, label: 'Proficient', desc: 'Submitted on time; correct file formats.' },
        { score: 4, label: 'Advanced', desc: 'Submitted early with complete metadata.' },
        { score: 5, label: 'Perfect', desc: 'Submitted early; pristine code comments and formatting.' }
      ]
    },
    {
      id: 'rq2',
      name: 'Core Correctness',
      weight: 70,
      levels: [
        { score: 1, label: 'Incorrect', desc: 'Most answers fail to show core understanding.' },
        { score: 2, label: 'Developing', desc: 'Fulfillments are partial; minor execution bugs.' },
        { score: 3, label: 'Proficient', desc: 'Fulfills all core requirements correctly.' },
        { score: 4, label: 'Advanced', desc: 'Fulfills all requirements with advanced query optimizations.' },
        { score: 5, label: 'Excellent', desc: 'Complete correctness; solves advanced problems with clear details.' }
      ]
    }
  ]
};

export default function CourseworkPage() {
  const [activeStage, setActiveStage] = useState<'pre_setting' | 'design_brief_rubrics' | 'distribution' | 'grading' | 'sampling'>('pre_setting');
  const [courseCode, setCourseCode] = useState('CS302');
  const [courseName, setCourseName] = useState('Advanced Software Engineering');
  const [semester, setSemester] = useState('Semester 1 - 2026/2027');
  const [courseCoordinator, setCourseCoordinator] = useState('Dr. Rizal Husin');
  const [clusterLeader, setClusterLeader] = useState('Prof. Ahmad');
  const [components, setComponents] = useState<AssessmentComponent[]>(DEFAULT_COMPONENTS);
  const [students, setStudents] = useState<Student[]>(DEFAULT_STUDENTS);
  const [rubrics, setRubrics] = useState<Record<string, RubricCriteria[]>>(DEFAULT_RUBRICS);

  // CLO/PLO Mapping
  // Key format: componentId_cloId -> weight (0-100)
  const [cloPloMapping, setCloPloMapping] = useState<Record<string, number>>({
    '1_CLO1': 80,
    '1_CLO3': 20,
    '2_CLO2': 100,
    '3_CLO1': 50,
    '3_CLO3': 50,
  });

  // Folder Provisioning State
  const [provisionState, setProvisionState] = useState<{
    provisioned: boolean;
    folderLinks: Record<string, string>;
    isLoading: boolean;
  }>({
    provisioned: false,
    folderLinks: {},
    isLoading: false
  });

  // Submission Simulation state
  const [submissionsSimulated, setSubmissionsSimulated] = useState(false);
  const [isSimulatingSubmissions, setIsSimulatingSubmissions] = useState(false);

  // Rubric Selection & Editing
  const [activeRubricCompId, setActiveRubricCompId] = useState<string>('1');

  // Grading desk selection
  const [selectedStudentId, setSelectedStudentId] = useState<string>('S101');
  const [activeGradingCompId, setActiveGradingCompId] = useState<string>('1');
  const [currentGradingRubric, setCurrentGradingRubric] = useState<RubricCriteria[]>([]);

  // QA Sampling state
  const [samplingRule, setSamplingRule] = useState<'tmb' | 'random' | 'clustered'>('tmb');
  const [isCompilingSample, setIsCompilingSample] = useState(false);
  const [sampleExportStatus, setSampleExportStatus] = useState<string | null>(null);

  // Google Form Proposer State
  const [selectedFormCompId, setSelectedFormCompId] = useState<string>('3');
  const [formTemplateTypeOverride, setFormTemplateTypeOverride] = useState<string>('auto');

  // Multi-Course Workspace states
  const [activeCourseId, setActiveCourseId] = useState<string>('CS302_SEM1_2026');
  const [isInitialized, setIsInitialized] = useState(false);

  // CLO & PLO Workspace states
  const [cloList, setCloList] = useState<Outcome[]>(DEFAULT_CLOS);
  const [ploList, setPloList] = useState<Outcome[]>(DEFAULT_PLOS);
  const [cloToPloMapping, setCloToPloMapping] = useState<Record<string, boolean>>(DEFAULT_CLO_PLO_MAPPING);

  // Assessment Brief states
  const [assessmentBriefs, setAssessmentBriefs] = useState<Record<string, AssessmentBrief>>(DEFAULT_BRIEFS);
  const [briefSessionPreviews, setBriefSessionPreviews] = useState<Record<string, string>>({});

  // UX Settings
  const [isSidebarVisible, setIsSidebarVisible] = useState<boolean>(true);
  const [isLightMode, setIsLightMode] = useState<boolean>(true);

  // Multi-Lecturer Grading states
  const [enableDoubleMarking, setEnableDoubleMarking] = useState<boolean>(true);
  const [activeMarker, setActiveMarker] = useState<'Marker A' | 'Marker B'>('Marker A');
  const [markerGrades, setMarkerGrades] = useState<Record<string, Record<string, { markerAScore?: number; markerBScore?: number; moderatedScore?: number; moderatorRemarks?: string }>>>({});
  // Curricular & Value Integrations (VBE / ESD / Related Courses)
  const [hasCourseIntegration, setHasCourseIntegration] = useState<boolean>(false);
  const [integratedCourseNames, setIntegratedCourseNames] = useState<string>('');
  const [courseIntegrationDetails, setCourseIntegrationDetails] = useState<string>('');
  const [hasVbeIntegration, setHasVbeIntegration] = useState<boolean>(false);
  const [vbeTnlDetails, setVbeTnlDetails] = useState<string>('');
  const [vbeAssessmentDetails, setVbeAssessmentDetails] = useState<string>('');
  const [hasEsdIntegration, setHasEsdIntegration] = useState<boolean>(false);
  const [esdTnlDetails, setEsdTnlDetails] = useState<string>('');
  const [esdAssessmentDetails, setEsdAssessmentDetails] = useState<string>('');

  const [copiedPrompt, setCopiedPrompt] = useState<boolean>(false);
  const [isBulkPasteOpen, setIsBulkPasteOpen] = useState<boolean>(false);
  const [bulkPasteText, setBulkPasteText] = useState<string>('');
  const [isDocViewportVisible, setIsDocViewportVisible] = useState<boolean>(true);
  const [isPromptCanvasCollapsed, setIsPromptCanvasCollapsed] = useState<boolean>(false);
  const [isPreSettingImportOpen, setIsPreSettingImportOpen] = useState<boolean>(false);
  const [preSettingImportText, setPreSettingImportText] = useState<string>('');
  const [preSettingImportStatus, setPreSettingImportStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [isRosterPasteOpen, setIsRosterPasteOpen] = useState<boolean>(false);
  const [rosterPasteText, setRosterPasteText] = useState<string>('');
  const [rosterPasteStatus, setRosterPasteStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [driveShareEmail, setDriveShareEmail] = useState<string>('');


  // Common Action Feedback
  const [apiLogs, setApiLogs] = useState<string[]>([]);
  const [saveStatus, setSaveStatus] = useState<{
    success: boolean;
    message: string;
    isSimulated?: boolean;
  } | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [currentDateText, setCurrentDateText] = useState<string>('');

  // Load Course and State on Mount / URL change
  useEffect(() => {
    setCurrentDateText(new Date().toLocaleDateString());
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      let courseId = params.get('course') || 'CS302_SEM1_2026';
      
      // Look up course details from master list
      const coursesStored = localStorage.getItem('course_architect_courses');
      let courseProfile: any = null;
      if (coursesStored) {
        try {
          const courseList = JSON.parse(coursesStored);
          courseProfile = courseList.find((c: any) => c.id === courseId);
        } catch(e) {}
      }

      if (courseProfile) {
        setActiveCourseId(courseId);
        setCourseCode(courseProfile.code);
        setCourseName(courseProfile.name);
        setSemester(courseProfile.semester);
        setCourseCoordinator(courseProfile.coordinator || 'Dr. Rizal Husin');
      } else {
        // Fallback to default
        setActiveCourseId('CS302_SEM1_2026');
        setCourseCode('CS302');
        setCourseName('Advanced Software Engineering');
        setSemester('Semester 1 - 2026/2027');
        setCourseCoordinator('Dr. Rizal Husin');
        courseId = 'CS302_SEM1_2026';
      }

      // Load course details state
      const stateStored = localStorage.getItem(`course_state_${courseId}`);
      if (stateStored) {
        try {
          const state = JSON.parse(stateStored);
          if (state.components) setComponents(state.components);
          if (state.cloPloMapping) setCloPloMapping(state.cloPloMapping);
          if (state.rubrics) setRubrics(state.rubrics);
          if (state.students) setStudents(state.students);
          if (state.provisionState) setProvisionState(state.provisionState);
          if (state.submissionsSimulated !== undefined) setSubmissionsSimulated(state.submissionsSimulated);
          if (state.cloList) setCloList(state.cloList);
          if (state.ploList) setPloList(state.ploList);
          if (state.cloToPloMapping) setCloToPloMapping(state.cloToPloMapping);
          if (state.assessmentBriefs) setAssessmentBriefs(state.assessmentBriefs);
          if (state.courseCoordinator !== undefined) setCourseCoordinator(state.courseCoordinator);
          if (state.clusterLeader !== undefined) setClusterLeader(state.clusterLeader);
          if (state.markerGrades) setMarkerGrades(state.markerGrades);
          if (state.enableDoubleMarking !== undefined) setEnableDoubleMarking(state.enableDoubleMarking);
          if (state.hasCourseIntegration !== undefined) setHasCourseIntegration(state.hasCourseIntegration);
          if (state.integratedCourseNames !== undefined) setIntegratedCourseNames(state.integratedCourseNames);
          if (state.courseIntegrationDetails !== undefined) setCourseIntegrationDetails(state.courseIntegrationDetails);
          if (state.hasVbeIntegration !== undefined) setHasVbeIntegration(state.hasVbeIntegration);
          if (state.vbeTnlDetails !== undefined) setVbeTnlDetails(state.vbeTnlDetails);
          if (state.vbeAssessmentDetails !== undefined) setVbeAssessmentDetails(state.vbeAssessmentDetails);
          if (state.hasEsdIntegration !== undefined) setHasEsdIntegration(state.hasEsdIntegration);
          if (state.esdTnlDetails !== undefined) setEsdTnlDetails(state.esdTnlDetails);
          if (state.esdAssessmentDetails !== undefined) setEsdAssessmentDetails(state.esdAssessmentDetails);
          if (state.driveShareEmail !== undefined) setDriveShareEmail(state.driveShareEmail);
        } catch(e) {}
      } else {
        setDriveShareEmail('');
        setMarkerGrades({});
        setEnableDoubleMarking(true);
        setHasCourseIntegration(false);
        setIntegratedCourseNames('');
        setCourseIntegrationDetails('');
        setHasVbeIntegration(false);
        setVbeTnlDetails('');
        setVbeAssessmentDetails('');
        setHasEsdIntegration(false);
        setEsdTnlDetails('');
        setEsdAssessmentDetails('');
        // Initialize default student list based on class size
        const size = courseProfile ? courseProfile.studentsCount : 10;
        const generatedStudents: Student[] = Array.from({ length: size }, (_, i) => {
          const idNum = 101 + i;
          const alphabet = String.fromCharCode(65 + (i % 26)); // A, B, C...
          return {
            id: `S${idNum}`,
            name: `${alphabet}student for ${courseProfile ? courseProfile.code : 'CS302'}`,
            email: `student_${idNum}@university.edu`,
            status: 'Pending',
            grades: {}
          };
        });

        // Use defaults
        setComponents(DEFAULT_COMPONENTS);
        setCloPloMapping({
          '1_CLO1': 80,
          '1_CLO3': 20,
          '2_CLO2': 100,
          '3_CLO1': 50,
          '3_CLO3': 50,
        });
        setRubrics(DEFAULT_RUBRICS);
        setStudents(generatedStudents);
        setProvisionState({ provisioned: false, folderLinks: {}, isLoading: false });
        setSubmissionsSimulated(false);
        setCloList(DEFAULT_CLOS);
        setPloList(DEFAULT_PLOS);
        setCloToPloMapping(DEFAULT_CLO_PLO_MAPPING);
        setAssessmentBriefs(DEFAULT_BRIEFS);
      }
      setIsInitialized(true);

      const globalLecturerEmail = localStorage.getItem('lecturer_profile_email');
      if (globalLecturerEmail) {
        setDriveShareEmail(globalLecturerEmail);
      }
      
      // Update sidebar grader target student index
      if (courseProfile && courseProfile.id === 'CS302_SEM1_2026') {
        setSelectedStudentId('S101');
      } else {
        setSelectedStudentId('S101');
      }

      addLog(`Loaded course workspace profile: ${courseProfile ? courseProfile.code : 'CS302'} (${courseProfile ? courseProfile.semester : 'Semester 1'})`);
    }
  }, []);

  // Save changes to localStorage reactively when any state changes
  useEffect(() => {
    if (isInitialized && typeof window !== 'undefined') {
      const stateObj = {
        components,
        cloPloMapping,
        rubrics,
        students,
        provisionState,
        submissionsSimulated,
        cloList,
        ploList,
        cloToPloMapping,
        assessmentBriefs,
        markerGrades,
        enableDoubleMarking,
        hasCourseIntegration,
        integratedCourseNames,
        courseIntegrationDetails,
        hasVbeIntegration,
        vbeTnlDetails,
        vbeAssessmentDetails,
        hasEsdIntegration,
        esdTnlDetails,
        esdAssessmentDetails,
        courseCoordinator,
        clusterLeader,
        driveShareEmail
      };
      localStorage.setItem(`course_state_${activeCourseId}`, JSON.stringify(stateObj));
      
      // Update course lists last update date
      const coursesStored = localStorage.getItem('course_architect_courses');
      if (coursesStored) {
        try {
          const courseList = JSON.parse(coursesStored);
          const updated = courseList.map((c: any) => {
            if (c.id === activeCourseId) {
              return { ...c, lastUpdate: new Date().toISOString().split('T')[0] };
            }
            return c;
          });
          localStorage.setItem('course_architect_courses', JSON.stringify(updated));
        } catch(e) {}
      }
    }
  }, [isInitialized, activeCourseId, components, cloPloMapping, rubrics, students, provisionState, submissionsSimulated, cloList, ploList, cloToPloMapping, assessmentBriefs, markerGrades, enableDoubleMarking, hasCourseIntegration, integratedCourseNames, courseIntegrationDetails, hasVbeIntegration, vbeTnlDetails, vbeAssessmentDetails, hasEsdIntegration, esdTnlDetails, esdAssessmentDetails, courseCoordinator, clusterLeader]);

  // Initialize selected rubric inside Grading Desk
  useEffect(() => {
    const compRubrics = rubrics[activeGradingCompId] || [];
    const student = students.find(s => s.id === selectedStudentId);
    
    if (student) {
      // Re-hydrate rubric selections if student has grades for this component
      // In a real app we store criteria-level selections. Let's mock level selections.
      // If student is graded, distribute their points or map them.
      const hydrated = compRubrics.map((crit, idx) => {
        // Mock some selection if graded, or keep null
        const savedScore = student.grades[activeGradingCompId];
        let chosenLevel = null;
        if (savedScore !== undefined) {
          // If graded, distribute selection
          const levelCount = crit.levels.length;
          // select a level based on grade percentage
          const percent = savedScore / 100;
          const levelIndex = Math.min(levelCount - 1, Math.floor(percent * levelCount));
          chosenLevel = crit.levels[levelIndex].score;
        }
        return {
          ...crit,
          selectedLevel: chosenLevel
        };
      });
      setCurrentGradingRubric(hydrated);
    } else {
      setCurrentGradingRubric(compRubrics.map(c => ({ ...c, selectedLevel: null })));
    }
  }, [selectedStudentId, activeGradingCompId, rubrics, students]);

  // CLO Helpers
  const addClo = () => {
    const newId = `CLO_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const newCode = `CLO-${cloList.length + 1}`;
    setCloList([...cloList, { id: newId, code: newCode, desc: 'Describe this outcome...', category: 'Cognitive', level: 'C1' }]);
  };

  const deleteClo = (id: string) => {
    if (cloList.length <= 1) return;
    setCloList(cloList.filter(c => c.id !== id));
    // Clean up mapping
    const cleanMapping = { ...cloToPloMapping };
    Object.keys(cleanMapping).forEach(key => {
      if (key.startsWith(`${id}_`)) {
        delete cleanMapping[key];
      }
    });
    setCloToPloMapping(cleanMapping);
  };

  const updateClo = (id: string, field: 'code' | 'desc' | 'category' | 'level', value: string) => {
    setCloList(prev => prev.map(c => {
      if (c.id === id) {
        if (field === 'category') {
          let defaultLvl = 'C1';
          if (value === 'Psychomotor') defaultLvl = 'P1';
          if (value === 'Affective') defaultLvl = 'A1';
          return { ...c, category: value, level: defaultLvl };
        }
        return { ...c, [field]: value };
      }
      return c;
    }));
  };

  // PLO Helpers
  const addPlo = () => {
    const newId = `PLO_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
    const newCode = `PLO-${ploList.length + 1}`;
    setPloList([...ploList, { id: newId, code: newCode, desc: 'Describe this program outcome...', category: 'Theory' }]);
  };

  const deletePlo = (id: string) => {
    if (ploList.length <= 1) return;
    setPloList(ploList.filter(p => p.id !== id));
    // Clean up mapping
    const cleanMapping = { ...cloToPloMapping };
    Object.keys(cleanMapping).forEach(key => {
      if (key.endsWith(`_${id}`)) {
        delete cleanMapping[key];
      }
    });
    setCloToPloMapping(cleanMapping);
  };

  const updatePlo = (id: string, field: 'code' | 'desc' | 'category', value: string) => {
    setPloList(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  // CLO to PLO Mapping Toggles
  const toggleCloPloMapping = (cloId: string, ploId: string) => {
    const key = `${cloId}_${ploId}`;
    setCloToPloMapping(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const updateComponentAssessmentType = (compId: string, type: 'qualitative' | 'quantitative') => {
    setComponents(prev => prev.map(c => c.id === compId ? { ...c, assessmentType: type } : c));
    addLog(`Updated component [${compId}] grading mode to: ${type.toUpperCase()}`);
  };

  // Assessment Brief helper
  const updateAssessmentBrief = (compId: string, field: keyof AssessmentBrief, value: any) => {
    setAssessmentBriefs(prev => {
      const brief = prev[compId] || {
        startDate: '',
        endDate: '',
        instructions: '',
        tasks: '',
        submissionFormat: '',
        maxPoints: 100,
        allowedAttempts: 1
      };
      return {
        ...prev,
        [compId]: {
          ...brief,
          [field]: value
        }
      };
    });
  };

  const handleBriefFileUpload = (compId: string, file: File | null) => {
    if (!file) {
      updateAssessmentBrief(compId, 'attachmentName', '');
      updateAssessmentBrief(compId, 'attachmentUrl', '');
      setBriefSessionPreviews(prev => {
        const next = { ...prev };
        delete next[compId];
        return next;
      });
      addLog("Cleared assessment brief file attachment.");
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setBriefSessionPreviews(prev => ({
      ...prev,
      [compId]: objectUrl
    }));

    updateAssessmentBrief(compId, 'attachmentName', file.name);
    updateAssessmentBrief(compId, 'attachmentUrl', `https://drive.google.com/file/d/simulated_drive_${file.name.replace(/\s+/g, '_')}/preview`);

    addLog(`Attached local file "${file.name}" to assessment brief. Generated session preview.`);
  };

  const getBriefPreviewUrl = (compId: string) => {
    const brief = assessmentBriefs[compId];
    if (briefSessionPreviews[compId]) {
      const blobUrl = briefSessionPreviews[compId];
      if (brief?.attachmentName?.toLowerCase().endsWith('.pdf') && !blobUrl.includes('#')) {
        return `${blobUrl}#zoom=PageWidth`;
      }
      return blobUrl;
    }
    if (!brief || !brief.attachmentUrl) return '';
    const url = brief.attachmentUrl.trim();
    if (url.includes('docs.google.com') || url.includes('drive.google.com')) {
      let cleanUrl = url;
      cleanUrl = cleanUrl.replace(/\/edit(\?.*)?$/, '');
      cleanUrl = cleanUrl.replace(/\/view(\?.*)?$/, '');
      if (!cleanUrl.endsWith('/preview')) {
        cleanUrl = `${cleanUrl}/preview`;
      }
      return cleanUrl;
    }
    if (url.toLowerCase().endsWith('.pdf') && !url.includes('#')) {
      return `${url}#zoom=PageWidth`;
    }
    return url;
  };



  // Read URL search params for stage route matching on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const stageParam = params.get('stage') as any;
      if (stageParam && ['pre_setting', 'design_brief_rubrics', 'distribution', 'grading', 'sampling'].includes(stageParam)) {
        setActiveStage(stageParam);
      }
    }
  }, []);

  // Sync route URL with active tabs
  const handleStageChange = (stage: typeof activeStage) => {
    setActiveStage(stage);
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', `/coursework?stage=${stage}`);
    }
    setSaveStatus(null);
  };

  // Helper log
  const addLog = (message: string) => {
    setApiLogs(prev => [
      `[${new Date().toLocaleTimeString()}] ${message}`,
      ...prev.slice(0, 14)
    ]);
  };

  const addStudent = () => {
    const nextIdNum = students.length > 0 
      ? (Math.max(...students.map(s => {
          const num = parseInt(s.id.replace(/\D/g, ''));
          return isNaN(num) ? 0 : num;
        })) + 1)
      : 101;
    const newStudent: Student = {
      id: `S${nextIdNum}`,
      name: `New Student ${nextIdNum}`,
      email: `student_${nextIdNum}@university.edu`,
      status: 'Pending',
      grades: {}
    };
    setStudents([...students, newStudent]);
    addLog(`Added student ${newStudent.name} to roster.`);
  };

  const deleteStudent = (id: string) => {
    if (students.length <= 1) {
      alert("At least one student must remain in the class roster.");
      return;
    }
    setStudents(prev => prev.filter(s => s.id !== id));
    addLog(`Deleted student ${id} from roster.`);
  };

  const updateStudentField = (id: string, field: 'id' | 'name' | 'email', val: string) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, [field]: val } : s));
  };

  const handleBulkImportRoster = (text: string) => {
    if (!text || !text.trim()) {
      setRosterPasteStatus({ success: false, message: "Pasted text is empty." });
      return;
    }

    try {
      const lines = text.split('\n');
      const parsedStudents: Student[] = [];

      for (let i = 0; i < lines.length; i++) {
        const rawLine = lines[i].trim();
        if (!rawLine) continue;

        // Skip headers
        if (i === 0 && (rawLine.toLowerCase().includes('id') || rawLine.toLowerCase().includes('email') || rawLine.toLowerCase().includes('name') || rawLine.toLowerCase().includes('matric'))) {
          continue;
        }

        // Try parsing by TAB, COMMA, or SEMICOLON
        let parts: string[] = [];
        if (rawLine.includes('\t')) {
          parts = rawLine.split('\t');
        } else if (rawLine.includes(',')) {
          parts = rawLine.split(',');
        } else if (rawLine.includes(';')) {
          parts = rawLine.split(';');
        } else {
          parts = rawLine.split(/\s{2,}/); // split by multiple spaces
        }

        parts = parts.map(p => p.trim());

        let id = '';
        let name = '';
        let email = '';

        if (parts.length >= 3) {
          const emailIdx = parts.findIndex(p => p.includes('@'));
          if (emailIdx !== -1) {
            email = parts[emailIdx];
            const otherParts = parts.filter((_, idx) => idx !== emailIdx);
            const idIdx = otherParts.findIndex(p => /\d/.test(p) || p.length <= 10);
            if (idIdx !== -1) {
              id = otherParts[idIdx];
              name = otherParts.filter((_, idx) => idx !== idIdx).join(' ');
            } else {
              id = otherParts[0];
              name = otherParts.slice(1).join(' ');
            }
          } else {
            id = parts[0];
            name = parts[1];
            email = parts[2] || `${name.toLowerCase().replace(/\s+/g, '')}@university.edu`;
          }
        } else if (parts.length === 2) {
          id = parts[0];
          name = parts[1];
          email = `${name.toLowerCase().replace(/\s+/g, '')}@university.edu`;
        } else if (parts.length === 1) {
          name = parts[0];
          id = `S${101 + parsedStudents.length}`;
          email = `${name.toLowerCase().replace(/\s+/g, '')}@university.edu`;
        }

        if (name) {
          if (!id) id = `S${101 + parsedStudents.length}`;
          parsedStudents.push({
            id,
            name,
            email,
            status: 'Pending',
            grades: {}
          });
        }
      }

      if (parsedStudents.length > 0) {
        setStudents(parsedStudents);
        addLog(`SUCCESS: Bulk-imported ${parsedStudents.length} students into class roster.`);
        setRosterPasteStatus({ success: true, message: `Successfully imported ${parsedStudents.length} students!` });
        setRosterPasteText('');
        setIsRosterPasteOpen(false);
      } else {
        setRosterPasteStatus({ success: false, message: "Could not identify any valid student records. Check structure." });
      }
    } catch (e: any) {
      setRosterPasteStatus({ success: false, message: `Failed parsing roster: ${e.message}` });
    }
  };

  const handleImportPreSetting = (text: string) => {
    if (!text || !text.trim()) {
      setPreSettingImportStatus({ success: false, message: "Pasted text is empty." });
      return;
    }
    
    // 1. Try JSON parsing
    try {
      if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
        const parsed = JSON.parse(text);
        if (parsed.courseCode) setCourseCode(parsed.courseCode);
        if (parsed.courseName) setCourseName(parsed.courseName);
        if (parsed.courseCoordinator) setCourseCoordinator(parsed.courseCoordinator);
        if (parsed.clusterLeader) setClusterLeader(parsed.clusterLeader);
        if (parsed.components && Array.isArray(parsed.components)) setComponents(parsed.components);
        if (parsed.cloList && Array.isArray(parsed.cloList)) setCloList(parsed.cloList);
        if (parsed.ploList && Array.isArray(parsed.ploList)) setPloList(parsed.ploList);
        if (parsed.cloToPloMapping) setCloToPloMapping(parsed.cloToPloMapping);
        if (parsed.cloPloMapping) setCloPloMapping(parsed.cloPloMapping);
        if (parsed.hasCourseIntegration !== undefined) setHasCourseIntegration(parsed.hasCourseIntegration);
        if (parsed.integratedCourseNames) setIntegratedCourseNames(parsed.integratedCourseNames);
        if (parsed.courseIntegrationDetails) setCourseIntegrationDetails(parsed.courseIntegrationDetails);
        if (parsed.hasVbeIntegration !== undefined) setHasVbeIntegration(parsed.hasVbeIntegration);
        if (parsed.vbeTnlDetails) setVbeTnlDetails(parsed.vbeTnlDetails);
        if (parsed.vbeAssessmentDetails) setVbeAssessmentDetails(parsed.vbeAssessmentDetails);
        if (parsed.hasEsdIntegration !== undefined) setHasEsdIntegration(parsed.hasEsdIntegration);
        if (parsed.esdTnlDetails) setEsdTnlDetails(parsed.esdTnlDetails);
        if (parsed.esdAssessmentDetails) setEsdAssessmentDetails(parsed.esdAssessmentDetails);
        
        addLog("SUCCESS: Imported course blueprint configurations from JSON.");
        setPreSettingImportStatus({ success: true, message: "Successfully imported from JSON configuration!" });
        return;
      }
    } catch (e: any) {
      // If it started like JSON but failed, flag it, but try line-by-line just in case
    }

    // 2. Line-by-line parsing for CSV, Markdown, text key-value format
    try {
      const lines = text.split('\n');
      let currentSection = '';
      
      let tempCourseCode = '';
      let tempCourseName = '';
      let tempCoordinator = '';
      let tempClusterLeader = '';

      let tempComponents: AssessmentComponent[] = [];
      let tempCloList: Outcome[] = [];
      let tempPloList: Outcome[] = [];
      let tempCloToPlo: Record<string, boolean> = {};
      let tempCloPlo: Record<string, number> = {};

      let tempHasCourseInt = false;
      let tempCourseIntNames = '';
      let tempCourseIntDetails = '';
      let tempHasVbeInt = false;
      let tempVbeTnl = '';
      let tempVbeAssess = '';
      let tempHasEsdInt = false;
      let tempEsdTnl = '';
      let tempEsdAssess = '';

      for (let i = 0; i < lines.length; i++) {
        const rawLine = lines[i].trim();
        if (!rawLine) continue;

        // Skip markdown table formatting lines (e.g. |---|---|)
        if (rawLine.startsWith('|') && (rawLine.includes('---') || rawLine.includes(':::'))) {
          continue;
        }

        const lowerLine = rawLine.toLowerCase();
        
        // Section detection
        if (lowerLine.includes('components') && (lowerLine.includes('---') || lowerLine.startsWith('#') || rawLine.endsWith(':'))) {
          currentSection = 'components';
          continue;
        }
        if ((lowerLine.includes('course learning outcomes') || lowerLine.includes('clos')) && (lowerLine.includes('---') || lowerLine.startsWith('#') || rawLine.endsWith(':'))) {
          currentSection = 'clos';
          continue;
        }
        if ((lowerLine.includes('program learning outcomes') || lowerLine.includes('plos')) && (lowerLine.includes('---') || lowerLine.startsWith('#') || rawLine.endsWith(':'))) {
          currentSection = 'plos';
          continue;
        }
        if (lowerLine.includes('clo to plo mapping') && (lowerLine.includes('---') || lowerLine.startsWith('#') || rawLine.endsWith(':'))) {
          currentSection = 'cloplomap';
          continue;
        }
        if ((lowerLine.includes('component to clo weighting') || lowerLine.includes('component to clo mapping') || lowerLine.includes('component to clo weight')) && (lowerLine.includes('---') || lowerLine.startsWith('#') || rawLine.endsWith(':'))) {
          currentSection = 'compclomap';
          continue;
        }
        if (lowerLine.includes('integrations') && (lowerLine.includes('---') || lowerLine.startsWith('#') || rawLine.endsWith(':'))) {
          currentSection = 'integrations';
          continue;
        }

        // Parse key-values in main section
        if (currentSection === '') {
          // Check for line of type "Key: Value" or "Key,Value"
          const colonIndex = rawLine.indexOf(':');
          const commaIndex = rawLine.indexOf(',');
          const splitChar = colonIndex !== -1 ? ':' : (commaIndex !== -1 ? ',' : '');
          
          if (splitChar) {
            const splitIdx = splitChar === ':' ? colonIndex : commaIndex;
            const key = rawLine.substring(0, splitIdx).trim().toLowerCase();
            const val = rawLine.substring(splitIdx + 1).trim();
            if (!val) continue;

            if (key === 'course code' || key === 'code' || key === 'coursecode') {
              tempCourseCode = val;
            } else if (key === 'course name' || key === 'name' || key === 'coursename') {
              tempCourseName = val;
            } else if (key === 'course coordinator' || key === 'coordinator') {
              tempCoordinator = val;
            } else if (key === 'cluster leader' || key === 'leader' || key === 'clusterleader') {
              tempClusterLeader = val;
            }
          }
          continue;
        }

        if (currentSection === 'components') {
          // Format: "Component Name: 30%" or "Component Name,30%" or "Component Name | 30%"
          // Remove table wrappers if copy-pasted as markdown table cell | Midterm | 30% |
          let cleaned = rawLine;
          if (cleaned.startsWith('|') && cleaned.endsWith('|')) {
            cleaned = cleaned.substring(1, cleaned.length - 1).trim();
          }

          let name = '';
          let weight = 0;
          
          if (cleaned.includes('|')) {
            const parts = cleaned.split('|');
            name = parts[0].trim();
            weight = parseInt(parts[1].replace(/%/g, '').trim()) || 0;
          } else if (cleaned.includes(':')) {
            const parts = cleaned.split(':');
            name = parts[0].trim();
            weight = parseInt(parts[1].replace(/%/g, '').trim()) || 0;
          } else if (cleaned.includes(',')) {
            const parts = cleaned.split(',');
            name = parts[0].trim();
            weight = parseInt(parts[1].replace(/%/g, '').trim()) || 0;
          } else {
            // Check if there is a number at the end
            const words = cleaned.split(/\s+/);
            const lastWord = words[words.length - 1];
            const possibleWeight = parseInt(lastWord.replace(/%/g, ''));
            if (!isNaN(possibleWeight)) {
              name = words.slice(0, -1).join(' ').trim();
              weight = possibleWeight;
            }
          }

          if (name && name.toLowerCase() !== 'component' && weight > 0) {
            const id = (tempComponents.length + 1).toString();
            tempComponents.push({ id, name, weight });
          }
          continue;
        }

        if (currentSection === 'clos') {
          // Format: "CLO-1 (Cognitive, C4): Analyze..." or "| CLO-1 | Cognitive | C4 | Analyze..."
          let cleaned = rawLine;
          if (cleaned.startsWith('|') && cleaned.endsWith('|')) {
            cleaned = cleaned.substring(1, cleaned.length - 1).trim();
          }

          let code = '';
          let category = 'Cognitive';
          let level = 'C1';
          let desc = '';

          if (cleaned.includes('|')) {
            const parts = cleaned.split('|');
            code = parts[0].trim();
            if (parts[1]) category = parts[1].trim();
            if (parts[2]) level = parts[2].trim();
            if (parts[3]) desc = parts.slice(3).join('|').trim();
          } else {
            const colonIdx = cleaned.indexOf(':');
            if (colonIdx > 0) {
              const header = cleaned.substring(0, colonIdx).trim();
              desc = cleaned.substring(colonIdx + 1).trim();

              const parenStart = header.indexOf('(');
              const parenEnd = header.indexOf(')');
              if (parenStart > 0 && parenEnd > parenStart) {
                code = header.substring(0, parenStart).trim();
                const inner = header.substring(parenStart + 1, parenEnd);
                const innerParts = inner.split(',');
                if (innerParts[0]) category = innerParts[0].trim();
                if (innerParts[1]) level = innerParts[1].trim();
              } else {
                code = header;
              }
            } else if (cleaned.includes(',')) {
              const parts = cleaned.split(',');
              code = parts[0].trim();
              if (parts[1]) category = parts[1].trim();
              if (parts[2]) level = parts[2].trim();
              if (parts[3]) desc = parts.slice(3).join(',').trim();
            }
          }

          if (code && desc && code.toLowerCase() !== 'clo' && code.toLowerCase() !== 'code') {
            // Standardize Category to Cognitive/Psychomotor/Affective
            let stdCat = 'Cognitive';
            const catLower = category.toLowerCase();
            if (catLower.startsWith('psy') || catLower === 'p') stdCat = 'Psychomotor';
            else if (catLower.startsWith('aff') || catLower === 'a') stdCat = 'Affective';

            const cleanId = code.replace(/[^a-zA-Z0-9]/g, '');
            tempCloList.push({ id: cleanId, code, category: stdCat, level: level.toUpperCase(), desc });
          }
          continue;
        }

        if (currentSection === 'plos') {
          // Format: "PLO-1 (Theory): Apply..." or "| PLO-1 | Theory | Apply..."
          let cleaned = rawLine;
          if (cleaned.startsWith('|') && cleaned.endsWith('|')) {
            cleaned = cleaned.substring(1, cleaned.length - 1).trim();
          }

          let code = '';
          let category = 'Theory';
          let desc = '';

          if (cleaned.includes('|')) {
            const parts = cleaned.split('|');
            code = parts[0].trim();
            if (parts[1]) category = parts[1].trim();
            if (parts[2]) desc = parts.slice(2).join('|').trim();
          } else {
            const colonIdx = cleaned.indexOf(':');
            if (colonIdx > 0) {
              const header = cleaned.substring(0, colonIdx).trim();
              desc = cleaned.substring(colonIdx + 1).trim();

              const parenStart = header.indexOf('(');
              const parenEnd = header.indexOf(')');
              if (parenStart > 0 && parenEnd > parenStart) {
                code = header.substring(0, parenStart).trim();
                category = header.substring(parenStart + 1, parenEnd).trim();
              } else {
                code = header;
              }
            } else if (cleaned.includes(',')) {
              const parts = cleaned.split(',');
              code = parts[0].trim();
              if (parts[1]) category = parts[1].trim();
              if (parts[2]) desc = parts.slice(2).join(',').trim();
            }
          }

          if (code && desc && code.toLowerCase() !== 'plo' && code.toLowerCase() !== 'code') {
            const cleanId = code.replace(/[^a-zA-Z0-9]/g, '');
            tempPloList.push({ id: cleanId, code, category, desc });
          }
          continue;
        }

        if (currentSection === 'cloplomap') {
          // Format: "CLO-1 -> PLO-1" or "CLO-1, PLO-1" or "| CLO-1 | PLO-1 |"
          let cleaned = rawLine;
          if (cleaned.startsWith('|') && cleaned.endsWith('|')) {
            cleaned = cleaned.substring(1, cleaned.length - 1).trim();
          }

          let cloCode = '';
          let ploCode = '';
          if (cleaned.includes('->')) {
            const parts = cleaned.split('->');
            cloCode = parts[0].trim();
            ploCode = parts[1].trim();
          } else if (cleaned.includes('|')) {
            const parts = cleaned.split('|');
            cloCode = parts[0].trim();
            ploCode = parts[1].trim();
          } else if (cleaned.includes(',')) {
            const parts = cleaned.split(',');
            cloCode = parts[0].trim();
            ploCode = parts[1].trim();
          }

          if (cloCode && ploCode && cloCode.toLowerCase() !== 'clo' && ploCode.toLowerCase() !== 'plo') {
            const cloId = cloCode.replace(/[^a-zA-Z0-9]/g, '');
            const ploId = ploCode.replace(/[^a-zA-Z0-9]/g, '');
            tempCloToPlo[`${cloId}_${ploId}`] = true;
          }
          continue;
        }

        if (currentSection === 'compclomap') {
          // Format: "Midterm Exam: CLO-1 (80%), CLO-3 (20%)" or "| Midterm Exam | CLO-1 (80%) | CLO-3 (20%) |"
          let cleaned = rawLine;
          if (cleaned.startsWith('|') && cleaned.endsWith('|')) {
            cleaned = cleaned.substring(1, cleaned.length - 1).trim();
          }

          let compName = '';
          let mappingsRaw = '';

          if (cleaned.includes('|')) {
            const parts = cleaned.split('|');
            compName = parts[0].trim();
            mappingsRaw = parts.slice(1).join(',').trim();
          } else {
            const colonIdx = cleaned.indexOf(':');
            if (colonIdx > 0) {
              compName = cleaned.substring(0, colonIdx).trim();
              mappingsRaw = cleaned.substring(colonIdx + 1).trim();
            }
          }

          if (compName && mappingsRaw) {
            // Find component ID
            let comp = tempComponents.find(c => c.name.toLowerCase() === compName.toLowerCase());
            if (!comp) {
              comp = components.find(c => c.name.toLowerCase() === compName.toLowerCase());
            }

            if (comp) {
              const items = mappingsRaw.split(',');
              items.forEach(item => {
                const parenIdx = item.indexOf('(');
                const parenEndIdx = item.indexOf(')');
                if (parenIdx > 0 && parenEndIdx > parenIdx) {
                  const cloCode = item.substring(0, parenIdx).trim();
                  const weightVal = parseInt(item.substring(parenIdx + 1, parenEndIdx).replace(/%/g, '').trim()) || 0;
                  
                  const cloId = cloCode.replace(/[^a-zA-Z0-9]/g, '');
                  tempCloPlo[`${comp?.id}_${cloId}`] = weightVal;
                }
              });
            }
          }
          continue;
        }

        if (currentSection === 'integrations') {
          const colonIdx = rawLine.indexOf(':');
          if (colonIdx > 0) {
            const key = rawLine.substring(0, colonIdx).trim().toLowerCase();
            const val = rawLine.substring(colonIdx + 1).trim();
            if (!val) continue;

            if (key.includes('cross-course') && !key.includes('details')) {
              tempHasCourseInt = true;
              tempCourseIntNames = val;
            } else if (key.includes('cross-course details') || key.includes('integration details')) {
              tempCourseIntDetails = val;
            } else if (key.includes('vbe t&l') || key.includes('vbe tnl') || key.includes('vbe teaching')) {
              tempHasVbeInt = true;
              tempVbeTnl = val;
            } else if (key.includes('vbe assessment')) {
              tempHasVbeInt = true;
              tempVbeAssess = val;
            } else if (key.includes('esd t&l') || key.includes('esd tnl') || key.includes('esd teaching')) {
              tempHasEsdInt = true;
              tempEsdTnl = val;
            } else if (key.includes('esd assessment')) {
              tempHasEsdInt = true;
              tempEsdAssess = val;
            }
          }
        }
      }

      // 3. Populate state
      let updatedAny = false;
      if (tempCourseCode) { setCourseCode(tempCourseCode); updatedAny = true; }
      if (tempCourseName) { setCourseName(tempCourseName); updatedAny = true; }
      if (tempCoordinator) { setCourseCoordinator(tempCoordinator); updatedAny = true; }
      if (tempClusterLeader) { setClusterLeader(tempClusterLeader); updatedAny = true; }

      if (tempComponents.length > 0) {
        setComponents(tempComponents);
        if (!tempComponents.some(c => c.id === activeRubricCompId)) {
          setActiveRubricCompId(tempComponents[0].id);
        }
        updatedAny = true;
      }
      if (tempCloList.length > 0) { setCloList(tempCloList); updatedAny = true; }
      if (tempPloList.length > 0) { setPloList(tempPloList); updatedAny = true; }
      if (Object.keys(tempCloToPlo).length > 0) { setCloToPloMapping(tempCloToPlo); updatedAny = true; }
      if (Object.keys(tempCloPlo).length > 0) { setCloPloMapping(tempCloPlo); updatedAny = true; }

      if (tempHasCourseInt) {
        setHasCourseIntegration(true);
        setIntegratedCourseNames(tempCourseIntNames);
        setCourseIntegrationDetails(tempCourseIntDetails);
        updatedAny = true;
      }
      if (tempHasVbeInt) {
        setHasVbeIntegration(true);
        setVbeTnlDetails(tempVbeTnl);
        setVbeAssessmentDetails(tempVbeAssess);
        updatedAny = true;
      }
      if (tempHasEsdInt) {
        setHasEsdIntegration(true);
        setEsdTnlDetails(tempEsdTnl);
        setEsdAssessmentDetails(tempEsdAssess);
        updatedAny = true;
      }

      if (updatedAny) {
        addLog("SUCCESS: Parsed and imported Stage 1 Blueprint settings from pasted text.");
        setPreSettingImportStatus({ success: true, message: "Successfully imported Blueprint settings!" });
      } else {
        setPreSettingImportStatus({ success: false, message: "Could not identify any valid configurations. Check formatting." });
      }
    } catch (error: any) {
      addLog(`ERROR: Failed to parse pasted blueprint: ${error.message}`);
      setPreSettingImportStatus({ success: false, message: `Parse error: ${error.message}` });
    }
  };

  // Total assessment weights validation
  const totalWeight = components.reduce((sum, comp) => sum + comp.weight, 0);
  const displayTotal = Math.round(totalWeight * 100) / 100;
  const isDesignValid = Math.abs(totalWeight - 100) < 0.01;

  // Add Component (Stage 1)
  const addComponent = () => {
    const newId = Math.random().toString(36).substring(2, 9);
    setComponents([...components, { id: newId, name: '', weight: 0 }]);
  };

  // Delete Component (Stage 1)
  const deleteComponent = (id: string) => {
    if (components.length <= 1) return;
    setComponents(components.filter(c => c.id !== id));
  };

  // Update Component (Stage 1)
  const updateComponent = (id: string, field: 'name' | 'weight', value: any) => {
    setComponents(prev => prev.map(c => {
      if (c.id === id) {
        if (field === 'weight') {
          const parsed = parseFloat(value);
          return { ...c, weight: isNaN(parsed) ? 0 : Math.max(0, parsed) };
        }
        return { ...c, [field]: value };
      }
      return c;
    }));
  };

  // Save Design Blueprint
  const handleSaveDesign = async () => {
    if (!isDesignValid) return;
    setIsSaving(true);
    setSaveStatus(null);
    addLog(`Initiating save coursework weights configuration for ${courseCode}...`);

    try {
      const response = await fetch('/api/coursework', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SAVE_DESIGN',
          courseName: `${courseCode} - ${courseName}`,
          components,
          cloPloMapping
        })
      });

      const data = await response.json();
      if (response.ok) {
        setSaveStatus({
          success: true,
          message: data.message,
          isSimulated: !!data.simulated
        });
        addLog(`SUCCESS: Coursework weights logged to Sheet. (Simulated: ${!!data.simulated})`);
      } else {
        setSaveStatus({ success: false, message: data.error });
        addLog(`ERROR: Saving failed: ${data.error}`);
      }
    } catch (err: any) {
      setSaveStatus({ success: false, message: 'Network connection failure.' });
      addLog(`ERROR: Network failed to reach Sheets API.`);
    } finally {
      setIsSaving(false);
    }
  };

  // Save Criteria Rubric (Stage 2)
  const handleSaveRubric = async (compId: string) => {
    setIsSaving(true);
    setSaveStatus(null);
    const compName = components.find(c => c.id === compId)?.name || 'Unknown Component';
    addLog(`Initiating save Rubric Matrix for "${compName}"...`);

    const criteria = rubrics[compId] || [];
    const totalCritWeight = criteria.reduce((sum, c) => sum + c.weight, 0);

    if (Math.abs(totalCritWeight - 100) > 0.01 && criteria.length > 0) {
      setSaveStatus({
        success: false,
        message: `Critieria weights must equal 100%. Currently it is ${totalCritWeight}%.`
      });
      setIsSaving(false);
      addLog(`WARNING: Rubric save rejected. Criteria weights sum to ${totalCritWeight}%, not 100%`);
      return;
    }

    try {
      const response = await fetch('/api/coursework', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SAVE_RUBRIC',
          courseName: `${courseCode} - ${courseName}`,
          componentId: compId,
          componentName: compName,
          rubrics: criteria
        })
      });

      const data = await response.json();
      if (response.ok) {
        setSaveStatus({
          success: true,
          message: data.message,
          isSimulated: !!data.simulated
        });
        addLog(`SUCCESS: Rubric for "${compName}" saved to Sheets db. (Simulated: ${!!data.simulated})`);
      } else {
        setSaveStatus({ success: false, message: data.error });
        addLog(`ERROR: Saving rubric failed: ${data.error}`);
      }
    } catch (err) {
      setSaveStatus({ success: false, message: 'Network connection failure.' });
      addLog(`ERROR: Sheets API connection timed out.`);
    } finally {
      setIsSaving(false);
    }
  };

  // Add Criteria to Rubric (Stage 2)
  const addRubricCriteria = (compId: string) => {
    const defaultLevels: RubricLevel[] = [
      { score: 1, label: 'Unsatisfactory', desc: 'Failed to demonstrate core competency.' },
      { score: 2, label: 'Developing', desc: 'Demonstrates baseline outcomes with minor errors.' },
      { score: 3, label: 'Proficient', desc: 'Fully compliant expected outcomes.' },
      { score: 4, label: 'Advanced', desc: 'Exceeds target with solid analysis.' },
      { score: 5, label: 'Outstanding', desc: 'Exceptional details exceeding specs.' }
    ];

    const currentList = rubrics[compId] || [];
    const newId = Math.random().toString(36).substring(2, 9);
    
    setRubrics({
      ...rubrics,
      [compId]: [
        ...currentList,
        {
          id: newId,
          name: 'New Assessment Criteria',
          weight: currentList.length === 0 ? 100 : 0,
          levels: defaultLevels
        }
      ]
    });
    setSaveStatus(null);
  };

  // Delete Criteria (Stage 2)
  const deleteRubricCriteria = (compId: string, criteriaId: string) => {
    const list = rubrics[compId] || [];
    setRubrics({
      ...rubrics,
      [compId]: list.filter(c => c.id !== criteriaId)
    });
    setSaveStatus(null);
  };

  // Update Criteria Content (Stage 2)
  const updateCriteriaValue = (compId: string, critId: string, field: 'name' | 'weight', value: any) => {
    const list = rubrics[compId] || [];
    const updated = list.map(c => {
      if (c.id === critId) {
        if (field === 'weight') {
          const num = parseFloat(value);
          return { ...c, weight: isNaN(num) ? 0 : Math.max(0, num) };
        }
        return { ...c, [field]: value };
      }
      return c;
    });
    setRubrics({ ...rubrics, [compId]: updated });
  };

  // Update Descriptor Text (Stage 2)
  const updateCriteriaLevelDesc = (compId: string, critId: string, levelScore: number, descText: string) => {
    const list = rubrics[compId] || [];
    const updated = list.map(c => {
      if (c.id === critId) {
        return {
          ...c,
          levels: c.levels.map(l => l.score === levelScore ? { ...l, desc: descText } : l)
        };
      }
      return c;
    });
    setRubrics({ ...rubrics, [compId]: updated });
  };

  // Drive Folder Structure Provisioning (Stage 3)
  const handleProvisionDrive = async () => {
    setProvisionState(prev => ({ ...prev, isLoading: true }));
    addLog(`Requesting Google Drive API to provision folder architecture for course: ${courseCode}...`);
    
    try {
      const response = await fetch('/api/coursework', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'PROVISION_DRIVE',
          courseCode,
          components: components.map(c => c.name),
          shareEmail: driveShareEmail
        })
      });

      const data = await response.json();
      if (response.ok) {
        setProvisionState({
          provisioned: true,
          folderLinks: data.folderLinks,
          isLoading: false
        });
        addLog(`SUCCESS: Google Drive structures generated. (Simulated: ${!!data.simulated})`);
        addLog(`Provisioned parent directory folder and ${components.length} component subfolders.`);
      } else {
        setProvisionState(prev => ({ ...prev, isLoading: false }));
        addLog(`ERROR: Drive folder creation failed: ${data.error}`);
      }
    } catch (err) {
      setProvisionState(prev => ({ ...prev, isLoading: false }));
      addLog(`ERROR: Network failed to request Drive provisioning.`);
    }
  };

  // Simulate Google Form Responses submission (Stage 3)
  const handleSimulateSubmissions = () => {
    if (!provisionState.provisioned) {
      alert("Please provision Google Drive Folders first to bind submissions!");
      return;
    }
    
    setIsSimulatingSubmissions(true);
    addLog(`Listening to Google Form webhook hooks/syncing response Sheet database...`);
    
    let studentIdx = 0;
    const interval = setInterval(() => {
      if (studentIdx >= students.length) {
        clearInterval(interval);
        setIsSimulatingSubmissions(false);
        setSubmissionsSimulated(true);
        addLog(`SUCCESS: Google Form responses synchronized. Seeded folder links for ${students.length} students.`);
        return;
      }
      
      const stud = students[studentIdx];
      // Generate a mock submission PDF file inside the component folder
      const parentFolderLink = provisionState.folderLinks['Parent Course Folder'] || '';
      const driveSubmissionLink = `${parentFolderLink}/submissions/${stud.id}_portfolio_v1.pdf`;
      
      setStudents(prev => prev.map(s => {
        if (s.id === stud.id) {
          return {
            ...s,
            submissionLink: driveSubmissionLink
          };
        }
        return s;
      }));
      
      addLog(`Synced Form Submission from student: ${stud.name} (${stud.id}) -> bound PDF: ${driveSubmissionLink}`);
      studentIdx++;
    }, 450);
  };

  // Interactive Scoring click (Stage 4)
  const handleGradingLevelClick = (critId: string, levelScore: number) => {
    setCurrentGradingRubric(prev => prev.map(c => {
      if (c.id === critId) {
        return { ...c, selectedLevel: levelScore };
      }
      return c;
    }));
  };

  // Save Graded Student Score (Stage 4)
  const handleSaveStudentGrade = () => {
    const ungraded = currentGradingRubric.filter(c => c.selectedLevel === null || c.selectedLevel === undefined);
    if (ungraded.length > 0) {
      alert(`Please grade all rubrics criteria first! Ungraded items: ${ungraded.map(u => u.name).join(', ')}`);
      return;
    }

    let compPercentage = 0;
    currentGradingRubric.forEach(crit => {
      const maxScore = Math.max(...crit.levels.map(l => l.score));
      const scoreFraction = (crit.selectedLevel || 0) / maxScore;
      const weightedContribution = scoreFraction * crit.weight;
      compPercentage += weightedContribution;
    });

    const calculatedScore = Math.round(compPercentage * 100) / 100;

    if (!enableDoubleMarking) {
      commitFinalComponentGrade(selectedStudentId, activeGradingCompId, calculatedScore);
      addLog(`Graded Student ${selectedStudentId} on component [${activeGradingCompId}]: Calculated score ${calculatedScore}%`);
    } else {
      const currentStudentGrades = markerGrades[selectedStudentId] || {};
      const compGrading = currentStudentGrades[activeGradingCompId] || {};
      
      const newCompGrading = { ...compGrading };
      if (activeMarker === 'Marker A') {
        newCompGrading.markerAScore = calculatedScore;
      } else {
        newCompGrading.markerBScore = calculatedScore;
      }

      let autoFinalScore: number | undefined = undefined;
      const markerA = newCompGrading.markerAScore;
      const markerB = newCompGrading.markerBScore;

      if (markerA !== undefined && markerB !== undefined) {
        const variance = Math.abs(markerA - markerB);
        if (variance <= 10) {
          autoFinalScore = Math.round(((markerA + markerB) / 2) * 100) / 100;
        }
      }

      const newMarkerGrades = {
        ...markerGrades,
        [selectedStudentId]: {
          ...currentStudentGrades,
          [activeGradingCompId]: newCompGrading
        }
      };

      setMarkerGrades(newMarkerGrades);

      if (autoFinalScore !== undefined) {
        commitFinalComponentGrade(selectedStudentId, activeGradingCompId, autoFinalScore);
        addLog(`Double Grading updated for ${selectedStudentId} [${activeGradingCompId}]: Marker A: ${markerA}%, Marker B: ${markerB}%. Auto-Reconciled to: ${autoFinalScore}%`);
      } else if (markerA !== undefined && markerB !== undefined) {
        addLog(`Conflict recorded for ${selectedStudentId} [${activeGradingCompId}]: Marker A: ${markerA}%, Marker B: ${markerB}%. Variance exceeds 10% threshold. Awaiting moderator resolution.`);
      } else {
        addLog(`Saved ${activeMarker} score (${calculatedScore}%) for student ${selectedStudentId} [${activeGradingCompId}]. Awaiting next marker...`);
      }
    }
  };

  const commitFinalComponentGrade = (studId: string, compId: string, finalScore: number) => {
    setStudents(prev => prev.map(s => {
      if (s.id === studId) {
        const newGrades = {
          ...s.grades,
          [compId]: finalScore
        };

        let finalWeighted = 0;
        let activeWeightsSum = 0;
        components.forEach(comp => {
          const compGrade = newGrades[comp.id];
          if (compGrade !== undefined) {
            finalWeighted += (compGrade / 100) * comp.weight;
            activeWeightsSum += comp.weight;
          }
        });
        
        const finalMark = activeWeightsSum > 0 ? Math.round((finalWeighted * (100 / activeWeightsSum)) * 100) / 100 : 0;

        return {
          ...s,
          status: Object.keys(newGrades).length === components.length ? 'Graded' : 'Pending',
          grades: newGrades,
          finalMark
        };
      }
      return s;
    }));
  };

  const handlePasteSpreadsheetRow = (critId: string, clipboardText: string) => {
    if (!clipboardText) return;
    const parts = clipboardText.split('\t');
    if (parts.length < 2) return;

    const name = parts[0]?.trim();
    const weightNum = parseFloat(parts[1]?.trim());
    const weight = isNaN(weightNum) ? 0 : weightNum;

    const list = rubrics[activeRubricCompId] || [];
    const updated = list.map(c => {
      if (c.id === critId) {
        const newLevels = c.levels.map(l => {
          const partIdx = 2 + (l.score - 1);
          const newDesc = parts[partIdx] ? parts[partIdx].trim() : l.desc;
          return { ...l, desc: newDesc };
        });
        return {
          ...c,
          name: name || c.name,
          weight: weight || c.weight,
          levels: newLevels
        };
      }
      return c;
    });

    setRubrics({ ...rubrics, [activeRubricCompId]: updated });
    addLog(`SUCCESS: Parsed spreadsheet row for criteria "${name || critId}".`);
  };

  const handleBulkPaste = () => {
    if (!bulkPasteText.trim()) return;
    const lines = bulkPasteText.split('\n');
    const newCriteriaList: RubricCriteria[] = [];

    lines.forEach((line, idx) => {
      const parts = line.split('\t');
      if (parts.length < 2) return;
      
      const name = parts[0]?.trim();
      const weightNum = parseFloat(parts[1]?.trim());
      const weight = isNaN(weightNum) ? 20 : weightNum;

      const defaultLevels = [
        { score: 1, label: 'Unacceptable', desc: parts[2]?.trim() || 'Descriptor L1...' },
        { score: 2, label: 'Developing', desc: parts[3]?.trim() || 'Descriptor L2...' },
        { score: 3, label: 'Expected Domain', desc: parts[4]?.trim() || 'Descriptor L3...' },
        { score: 4, label: 'Advanced', desc: parts[5]?.trim() || 'Descriptor L4...' },
        { score: 5, label: 'Outstanding', desc: parts[6]?.trim() || 'Descriptor L5...' }
      ];

      newCriteriaList.push({
        id: `CRIT_${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
        name: name || `Criteria ${idx + 1}`,
        weight,
        levels: defaultLevels
      });
    });

    if (newCriteriaList.length > 0) {
      const currentList = rubrics[activeRubricCompId] || [];
      setRubrics({
        ...rubrics,
        [activeRubricCompId]: [...currentList, ...newCriteriaList]
      });
      addLog(`SUCCESS: Bulk-imported ${newCriteriaList.length} criteria from spreadsheet paste.`);
      setBulkPasteText('');
      setIsBulkPasteOpen(false);
    }
  };

  const handleDownloadSpreadsheetTemplate = () => {
    const headers = [
      'Criteria Name',
      'Weight (%)',
      'Level 1 Descriptor (Unacceptable)',
      'Level 2 Descriptor (Developing)',
      'Level 3 Descriptor (Expected Domain)',
      'Level 4 Descriptor (Advanced)',
      'Level 5 Descriptor (Outstanding)'
    ];
    const rowSample = [
      'Technical Design',
      '25',
      'Poor design, lacks core components and structure.',
      'Basic design is present but has several flaws.',
      'Expected domain level: correct architecture matching the scenario specifications.',
      'Advanced implementation details exceed expected structures.',
      'Outstanding master level: flawless design and fully optimized components.'
    ];
    const csvContent = [headers.join(','), rowSample.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "KLUST_Rubric_Template.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addLog(`SUCCESS: Downloaded Google Sheets/Excel CSV Rubrics Template.`);
  };

  const handlePrintPdf = () => {
    window.print();
    addLog(`SUCCESS: Opened browser print dialog for Active Stage: ${activeStage}`);
  };

  // Sync Grades to Sheets (Stage 4)
  const handleSyncGradesToSheets = async () => {
    setIsSaving(true);
    setSaveStatus(null);
    addLog(`Syncing master grade sheets to Google Sheets endpoint...`);

    const gradesPayload = students.map(s => ({
      studentId: s.id,
      studentName: s.name,
      grades: s.grades,
      finalMark: s.finalMark || 0
    }));

    try {
      const response = await fetch('/api/coursework', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SAVE_GRADES',
          courseName: `${courseCode} - ${courseName}`,
          grades: gradesPayload
        })
      });

      const data = await response.json();
      if (response.ok) {
        setSaveStatus({
          success: true,
          message: data.message,
          isSimulated: !!data.simulated
        });
        addLog(`SUCCESS: Sync complete. Gradebook pushed to Sheets workbook. (Simulated: ${!!data.simulated})`);
      } else {
        setSaveStatus({ success: false, message: data.error });
        addLog(`ERROR: Grade sync failed: ${data.error}`);
      }
    } catch (err) {
      setSaveStatus({ success: false, message: 'Sync connection failed.' });
      addLog(`ERROR: Network failed to sync grades.`);
    } finally {
      setIsSaving(false);
    }
  };

  // Automated Sampling Engine (Stage 5)
  // Moderate student sampling rules
  const getSampledList = () => {
    // Filter graded students
    const graded = students.filter(s => s.finalMark !== undefined && s.finalMark > 0);
    if (graded.length === 0) return [];

    // Sort by final marks ascending
    const sorted = [...graded].sort((a, b) => (a.finalMark || 0) - (b.finalMark || 0));

    if (samplingRule === 'tmb') {
      // Top, Mid, Bottom sampling (3 Top, 3 Mid, 3 Bottom = 9 candidates)
      if (sorted.length <= 9) return sorted;
      
      const top3 = sorted.slice(-3).reverse();
      const bottom3 = sorted.slice(0, 3);
      
      // Extract 3 from the middle tier (excluding the top 3 and bottom 3 to avoid duplicates)
      const remaining = sorted.slice(3, -3);
      let mid3: Student[] = [];
      if (remaining.length >= 3) {
        const midIdx = Math.floor(remaining.length / 2);
        mid3 = remaining.slice(midIdx - 1, midIdx + 2);
      } else {
        mid3 = remaining;
      }

      return [...top3, ...mid3, ...bottom3];
    } else if (samplingRule === 'random') {
      // Return 9 random samples
      const count = Math.min(9, sorted.length);
      const shuffled = [...sorted].sort(() => 0.5 - Math.random());
      return shuffled.slice(0, count);
    } else {
      // Clustered samples (average scorers - cluster of 9 around middle)
      const midIdx = Math.floor(sorted.length / 2);
      const start = Math.max(0, midIdx - 4);
      const end = Math.min(sorted.length, start + 9);
      return sorted.slice(start, end);
    }
  };

  const sampledList = getSampledList();

  // Export Moderation Pack (Stage 5)
  const handleExportSampling = async () => {
    if (sampledList.length === 0) {
      alert("No graded students available to compile samples! Please grade students in Stage 4 first.");
      return;
    }

    setIsCompilingSample(true);
    setSampleExportStatus(null);
    addLog(`Creating Moderator package audit files for ${sampledList.length} sampled students...`);

    const payload = {
      action: 'EXPORT_SAMPLING',
      courseName: `${courseCode} - ${courseName}`,
      samplingRule,
      sampledStudentIds: sampledList.map(s => s.id),
      samples: sampledList.map(s => ({
        id: s.id,
        name: s.name,
        grades: s.grades,
        finalMark: s.finalMark,
        auditFile: s.submissionLink || 'None'
      }))
    };

    try {
      const response = await fetch('/api/coursework', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (response.ok) {
        const parentFolder = provisionState.folderLinks['Parent Course Folder'] || 'https://drive.google.com/drive';
        const modFolder = `${parentFolder}/ModeratorPack_Audit`;
        setSampleExportStatus(modFolder);
        addLog(`SUCCESS: Moderator packs structured inside Drive. (Simulated: ${!!data.simulated})`);
        addLog(`Audit folders created: /ModeratorPack_Audit containing marksheet extracts, rubrics criteria sheets, and submission PDFs.`);
      } else {
        addLog(`ERROR: Export failed: ${data.error}`);
      }
    } catch (err) {
      addLog(`ERROR: Network failed to log moderation pack.`);
    } finally {
      setIsCompilingSample(false);
    }
  };

  // Fill scores helper for demonstration
  const handleAutoGradeAll = () => {
    addLog(`Triggering auto-grading simulation across the student roster...`);
    const newStudents = students.map(s => {
      const grades: Record<string, number> = {};
      let finalWeighted = 0;
      components.forEach(comp => {
        // Seed a random score between 55 and 98
        const score = Math.round(55 + Math.random() * 43);
        grades[comp.id] = score;
        finalWeighted += (score / 100) * comp.weight;
      });

      return {
        ...s,
        status: 'Graded' as const,
        grades,
        finalMark: Math.round(finalWeighted * 100) / 100
      };
    });
    setStudents(newStudents);
    addLog(`SUCCESS: Auto-graded all 10 students with randomized compliant profiles.`);
  };

  // Google Form Proposer Blueprint Calculations
  const compForForm = components.find(c => c.id === selectedFormCompId);
  let detectedFormType: 'quiz' | 'test_exam' | 'assignment' = 'assignment';
  if (compForForm) {
    const nameLower = compForForm.name.toLowerCase();
    if (nameLower.includes('quiz')) {
      detectedFormType = 'quiz';
    } else if (nameLower.includes('test') || nameLower.includes('exam') || nameLower.includes('midterm')) {
      detectedFormType = 'test_exam';
    } else {
      detectedFormType = 'assignment';
    }
  }
  const finalFormType = formTemplateTypeOverride === 'auto' ? detectedFormType : (formTemplateTypeOverride as any);

  // Proposed structure specs generator
  const getProposedFormBlueprint = (name: string, type: 'quiz' | 'test_exam' | 'assignment'): FormBlueprint => {
    if (type === 'quiz') {
      return {
        title: `${courseCode} - ${name} (Quiz Form)`,
        desc: "Automated Self-Graded Quiz. Ensure 'Release grades immediately' and 'Make this a quiz' are checked in your Google Form settings.",
        sections: [
          {
            name: "Section 1: Candidate Verification",
            fields: [
              { label: "Student Roster Name", type: "Short Answer", req: true, note: "Input your full name exactly as it appears in student records." },
              { label: "Student ID Number", type: "Short Answer", req: true, note: "Example: S101" },
              { label: "Email Address", type: "Short Answer", req: true, note: "E.g. alice.tan@university.edu" }
            ]
          },
          {
            name: "Section 2: Interactive Concept Questions (20 pts per question)",
            fields: [
              { label: "Q1: Which architecture is implemented by CourseArchitect's routing engine?", type: "Multiple Choice", options: ["A) Next.js App Router (Answer Key)", "B) Express.js MVC", "C) Angular SPA Template", "D) Python Flask Blueprint"], req: true, points: 20 },
              { label: "Q2: Google Sheets API requires which credential format to initialize server authorization?", type: "Multiple Choice", options: ["A) Browser cookies", "B) Service Account JSON private key (Answer Key)", "C) Simple API Key string", "D) User Client OAuth code"], req: true, points: 20 },
              { label: "Q3: In quality assurance moderations, what does sampling moderate packs inspect?", type: "Multiple Choice", options: ["A) Roster attendance sheets", "B) Top, Mid, and Bottom grade portfolios (Answer Key)", "C) Direct developer commits", "D) Program accreditation fees"], req: true, points: 20 },
              { label: "Q4: A coursework weights layout must compile to what validation sum?", type: "Multiple Choice", options: ["A) 75%", "B) 80%", "C) 100% (Answer Key)", "D) 120%"], req: true, points: 20 },
              { label: "Q5: Which HTTP verb triggers spreadsheet updates under the coursework routing API?", type: "Multiple Choice", options: ["A) GET", "B) POST (Answer Key)", "C) OPTIONS", "D) DELETE"], req: true, points: 20 }
            ]
          }
        ],
        settings: [
          { key: "Make this a quiz", val: "ENABLED (self-scoring keys)" },
          { key: "Collect email addresses", val: "VERIFIED (restricts to roster)" },
          { key: "Limit to 1 response", val: "ENABLED (prevents double submits)" },
          { key: "Release marks", val: "Immediately after each submit" }
        ]
      };
    } else if (type === 'test_exam') {
      return {
        title: `${courseCode} - ${name} (Structured Test)`,
        desc: "Midterm / End-semester examination sheet. Integrity verification and scanner upload portal. Make sure you upload a single compiled PDF of your handwritings.",
        sections: [
          {
            name: "Section 1: Integrity Declaration & Registration",
            fields: [
              { label: "Full Name & Student ID", type: "Short Answer", req: true, note: "Matches roster data" },
              { label: "Honor Code Agreement", type: "Checkboxes", options: ["I declare that this exam is my own individual work, completed without external aid, bots, or collusion. (Required)"], req: true }
            ]
          },
          {
            name: "Section 2: Part A - Multiple Choice Verification (20 pts)",
            fields: [
              { label: "Q1: Explain the primary feature of Turbopack in Next.js build compilation.", type: "Multiple Choice", options: ["A) Slower dev boot times", "B) Incremental hot module reloading (Answer Key)", "C) Serverless cold start delay", "D) Automatic Google Drive uploads"], req: true, points: 10 },
              { label: "Q2: Under top/mid/bottom audit drawing, how is the median sample selected?", type: "Multiple Choice", options: ["A) The candidate closest to average final marks (Answer Key)", "B) The student with highest alphabet name", "C) A completely random pick", "D) The student who submitted first"], req: true, points: 10 }
            ]
          },
          {
            name: "Section 3: Part B - Written Calculations Scan (80 pts)",
            fields: [
              { label: "Upload handwritten working scans (Q3-Q6)", type: "File Upload", req: true, note: `Allowed format: PDF only. Max size: 100MB. Routed into Drive /CourseArchitect - ${courseCode}/ subfolder.` }
            ]
          }
        ],
        settings: [
          { key: "Make this a quiz", val: "ENABLED (automated Part A, manual Part B)" },
          { key: "Responses collection", val: "VERIFIED (required university domain login)" },
          { key: "Limit to 1 response", val: "ENABLED (final lock)" },
          { key: "Release marks", val: "Later, after manual assessment & moderation" }
        ]
      };
    } else {
      return {
        title: `${courseCode} - ${name} Submission Portal`,
        desc: "Upload portal for coursework items, homework submissions, and final project deliverables. Ensure folders are named following specifications.",
        sections: [
          {
            name: "Section 1: Student Registry",
            fields: [
              { label: "Full Name", type: "Short Answer", req: true },
              { label: "Student ID (e.g. S103)", type: "Short Answer", req: true }
            ]
          },
          {
            name: "Section 2: Work Deliverables",
            fields: [
              { label: "Upload Portfolio Artifacts / Source code zip file", type: "File Upload", req: true, note: "Limit to PDF/ZIP. Max file size: 100MB. Routed to Drive parent folder." },
              { label: "Repository URL link (Optional)", type: "Short Answer", req: false, note: "Git repository link for coding assignments" }
            ]
          }
        ],
        settings: [
          { key: "Make this a quiz", val: "DISABLED (manual rubric assessment)" },
          { key: "Responses collection", val: "Collect verified emails" },
          { key: "Limit to 1 response", val: "ENABLED (allows updates until cutoff)" }
        ]
      };
    }
  };

  const getTabColorClasses = (id: string, active: boolean) => {
    if (!active) {
      return isLightMode 
        ? 'bg-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50' 
        : 'bg-transparent text-slate-455 text-slate-400 hover:text-slate-200 hover:bg-slate-900/40';
    }
    
    switch (id) {
      case 'pre_setting':
        return isLightMode
          ? 'bg-sky-100/90 text-sky-850 border-sky-300 border shadow-lg shadow-sky-500/10'
          : 'bg-sky-950/60 text-sky-300 border-sky-500/30 border shadow-lg shadow-sky-500/10';
      case 'design_brief_rubrics':
        return isLightMode
          ? 'bg-violet-100/90 text-violet-850 border-violet-300 border shadow-lg shadow-violet-500/10'
          : 'bg-violet-950/60 text-violet-300 border-violet-500/30 border shadow-lg shadow-violet-500/10';
      case 'distribution':
        return isLightMode
          ? 'bg-amber-100/90 text-amber-850 border-amber-300 border shadow-lg shadow-amber-500/10'
          : 'bg-amber-950/60 text-amber-300 border-amber-500/30 border shadow-lg shadow-amber-500/10';
      case 'grading':
        return isLightMode
          ? 'bg-rose-100/90 text-rose-850 border-rose-300 border shadow-lg shadow-rose-500/10'
          : 'bg-rose-950/60 text-rose-300 border-rose-500/30 border shadow-lg shadow-rose-500/10';
      case 'sampling':
        return isLightMode
          ? 'bg-emerald-100/90 text-emerald-850 border-emerald-300 border shadow-lg shadow-emerald-500/10'
          : 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30 border shadow-lg shadow-emerald-500/10';
      default:
        return '';
    }
  };

  const formBlueprint = getProposedFormBlueprint(compForForm?.name || 'Assessment Component', finalFormType);

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-all duration-200 ${isLightMode ? 'light-theme' : 'bg-slate-950 text-slate-100 dark-theme-dotto'}`}>
      
      {/* Light Theme Styles Override */}
      <style>{`
        .light-theme {
          background-color: #f8fafc !important;
          background-image: radial-gradient(rgba(15, 23, 42, 0.07) 1px, transparent 1px) !important;
          background-size: 16px 16px !important;
          color: #0f172a !important;
        }
        .dark-theme-dotto {
          background-color: #020617 !important;
          background-image: radial-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px) !important;
          background-size: 16px 16px !important;
        }
        .light-theme header,
        .light-theme footer {
          background-color: #ffffff !important;
          border-color: #e2e8f0 !important;
        }
        .light-theme header span.text-white,
        .light-theme header span.text-lg,
        .light-theme h2.text-white,
        .light-theme h3.text-white,
        .light-theme span.text-slate-200,
        .light-theme span.text-slate-300,
        .light-theme td.text-slate-300,
        .light-theme label.text-slate-300,
        .light-theme th.text-slate-300 {
          color: #0f172a !important;
        }
        .light-theme p.text-slate-400,
        .light-theme span.text-slate-400,
        .light-theme select.text-slate-400,
        .light-theme span.text-slate-500,
        .light-theme label.text-slate-500,
        .light-theme p.text-slate-500 {
          color: #475569 !important;
        }
        .light-theme .bg-slate-900\\/40,
        .light-theme .bg-slate-900\\/20 {
          background-color: #ffffff !important;
          border-color: #e2e8f0 !important;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.04), 0 8px 10px -6px rgba(0, 0, 0, 0.04) !important;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .light-theme .bg-slate-900\\/40:hover,
        .light-theme .bg-slate-900\\/20:hover {
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.06), 0 10px 10px -6px rgba(0, 0, 0, 0.06) !important;
          transform: translateY(-2px);
        }
        .bg-slate-900\\/40,
        .bg-slate-900\\/20 {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .bg-slate-900\\/40:hover,
        .bg-slate-900\\/20:hover {
          transform: translateY(-2px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.35), 0 10px 10px -6px rgba(0, 0, 0, 0.35) !important;
        }
        .light-theme .border-slate-900,
        .light-theme .border-slate-900\\/80,
        .light-theme .border-slate-900\\/60,
        .light-theme .border-slate-800 {
          border-color: #e2e8f0 !important;
        }
        .light-theme .bg-slate-950,
        .light-theme .bg-slate-950\\/80,
        .light-theme .bg-slate-950\\/60,
        .light-theme .bg-slate-950\\/40 {
          background-color: #f1f5f9 !important;
          border-color: #cbd5e1 !important;
          color: #0f172a !important;
        }
        .light-theme input,
        .light-theme select,
        .light-theme textarea {
          background-color: #ffffff !important;
          border-color: #cbd5e1 !important;
          color: #0f172a !important;
        }
        .light-theme input:focus,
        .light-theme select:focus,
        .light-theme textarea:focus {
          border-color: #6366f1 !important;
          outline: none !important;
        }
        .light-theme .text-slate-200,
        .light-theme .text-slate-300,
        .light-theme .text-slate-400 {
          color: #334155 !important;
        }
        .light-theme .bg-slate-900 {
          background-color: #e2e8f0 !important;
          color: #334155 !important;
        }
        .light-theme .border-indigo-500\\/10,
        .light-theme .border-indigo-500\\/15 {
          border-color: #c7d2fe !important;
        }
        .light-theme .bg-indigo-950\\/10 {
          background-color: #e0e7ff !important;
          color: #3730a3 !important;
        }
        .light-theme .text-indigo-300 {
          color: #4338ca !important;
        }
        .light-theme .bg-violet-500\\/10 {
          background-color: #f3e8ff !important;
        }
        .light-theme .text-violet-300 {
          color: #6b21a8 !important;
        }
        .light-theme .bg-emerald-500\\/5 {
          background-color: #ecfdf5 !important;
          color: #065f46 !important;
        }
        .light-theme .text-emerald-300 {
          color: #047857 !important;
        }
        .light-theme .border-emerald-500\\/15 {
          border-color: #a7f3d0 !important;
        }
        .light-theme .bg-rose-500\\/10 {
          background-color: #fee2e2 !important;
          color: #991b1b !important;
        }
        .light-theme .text-rose-400 {
          color: #b91c1c !important;
        }
        .light-theme .text-indigo-400 {
          color: #4f46e5 !important;
        }
        .light-theme .text-slate-600 {
          color: #64748b !important;
        }
        .light-theme .bg-transparent {
          background-color: transparent !important;
        }
        .light-theme option {
          background-color: #ffffff !important;
          color: #0f172a !important;
        }
        .light-theme .shadow-lg {
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -4px rgba(0, 0, 0, 0.05) !important;
        }
        @media print {
          .print-footer {
            position: fixed;
            bottom: 0.5cm;
            left: 0;
            right: 0;
            text-align: center;
            font-size: 8px !important;
            font-family: monospace !important;
            color: #475569 !important;
            border-top: 1px solid #cbd5e1 !important;
            padding-top: 6px !important;
          }
          .print-page-break {
            break-before: page !important;
            page-break-before: always !important;
          }
          body {
            margin-bottom: 1.5cm;
          }
        }
      `}</style>
      
      {/* Top Navbar */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4 print:hidden">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight text-white">KLUST Assessment Manager</span>
              <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                v2.1-Workspace
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 md:gap-6">
            <Link href="/" className="text-xs font-semibold text-slate-400 hover:text-white uppercase tracking-wider transition-colors">
              ← Dashboard
            </Link>

            <button
              type="button"
              onClick={handlePrintPdf}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow transition-all cursor-pointer flex items-center gap-1.5 print:hidden"
              title="Print formal report of current stage to PDF"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print PDF</span>
            </button>
            
            <div className="h-6 w-px bg-slate-950/40"></div>

            {/* UX Controls */}
            <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-900 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setIsLightMode(!isLightMode)}
                className={`p-2 rounded-lg transition-all cursor-pointer ${
                  isLightMode 
                    ? 'bg-amber-500/10 text-amber-600' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-850'
                }`}
                title={isLightMode ? "Switch to Dark Mode" : "Switch to Light Mode"}
              >
                {isLightMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </button>

              <button
                type="button"
                onClick={() => setIsSidebarVisible(!isSidebarVisible)}
                className={`p-2 rounded-lg transition-all cursor-pointer ${
                  isSidebarVisible 
                    ? 'bg-indigo-500/10 text-indigo-400' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-850'
                }`}
                title={isSidebarVisible ? "Hide Workspace Status" : "Show Workspace Status"}
              >
                {isSidebarVisible ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
            </div>

            <div className="h-6 w-px bg-slate-900"></div>

            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
              <span className="text-xs font-mono text-indigo-300 uppercase tracking-widest">{courseCode} - {semester}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 flex flex-col lg:flex-row gap-8 print:hidden">
        
        {/* Left Workspace Panel */}
        <div className={`flex-grow flex flex-col gap-6 transition-all duration-300 ${isSidebarVisible ? 'lg:max-w-[70%]' : 'w-full'}`}>
          
          {/* Navigation Wizard Header */}
          <div className="bg-slate-900/40 border border-slate-900/80 rounded-2xl p-2.5 flex flex-wrap gap-1.5 backdrop-blur-sm">
            {[
              { id: 'pre_setting', label: '1. Pre Setting', icon: Settings },
              { id: 'design_brief_rubrics', label: '2. Design & Rubrics', icon: FileSpreadsheet },
              { id: 'distribution', label: '3. Distribution', icon: FolderOpen },
              { id: 'grading', label: '4. Grading', icon: FileCheck },
              { id: 'sampling', label: '5. Sampling', icon: ShieldCheck }
            ].map((step) => {
              const StepIcon = step.icon;
              const isActive = activeStage === step.id;
              return (
                <button
                  key={step.id}
                  onClick={() => handleStageChange(step.id as any)}
                  className={`flex-1 min-w-[110px] flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    getTabColorClasses(step.id, isActive)
                  }`}
                >
                  <StepIcon className="h-4 w-4" />
                  <span>{step.label}</span>
                </button>
              );
            })}
          </div>

          {/* DYNAMIC STAGE CONTAINER */}
          <div className="flex-grow">
            
            {/* STAGE 1: Pre Setting Assessment Workspace */}
            {activeStage === 'pre_setting' && (
              <div className="flex flex-col gap-6 animate-fadeIn">

                {/* BULK BLUEPRINT PASTE & IMPORT TOOL */}
                <div className="bg-slate-900/40 border border-slate-900 rounded-2xl overflow-hidden relative">
                  <div className="absolute right-4 top-4 text-indigo-500/10 opacity-30 select-none pointer-events-none">
                    <Sparkles className="h-24 w-24" />
                  </div>

                  {/* Header Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsPreSettingImportOpen(!isPreSettingImportOpen);
                      setPreSettingImportStatus(null);
                    }}
                    className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 cursor-pointer text-left hover:bg-slate-900/30 transition-colors"
                  >
                    <div>
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                        <Sparkles className="h-3 w-3 animate-pulse" />
                        Smart Course Blueprint Importer
                      </span>
                      <h2 className="text-lg font-bold text-white mt-1">Paste Coursework Configuration</h2>
                      <p className="text-slate-400 text-[10px] mt-0.5 leading-relaxed">
                        Paste data in CSV, key-value text, markdown tables, or JSON to automatically configure this course's profile, CLOs, PLOs, and mappings.
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded border ${
                        isPreSettingImportOpen
                          ? 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400'
                          : 'border-slate-800 bg-slate-950 text-slate-500'
                      }`}>
                        {isPreSettingImportOpen ? 'Opened Importer' : 'Click to Import'}
                      </span>
                      <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                        isPreSettingImportOpen ? 'rotate-180' : ''
                      }`} />
                    </div>
                  </button>

                  {/* Body Content */}
                  {isPreSettingImportOpen && (
                    <div className="px-6 pb-6 flex flex-col gap-5 border-t border-slate-900/60 pt-4">
                      
                      {/* Required Data Checklist Info grid */}
                      <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-4 flex flex-col gap-3">
                        <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Required / Supported Fields Checklist</span>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-[11px] text-slate-400">
                          <div className="flex items-start gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 mt-1.5"></span>
                            <div>
                              <strong className="text-slate-300">Course Profile:</strong>
                              <p>Course Code, Course Name, Coordinator, Cluster Leader</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 mt-1.5"></span>
                            <div>
                              <strong className="text-slate-300">Assessment Components:</strong>
                              <p>Titles and weights (e.g. Midterm Exam: 30%)</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 mt-1.5"></span>
                            <div>
                              <strong className="text-slate-300">Course Learning Outcomes (CLOs):</strong>
                              <p>Codes, category, expected levels, descriptions</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 mt-1.5"></span>
                            <div>
                              <strong className="text-slate-300">Program Learning Outcomes (PLOs):</strong>
                              <p>Codes, domain categories, descriptions</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 mt-1.5"></span>
                            <div>
                              <strong className="text-slate-300">Mappings:</strong>
                              <p>CLO-to-PLO connections and Component-to-CLO weights</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-indigo-400 mt-1.5"></span>
                            <div>
                              <strong className="text-slate-300">Curriculum Integrations:</strong>
                              <p>Cross-course, VBE, and ESD integration details</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Textarea Paste Box */}
                      <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Paste raw data (Markdown, CSV, Text Key-Value, or JSON)</label>
                        <textarea
                          value={preSettingImportText}
                          onChange={(e) => setPreSettingImportText(e.target.value)}
                          rows={8}
                          placeholder={`E.g.,
Course Code: CS302
Course Name: Advanced Software Engineering
Course Coordinator: Dr. Rizal Husin
Cluster Leader: Prof. Ahmad

--- Components ---
Midterm Exam: 30%
Final Project: 40%
Quizzes & Assignments: 30%

--- Course Learning Outcomes (CLOs) ---
CLO-1 (Cognitive, C4): Analyze software requirements and specify design architectures.
CLO-2 (Psychomotor, P4): Implement modular codebases satisfying clean-code design patterns.

--- Program Learning Outcomes (PLOs) ---
PLO-1 (Theory): Apply engineering principles to solve complex problems.
PLO-3 (Design): Design and model hardware/software components matching specifications.

--- CLO to PLO Mapping ---
CLO-1 -> PLO-1
CLO-2 -> PLO-3

--- Component to CLO Weighting ---
Midterm Exam: CLO-1 (80%), CLO-3 (20%)
Final Project: CLO-2 (100%)`}
                          className="w-full bg-slate-950 border border-slate-850 rounded-lg p-3 text-[11px] font-mono text-slate-350 leading-relaxed focus:outline-none focus:border-indigo-500 focus:ring-0 resize-y"
                        />
                      </div>

                      {/* Actions & Result Indicators */}
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        {preSettingImportStatus && (
                          <div className={`text-xs px-3 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 ${
                            preSettingImportStatus.success
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                          }`}>
                            {preSettingImportStatus.success ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-rose-400" />
                            )}
                            <span>{preSettingImportStatus.message}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2.5 ml-auto">
                          <button
                            type="button"
                            onClick={() => {
                              setPreSettingImportText(`Course Code: CS302
Course Name: Advanced Software Engineering
Course Coordinator: Dr. Rizal Husin
Cluster Leader: Prof. Ahmad

--- Components ---
Midterm Exam: 30%
Final Project: 40%
Quizzes & Assignments: 30%

--- Course Learning Outcomes (CLOs) ---
CLO-1 (Cognitive, C4): Analyze software requirements and specify design architectures.
CLO-2 (Psychomotor, P4): Implement modular codebases satisfying clean-code design patterns.
CLO-3 (Affective, A3): Collaborate in team environments and present system designs.

--- Program Learning Outcomes (PLOs) ---
PLO-1 (Theory): Apply engineering principles to solve complex problems.
PLO-3 (Design): Design and model hardware/software components matching specifications.
PLO-6 (Comm): Communicate technical solutions effectively to professional audiences.

--- CLO to PLO Mapping ---
CLO-1 -> PLO-1
CLO-2 -> PLO-3
CLO-3 -> PLO-6

--- Component to CLO Weighting ---
Midterm Exam: CLO-1 (80%), CLO-3 (20%)
Final Project: CLO-2 (100%)
Quizzes & Assignments: CLO-1 (50%), CLO-3 (50%)

--- Integrations ---
Cross-Course: CS304 Software Engineering, CS305 Database Systems
Cross-Course Details: Joint capstone assessment. Students architect the relational schemas in CS302 and develop API connectors in CS304.
VBE T&L: In lectures, discuss professional ethical codes and copyright rules.
VBE Assessment: Rubric includes dedicated criteria for plagiarism checks.
ESD T&L: Introduce green computing principles, server energy consumption trade-offs.
ESD Assessment: Assessment brief tasks students with analyzing server footprint.`);
                              setPreSettingImportStatus(null);
                            }}
                            className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold px-2.5 py-1.5 rounded border border-slate-800 bg-slate-950 cursor-pointer transition-colors"
                          >
                            Load Template Example
                          </button>
                          <button
                            type="button"
                            onClick={() => handleImportPreSetting(preSettingImportText)}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs uppercase tracking-wider px-4 py-2 rounded-xl cursor-pointer transition-all shadow shadow-indigo-500/10 flex items-center gap-1.5"
                          >
                            <Save className="h-3.5 w-3.5" />
                            <span>Parse & Load Blueprint</span>
                          </button>
                        </div>
                      </div>

                    </div>
                  )}
                </div>

                <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 flex flex-col gap-6">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Stage 1 - Pre Setting</span>
                    <h2 className="text-xl font-bold text-white mt-1">Course Details & Weightage Blueprint</h2>
                    <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                      Establish assessment targets. The weight allocations must sum to exactly 100% to satisfy curriculum requirements.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Course Code</label>
                      <input 
                        type="text" 
                        value={courseCode} 
                        onChange={(e) => setCourseCode(e.target.value)} 
                        className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Course Name</label>
                      <input 
                        type="text" 
                        value={courseName} 
                        onChange={(e) => setCourseName(e.target.value)} 
                        className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Course Coordinator</label>
                      <input 
                        type="text" 
                        value={courseCoordinator} 
                        onChange={(e) => setCourseCoordinator(e.target.value)} 
                        className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                        placeholder="e.g. Dr. Rizal Husin"
                      />
                    </div>
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Cluster Leader</label>
                      <input 
                        type="text" 
                        value={clusterLeader} 
                        onChange={(e) => setClusterLeader(e.target.value)} 
                        className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-indigo-500"
                        placeholder="e.g. Prof. Ahmad"
                      />
                    </div>
                  </div>

                  <div className="h-px bg-slate-900"></div>

                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Grading Component Weights</span>
                      <span className="text-xs text-slate-500">{components.length} components</span>
                    </div>

                    <div className="flex flex-col gap-3">
                      {components.map((comp, idx) => (
                        <div key={comp.id} className="flex items-center gap-3 bg-slate-950/60 border border-slate-900/60 rounded-xl p-3">
                          <div className="h-7 w-7 rounded-lg bg-slate-900 flex items-center justify-center text-xs font-bold text-slate-500">
                            {idx + 1}
                          </div>
                          <input 
                            type="text" 
                            placeholder="Component Title (e.g. Project Phase 1)" 
                            value={comp.name} 
                            onChange={(e) => updateComponent(comp.id, 'name', e.target.value)}
                            className="flex-1 bg-transparent border-0 p-0 text-slate-200 placeholder-slate-700 text-sm focus:outline-none focus:ring-0"
                          />
                          <div className="w-24 relative flex items-center">
                            <input 
                              type="number" 
                              placeholder="0" 
                              value={comp.weight === 0 ? '' : comp.weight}
                              onChange={(e) => updateComponent(comp.id, 'weight', e.target.value)}
                              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-3 pr-7 py-1 text-right text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
                            />
                            <span className="absolute right-2 text-[10px] text-slate-500 font-bold">%</span>
                          </div>
                          <button 
                            disabled={components.length <= 1}
                            onClick={() => deleteComponent(comp.id)}
                            className="text-slate-600 hover:text-rose-400 p-1 cursor-pointer disabled:cursor-not-allowed disabled:text-slate-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <button 
                      onClick={addComponent}
                      className="py-2.5 border border-dashed border-slate-800 rounded-xl text-xs font-bold text-slate-400 hover:text-indigo-400 hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      Add Component
                    </button>
                  </div>

                  <div className="h-px bg-slate-900"></div>

                  <button
                    disabled={!isDesignValid || isSaving}
                    onClick={handleSaveDesign}
                    className={`w-full py-3.5 rounded-xl font-bold text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      isDesignValid && !isSaving
                        ? 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-md'
                        : 'bg-slate-900 border border-slate-800 text-slate-500 cursor-not-allowed'
                    }`}
                  >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    <span>Save Coursework Blueprint to Sheets</span>
                  </button>
                </div>

                {/* Curricular Integrations & Value Alignments (VBE / ESD / Related Courses) */}
                <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 flex flex-col gap-6">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Stage 1 - Integration Settings</span>
                    <h2 className="text-xl font-bold text-white mt-1">Integrations & Value Alignments</h2>
                    <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                      Plan integrations with related courses and indicate how Value-Based Education (VBE) and/or Education for Sustainable Development (ESD) are integrated in both Teaching & Learning (TnL) and Assessments.
                    </p>
                  </div>

                  <div className="flex flex-col gap-5">
                    {/* Part 1: Cross-Course Integration */}
                    <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2.5 text-xs font-bold text-slate-200 cursor-pointer select-none">
                          <input 
                            type="checkbox"
                            checked={hasCourseIntegration}
                            onChange={(e) => {
                              setHasCourseIntegration(e.target.checked);
                              if (!e.target.checked) {
                                setIntegratedCourseNames('');
                                setCourseIntegrationDetails('');
                              }
                              addLog(`Cross-Course Integration toggled: ${e.target.checked ? 'ENABLED' : 'DISABLED'}`);
                            }}
                            className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-500/20 cursor-pointer"
                          />
                          <span>Integration with other related courses is planned</span>
                        </label>
                        <span className="text-[9px] bg-slate-900 px-1.5 py-0.5 rounded text-slate-500 font-bold uppercase">Cross-Course</span>
                      </div>

                      {hasCourseIntegration && (
                        <div className="flex flex-col gap-3 animate-fadeIn mt-1 border-t border-slate-900/60 pt-3">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Name of Integrated Course(s)</label>
                            <input 
                              type="text"
                              value={integratedCourseNames}
                              onChange={(e) => setIntegratedCourseNames(e.target.value)}
                              placeholder="E.g. CS304 Software Engineering, CS305 Database Systems"
                              className="bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">How the Integration is Planned (Shared Deliverables / Assessment Mapping)</label>
                            <textarea
                              value={courseIntegrationDetails}
                              onChange={(e) => setCourseIntegrationDetails(e.target.value)}
                              placeholder="E.g. Joint capstone assessment. Students architect the relational schemas in CS302 and develop API connectors in CS304."
                              rows={3}
                              className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-slate-350 focus:outline-none focus:border-indigo-500 focus:ring-0 resize-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Part 2: VBE Integration */}
                    <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2.5 text-xs font-bold text-slate-200 cursor-pointer select-none">
                          <input 
                            type="checkbox"
                            checked={hasVbeIntegration}
                            onChange={(e) => {
                              setHasVbeIntegration(e.target.checked);
                              if (!e.target.checked) {
                                setVbeTnlDetails('');
                                setVbeAssessmentDetails('');
                              }
                              addLog(`Value-Based Education (VBE) toggled: ${e.target.checked ? 'ENABLED' : 'DISABLED'}`);
                            }}
                            className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-500/20 cursor-pointer"
                          />
                          <span>Value-Based Education (VBE) is integrated in the course</span>
                        </label>
                        <span className="text-[9px] bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded text-indigo-400 font-bold uppercase">VBE</span>
                      </div>

                      {hasVbeIntegration && (
                        <div className="flex flex-col gap-3 animate-fadeIn mt-1 border-t border-slate-900/60 pt-3">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">VBE Integration in Teaching & Learning (TnL) / Course Delivery</label>
                            <textarea
                              value={vbeTnlDetails}
                              onChange={(e) => setVbeTnlDetails(e.target.value)}
                              placeholder="E.g. In lectures, discuss professional ethical codes and copyright rules. Case studies analyze real-world software breaches and academic integrity standards."
                              rows={2.5}
                              className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-slate-350 focus:outline-none focus:border-indigo-500 focus:ring-0 resize-none"
                            />
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">VBE Integration in Assessment Tasks / Rubrics</label>
                            <textarea
                              value={vbeAssessmentDetails}
                              onChange={(e) => setVbeAssessmentDetails(e.target.value)}
                              placeholder="E.g. Rubric includes dedicated criteria for plagiarism checks, citation accuracy, and honor code statements signed by students."
                              rows={2.5}
                              className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-slate-350 focus:outline-none focus:border-indigo-500 focus:ring-0 resize-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Part 3: ESD Integration */}
                    <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2.5 text-xs font-bold text-slate-200 cursor-pointer select-none">
                          <input 
                            type="checkbox"
                            checked={hasEsdIntegration}
                            onChange={(e) => {
                              setHasEsdIntegration(e.target.checked);
                              if (!e.target.checked) {
                                setEsdTnlDetails('');
                                setEsdAssessmentDetails('');
                              }
                              addLog(`Education for Sustainable Development (ESD) toggled: ${e.target.checked ? 'ENABLED' : 'DISABLED'}`);
                            }}
                            className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-500/20 cursor-pointer"
                          />
                          <span>Education for Sustainable Development (ESD) is integrated in the course</span>
                        </label>
                        <span className="text-[9px] bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-400 font-bold uppercase">ESD</span>
                      </div>

                      {hasEsdIntegration && (
                        <div className="flex flex-col gap-3 animate-fadeIn mt-1 border-t border-slate-900/60 pt-3">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">ESD Integration in Teaching & Learning (TnL) / Course Delivery</label>
                            <textarea
                              value={esdTnlDetails}
                              onChange={(e) => setEsdTnlDetails(e.target.value)}
                              placeholder="E.g. Introduce green computing principles, server energy consumption trade-offs, and design patterns that optimize query performance to reduce processor utilization."
                              rows={2.5}
                              className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-slate-350 focus:outline-none focus:border-indigo-500 focus:ring-0 resize-none"
                            />
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">ESD Integration in Assessment Tasks / Rubrics</label>
                            <textarea
                              value={esdAssessmentDetails}
                              onChange={(e) => setEsdAssessmentDetails(e.target.value)}
                              placeholder="E.g. Assessment brief tasks students with analyzing server footprint. Grading rubrics reward resource-optimized algorithm choices."
                              rows={2.5}
                              className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-xs text-slate-350 focus:outline-none focus:border-indigo-500 focus:ring-0 resize-none"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* CLO and PLO Definition Desk Card */}
                <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 flex flex-col gap-6">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Award className="h-4 w-4 text-indigo-400" />
                      <span>Define Learning Outcomes (CLOs & PLOs)</span>
                    </h3>
                    <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                      List down Course Learning Outcomes (CLOs) and Program Learning Outcomes (PLOs) for this subject.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                    {/* Left Panel: CLOs */}
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                        <span className="text-xs font-bold text-slate-300 uppercase">Course Outcomes (CLOs)</span>
                        <button
                          type="button"
                          onClick={addClo}
                          className="px-2 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 font-bold text-[10px] rounded cursor-pointer"
                        >
                          + Add CLO
                        </button>
                      </div>

                      <div className="flex flex-col gap-2.5 max-h-80 overflow-y-auto pr-1">
                        {cloList.map((clo) => (
                          <div key={clo.id} className="bg-slate-950/60 border border-slate-900/60 rounded-xl p-3 flex flex-col gap-2 relative group">
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={clo.code}
                                onChange={(e) => updateClo(clo.id, 'code', e.target.value)}
                                className="w-16 bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-center font-bold text-[11px] text-white focus:outline-none"
                              />
                              <select
                                value={clo.category}
                                onChange={(e) => updateClo(clo.id, 'category', e.target.value)}
                                className="bg-slate-900 border border-slate-800 rounded px-1 py-0.5 text-[10px] text-slate-300 focus:outline-none cursor-pointer"
                              >
                                <option value="Cognitive">Cognitive</option>
                                <option value="Psychomotor">Psychomotor</option>
                                <option value="Affective">Affective</option>
                              </select>

                              <select
                                value={clo.level || 'C1'}
                                onChange={(e) => updateClo(clo.id, 'level', e.target.value)}
                                className="bg-slate-900 border border-slate-800 rounded px-1 py-0.5 text-[10px] text-slate-300 focus:outline-none cursor-pointer"
                              >
                                {clo.category === 'Cognitive' && (
                                  <>
                                    <option value="C1">C1 - Remembering</option>
                                    <option value="C2">C2 - Understanding</option>
                                    <option value="C3">C3 - Applying</option>
                                    <option value="C4">C4 - Analyzing</option>
                                    <option value="C5">C5 - Evaluating</option>
                                    <option value="C6">C6 - Creating</option>
                                  </>
                                )}
                                {clo.category === 'Psychomotor' && (
                                  <>
                                    <option value="P1">P1 - Imitation</option>
                                    <option value="P2">P2 - Manipulation</option>
                                    <option value="P3">P3 - Precision</option>
                                    <option value="P4">P4 - Articulation</option>
                                    <option value="P5">P5 - Naturalization</option>
                                  </>
                                )}
                                {clo.category === 'Affective' && (
                                  <>
                                    <option value="A1">A1 - Receiving</option>
                                    <option value="A2">A2 - Responding</option>
                                    <option value="A3">A3 - Valuing</option>
                                    <option value="A4">A4 - Organization</option>
                                    <option value="A5">A5 - Characterization</option>
                                  </>
                                )}
                              </select>
                              <button
                                type="button"
                                onClick={() => deleteClo(clo.id)}
                                disabled={cloList.length <= 1}
                                className="ml-auto text-slate-700 hover:text-rose-400 disabled:opacity-30 cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <textarea
                              value={clo.desc}
                              rows={2}
                              onChange={(e) => updateClo(clo.id, 'desc', e.target.value)}
                              className="bg-transparent border-0 p-0 text-xs text-slate-400 focus:ring-0 focus:outline-none leading-relaxed resize-none"
                              placeholder="CLO Description..."
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right Panel: PLOs */}
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between items-center border-b border-slate-900 pb-2">
                        <span className="text-xs font-bold text-slate-300 uppercase">Program Outcomes (PLOs)</span>
                        <button
                          type="button"
                          onClick={addPlo}
                          className="px-2 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 font-bold text-[10px] rounded cursor-pointer"
                        >
                          + Add PLO
                        </button>
                      </div>

                      <div className="flex flex-col gap-2.5 max-h-80 overflow-y-auto pr-1">
                        {ploList.map((plo) => (
                          <div key={plo.id} className="bg-slate-950/60 border border-slate-900/60 rounded-xl p-3 flex flex-col gap-2 relative group">
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                value={plo.code}
                                onChange={(e) => updatePlo(plo.id, 'code', e.target.value)}
                                className="w-16 bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-center font-bold text-[11px] text-white focus:outline-none"
                              />
                              <input
                                type="text"
                                value={plo.category}
                                onChange={(e) => updatePlo(plo.id, 'category', e.target.value)}
                                placeholder="Category (e.g. Theory)"
                                className="bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-[10px] text-slate-300 focus:outline-none w-24"
                              />
                              <button
                                type="button"
                                onClick={() => deletePlo(plo.id)}
                                disabled={ploList.length <= 1}
                                className="ml-auto text-slate-700 hover:text-rose-400 disabled:opacity-30 cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <textarea
                              value={plo.desc}
                              rows={2}
                              onChange={(e) => updatePlo(plo.id, 'desc', e.target.value)}
                              className="bg-transparent border-0 p-0 text-xs text-slate-400 focus:ring-0 focus:outline-none leading-relaxed resize-none"
                              placeholder="PLO Description..."
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* CLO to PLO Mapping Grid Matrix Card */}
                <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 flex flex-col gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Layers className="h-4 w-4 text-violet-400" />
                      <span>CLO to PLO Mapping Matrix</span>
                    </h3>
                    <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                      Map Course outcomes (rows) to Program outcomes (columns). Click cells to toggle connection.
                    </p>
                  </div>

                  <div className="overflow-x-auto border border-slate-900 rounded-xl bg-slate-950/20">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-950">
                        <tr className="border-b border-slate-900">
                          <th className="py-2.5 px-4 text-slate-500 font-bold">Course Outcomes</th>
                          {ploList.map(plo => (
                            <th key={plo.id} className="py-2.5 px-4 text-slate-500 font-bold text-center w-24" title={plo.desc}>
                              {plo.code}<br/>
                              <span className="text-[9px] text-slate-600 font-normal">{plo.category}</span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {cloList.map(clo => (
                          <tr key={clo.id} className="border-b border-slate-900/60 hover:bg-slate-900/10">
                            <td className="py-3 px-4 font-bold text-slate-300" title={clo.desc}>
                              {clo.code} <span className="text-[10px] text-slate-500 font-normal">({clo.category} - {clo.level})</span>
                            </td>
                            {ploList.map(plo => {
                              const isChecked = !!cloToPloMapping[`${clo.id}_${plo.id}`];
                              return (
                                <td key={plo.id} className="py-3 px-4 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => toggleCloPloMapping(clo.id, plo.id)}
                                    className="h-4 w-4 bg-slate-950 border border-slate-800 text-indigo-600 rounded focus:ring-indigo-500 focus:ring-offset-slate-950 cursor-pointer"
                                  />
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Component-to-CLO Mapping Matrix Card */}
                <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 flex flex-col gap-6">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-emerald-400" />
                      <span>Assessment Component to CLO Mapping</span>
                    </h3>
                    <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                      Allocate how each component's weightage is distributed across Course Outcomes (CLOs). The mapping sum per component must equal exactly 100%.
                    </p>
                  </div>

                  <div className="overflow-x-auto border border-slate-900 rounded-xl bg-slate-950/20">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-950">
                        <tr className="border-b border-slate-900">
                          <th className="py-2.5 px-4 text-slate-500 font-bold">Assessment Component</th>
                          {cloList.map(clo => (
                            <th key={clo.id} className="py-2.5 px-4 text-slate-500 font-bold text-center w-24" title={`${clo.desc} (${clo.category} - ${clo.level})`}>
                              {clo.code}<br/>
                              <span className="text-[9px] text-slate-600 font-normal">{clo.level}</span>
                            </th>
                          ))}
                          <th className="py-2.5 px-4 text-slate-500 font-bold text-center w-32">Status</th>
                          <th className="py-2.5 px-4 text-slate-500 font-bold text-center">Aligned PLOs (Indirect)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {components.map((comp) => {
                          let sum = 0;
                          cloList.forEach(clo => {
                            sum += cloPloMapping[`${comp.id}_${clo.id}`] || 0;
                          });

                          const updateMapping = (cloId: string, val: string) => {
                            const num = parseInt(val) || 0;
                            setCloPloMapping(prev => ({
                              ...prev,
                              [`${comp.id}_${cloId}`]: Math.min(100, Math.max(0, num))
                            }));
                          };

                          // Dynamic PLO Resolution
                          const mappedClos = cloList.filter(clo => (cloPloMapping[`${comp.id}_${clo.id}`] || 0) > 0);
                          const mappedPlosSet = new Set<string>();
                          mappedClos.forEach(clo => {
                            ploList.forEach(plo => {
                              if (cloToPloMapping[`${clo.id}_${plo.id}`]) {
                                mappedPlosSet.add(plo.code);
                              }
                            });
                          });
                          const alignedPlosText = mappedPlosSet.size > 0 ? Array.from(mappedPlosSet).join(', ') : 'None';

                          return (
                            <tr key={comp.id} className="border-b border-slate-900/60 hover:bg-slate-900/10">
                              <td className="py-4 px-4 font-semibold text-slate-200">
                                {comp.name || 'Unnamed'} <span className="text-[10px] text-slate-500 font-normal">({comp.weight}%)</span>
                              </td>
                              
                              {cloList.map(clo => {
                                const weight = cloPloMapping[`${comp.id}_${clo.id}`] || 0;
                                return (
                                  <td key={clo.id} className="py-4 text-center">
                                    <div className="inline-flex items-center gap-1 bg-slate-950 px-2 py-0.5 rounded-lg border border-slate-900">
                                      <input
                                        type="number"
                                        value={weight}
                                        onChange={(e) => updateMapping(clo.id, e.target.value)}
                                        className="w-10 bg-transparent text-center font-bold text-slate-200 border-0 p-0 text-xs focus:ring-0 focus:outline-none"
                                      />
                                      <span className="text-[9px] text-slate-600">%</span>
                                    </div>
                                  </td>
                                );
                              })}

                              <td className="py-4 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  sum === 100
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15'
                                    : 'bg-rose-500/10 text-rose-400 border border-rose-500/15 animate-pulse'
                                }`}>
                                  {sum === 100 ? 'Valid' : `${sum}% (Must be 100%)`}
                                </span>
                              </td>

                              <td className="py-4 text-center">
                                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-indigo-400 border border-slate-800">
                                  {alignedPlosText}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-indigo-950/10 border border-indigo-500/10 rounded-xl p-4 flex gap-3 text-xs text-indigo-300">
                    <Info className="h-4.5 w-4.5 text-indigo-400 flex-shrink-0 mt-0.5" />
                    <p className="leading-relaxed font-light">
                      Modifying outcome mappings alters dynamic PLO calculations automatically. Indirect PLOs are resolved transitively: <strong>Component ➔ CLO ➔ PLO</strong>.
                    </p>
                  </div>
                </div>

                {/* CLASS ROSTER MANAGER & EDIT DESK */}
                <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 flex flex-col gap-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Stage 1 - Student Roster</span>
                      <h2 className="text-xl font-bold text-white mt-1">Class Roster Workspace</h2>
                      <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                        Manage enrolled students for this course portfolio. Edit details directly in the table or bulk-import from spreadsheets.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => {
                          setIsRosterPasteOpen(!isRosterPasteOpen);
                          setRosterPasteStatus(null);
                        }}
                        className="py-2 px-3 border border-slate-800 hover:border-slate-700 bg-slate-950 text-slate-350 hover:text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                        <span>{isRosterPasteOpen ? 'Hide Bulk Paste' : 'Bulk Paste from Sheets'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={addStudent}
                        className="py-2 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow shadow-indigo-500/10"
                      >
                        <Plus className="h-4 w-4" />
                        <span>Add Student</span>
                      </button>
                    </div>
                  </div>

                  {/* Bulk Paste Importer Panel */}
                  {isRosterPasteOpen && (
                    <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-4 flex flex-col gap-4 animate-fadeIn">
                      <div>
                        <h4 className="text-xs font-bold text-slate-300">Copy & Paste Student Data</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                          Copy rows directly from Google Sheets or Excel (ID, Name, Email) and paste them here. Headers will be skipped automatically.
                        </p>
                      </div>

                      <textarea
                        value={rosterPasteText}
                        onChange={(e) => setRosterPasteText(e.target.value)}
                        rows={6}
                        placeholder="E.g.,&#10;S101&#9;Alice Tan&#9;alice@university.edu&#10;S102&#9;Bob Lim&#9;bob@university.edu"
                        className="w-full bg-slate-950 border border-slate-850 rounded-lg p-3 text-[11px] font-mono text-slate-350 leading-relaxed focus:outline-none focus:border-indigo-500 focus:ring-0 resize-y"
                      />

                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        {rosterPasteStatus && (
                          <div className={`text-xs px-3 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 ${
                            rosterPasteStatus.success
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                              : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                          }`}>
                            {rosterPasteStatus.success ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-rose-400" />
                            )}
                            <span>{rosterPasteStatus.message}</span>
                          </div>
                        )}
                        
                        <div className="flex gap-2 ml-auto">
                          <button
                            type="button"
                            onClick={() => {
                              setRosterPasteText(`S101\tAlice Tan\talice.tan@university.edu
S102\tBenjamin Lim\tbenjamin.lim@university.edu
S103\tCatherine Ng\tcatherine.ng@university.edu
S104\tDaniel Yeoh\tdaniel.yeoh@university.edu`);
                              setRosterPasteStatus(null);
                            }}
                            className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold px-2 py-1 rounded border border-slate-800 bg-slate-950 cursor-pointer"
                          >
                            Load Roster Example
                          </button>
                          <button
                            type="button"
                            onClick={() => handleBulkImportRoster(rosterPasteText)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-xl cursor-pointer"
                          >
                            Parse and Override Roster
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Student list editable table */}
                  <div className="overflow-x-auto border border-slate-900 rounded-xl bg-slate-950/20">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-950">
                        <tr className="border-b border-slate-900">
                          <th className="py-2.5 px-4 text-slate-500 font-bold w-32">Student ID</th>
                          <th className="py-2.5 px-4 text-slate-500 font-bold">Full Name</th>
                          <th className="py-2.5 px-4 text-slate-500 font-bold">Email Address</th>
                          <th className="py-2.5 px-4 text-slate-500 font-bold text-center w-20">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((student) => (
                          <tr key={student.id} className="border-b border-slate-900/60 hover:bg-slate-900/10">
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={student.id}
                                onChange={(e) => updateStudentField(student.id, 'id', e.target.value)}
                                className="w-full bg-slate-950 border border-slate-900 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs font-mono"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                value={student.name}
                                onChange={(e) => updateStudentField(student.id, 'name', e.target.value)}
                                className="w-full bg-slate-950 border border-slate-900 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs font-semibold"
                              />
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="email"
                                value={student.email}
                                onChange={(e) => updateStudentField(student.id, 'email', e.target.value)}
                                className="w-full bg-slate-950 border border-slate-900 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-indigo-500 text-xs"
                              />
                            </td>
                            <td className="py-2 text-center">
                              <button
                                type="button"
                                onClick={() => deleteStudent(student.id)}
                                disabled={students.length <= 1}
                                className="text-slate-600 hover:text-rose-400 p-1 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                title="Remove Student"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="bg-slate-950/40 border border-slate-900/60 rounded-xl p-3.5 flex gap-2.5 text-[11px] text-slate-500 items-start">
                    <Info className="h-4 w-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      Changes here directly update the class roster. Launching Stage 3 (Distribution) will automatically provision Drive folders matching these matric IDs.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* STAGE 2: Design Brief & Rubrics alignment */}
            {activeStage === 'design_brief_rubrics' && (() => {
              const currentBriefComp = components.find(c => c.id === activeRubricCompId);
              const brief = assessmentBriefs[activeRubricCompId] || {
                startDate: '',
                endDate: '',
                instructions: '',
                tasks: '',
                submissionFormat: '',
                evidenceToSubmit: '',
                maxPoints: 100,
                allowedAttempts: 1
              };

              const mappedClosForComp = cloList.filter(clo => (cloPloMapping[`${activeRubricCompId}_${clo.id}`] || 0) > 0);
              const closListText = mappedClosForComp.length > 0
                ? mappedClosForComp.map(c => `- ${c.code}: ${c.desc} (${c.category} - expected level ${c.level})`).join('\n')
                : '- No Course Learning Outcomes mapped.';

              const aiPromptText = `You are an expert academic curriculum designer and university professor. Generate a comprehensive Assessment Brief document and a matching 5-level scoring rubric for the following coursework component:

[ASSESSMENT METADATA]
- Course: ${courseCode} - ${courseName}
- Semester: ${semester}
- Component: ${currentBriefComp?.name || 'Assessment Component'} (Weight: ${currentBriefComp?.weight || 0}%)
- Max Marks: ${brief.maxPoints || 100}
- Allowed Attempts: ${brief.allowedAttempts || 1}
- Start Date: ${brief.startDate || 'Not Scheduled'}
- Cutoff Date: ${brief.endDate || 'Not Scheduled'}
- Target Course Learning Outcomes (CLOs):
${closListText}

[CURRICULAR INTEGRATIONS]
- Cross-Course Integration: ${hasCourseIntegration ? `Yes, integrated with course: "${integratedCourseNames}". Details: ${courseIntegrationDetails}` : `No`}
- Value-Based Education (VBE) Alignment: ${hasVbeIntegration ? `Yes. Teaching & Learning: ${vbeTnlDetails}. Assessment Tasks: ${vbeAssessmentDetails}` : `No`}
- Education for Sustainable Development (ESD) Alignment: ${hasEsdIntegration ? `Yes. Teaching & Learning: ${esdTnlDetails}. Assessment Tasks: ${esdAssessmentDetails}` : `No`}

[ASSESSMENT SCENARIO, TASKS & FORMAT]
- Scenario / Context of Assessment Brief: ${brief.instructions || 'No scenario described yet.'}
- Specific Tasks: ${brief.tasks || 'No specific tasks described yet.'}
- Submission Format / Deliverables: ${brief.submissionFormat || 'E.g. Compiled PDF portfolio'}
- Required Evidence / Item(s) to Submit: ${brief.evidenceToSubmit || 'None specified.'}

[REQUIRED OUTPUT FORMAT]
Please generate:
1. A highly professional, student-ready Assessment Brief document matching the metadata and scenario context.
2. A matching 5-column scenario-based scoring rubric where:
   - Level 3 represents the expected domain level (scenario compliance).
   - Level 5 represents the highest master level.
   - Level 4 serves as a qualitative bridge.
   - Level 1 & 2 represent beginner & developing competencies.
Make the rubric criteria match the assessment component's specific tasks.

[RUBRIC FORMAT REQUIREMENT FOR BULK IMPORT]
To allow direct copy-pasting of the rubric descriptors into my assessment designer app, please ALSO format the rubric strictly as a tab-separated TSV table inside a markdown code block. Follow this structure:
- 7 columns separated by a TAB character:
  Column 1: Criteria Name
  Column 2: Weight (number only, e.g. 25)
  Column 3: Level 1 Descriptor
  Column 4: Level 2 Descriptor
  Column 5: Level 3 Descriptor (Expected Domain Level)
  Column 6: Level 4 Descriptor (Bridge Level)
  Column 7: Level 5 Descriptor (Outstanding Master Level)
- Do not include column header labels inside the code block.
- Each criteria must be on a new line.

Example output format in the code block:
Criteria A\t20\tL1 desc...\tL2 desc...\tL3 desc...\tL4 desc...\tL5 desc...
Criteria B\t30\tL1 desc...\tL2 desc...\tL3 desc...\tL4 desc...\tL5 desc...`;

              const handleCopyPrompt = () => {
                navigator.clipboard.writeText(aiPromptText);
                setCopiedPrompt(true);
                addLog(`SUCCESS: Copied AI assessment brief generator prompt to clipboard.`);
                setTimeout(() => setCopiedPrompt(false), 2000);
              };

              return (
                <div className="flex flex-col gap-6 animate-fadeIn">

                  {/* ASSESSMENT BRIEF CREATOR CARD */}
                  <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 flex flex-col gap-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Stage 2 - Assessment Design</span>
                      <h2 className="text-xl font-bold text-white mt-1">Assessment Brief Architect</h2>
                      <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                        Design specific instructions, tasks, milestones, scheduling times, and submission guidelines for this assessment.
                      </p>
                    </div>

                    {/* Component Selector Dropdown */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-bold whitespace-nowrap">Target Assessment:</span>
                      <select 
                        value={activeRubricCompId}
                        onChange={(e) => {
                          setActiveRubricCompId(e.target.value);
                          setSaveStatus(null);
                        }}
                        className="bg-slate-950 border border-slate-800 text-xs font-bold text-slate-200 py-2 px-3 rounded-lg focus:outline-none focus:border-indigo-500 cursor-pointer"
                      >
                        {components.map(c => (
                          <option key={c.id} value={c.id}>{c.name || `Unnamed Component`} ({c.weight}%)</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Qualitative vs Quantitative Mode Switch */}
                  {(() => {
                    const comp = components.find(c => c.id === activeRubricCompId);
                    if (!comp) return null;
                    const currentType = comp.assessmentType || 'qualitative';

                    return (
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between bg-slate-950/40 border border-slate-900 rounded-xl p-3.5 gap-3.5">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Grading Framework Mode</span>
                          <span className="text-[11px] text-slate-400">Select whether this assessment component uses qualitative descriptors (rubrics) or quantitative direct numeric scoring.</span>
                        </div>
                        <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-xl p-1 flex-shrink-0 self-start sm:self-center">
                          <button
                            type="button"
                            onClick={() => updateComponentAssessmentType(activeRubricCompId, 'qualitative')}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                              currentType === 'qualitative'
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            Qualitative (Rubric)
                          </button>
                          <button
                            type="button"
                            onClick={() => updateComponentAssessmentType(activeRubricCompId, 'quantitative')}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                              currentType === 'quantitative'
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : 'text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            Quantitative (Direct Score)
                          </button>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Aligned Syllabus Outcomes Info Box */}
                  {(() => {
                    const comp = components.find(c => c.id === activeRubricCompId);
                    if (!comp) return null;

                    // Resolve outcomes
                    const mappedClos = cloList.filter(clo => (cloPloMapping[`${comp.id}_${clo.id}`] || 0) > 0);
                    const mappedPlosSet = new Set<string>();
                    mappedClos.forEach(clo => {
                      ploList.forEach(plo => {
                        if (cloToPloMapping[`${clo.id}_${plo.id}`]) {
                          mappedPlosSet.add(plo.code);
                        }
                      });
                    });

                    return (
                      <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Aligned Course Outcomes (CLOs)</span>
                          <div className="flex flex-wrap gap-1.5">
                            {mappedClos.length === 0 ? (
                              <span className="text-[11px] text-slate-600 italic">No CLOs aligned yet. Set this in Pre Setting.</span>
                            ) : (
                              mappedClos.map(clo => (
                                <span key={clo.id} className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/15 text-[10px] font-medium" title={clo.desc}>
                                  {clo.code} ({clo.level})
                                </span>
                              ))
                            )}
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5 md:border-l md:border-slate-900 md:pl-4">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Accredited Program Outcomes (PLOs)</span>
                          <div className="flex flex-wrap gap-1.5">
                            {mappedPlosSet.size === 0 ? (
                              <span className="text-[11px] text-slate-600 italic">No PLOs aligned. Check CLO-to-PLO mapping in Pre Setting.</span>
                            ) : (
                              Array.from(mappedPlosSet).map(ploCode => {
                                const plo = ploList.find(p => p.code === ploCode);
                                return (
                                  <span key={ploCode} className="px-2 py-0.5 rounded bg-violet-500/10 text-violet-300 border border-violet-500/15 text-[10px] font-medium" title={plo?.desc}>
                                    {ploCode}
                                  </span>
                                );
                              })
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="h-px bg-slate-900"></div>

                  {/* Brief Creator Fields Form */}
                  {(() => {
                    const brief = assessmentBriefs[activeRubricCompId] || {
                      startDate: '',
                      endDate: '',
                      instructions: '',
                      tasks: '',
                      submissionFormat: '',
                      maxPoints: 100,
                      allowedAttempts: 1,
                      attachmentName: '',
                      attachmentUrl: ''
                    };

                    return (
                      <div className="grid grid-cols-1 gap-6 text-xs lg:grid" style={{gridTemplateColumns: 'minmax(0, 55fr) minmax(0, 45fr)'}}>
                        
                        {/* Left Side: Form Architect (55% width) */}
                        <div className="flex flex-col gap-5">
                          
                          {/* Row 1: Dates & Max points */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Release Start Date & Time</label>
                              <input
                                type="datetime-local"
                                value={brief.startDate}
                                onChange={(e) => updateAssessmentBrief(activeRubricCompId, 'startDate', e.target.value)}
                                className="bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-0"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Submission Due Date & Time</label>
                              <input
                                type="datetime-local"
                                value={brief.endDate}
                                onChange={(e) => updateAssessmentBrief(activeRubricCompId, 'endDate', e.target.value)}
                                className="bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-0"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Maximum Marks</label>
                              <input
                                type="number"
                                value={brief.maxPoints}
                                onChange={(e) => updateAssessmentBrief(activeRubricCompId, 'maxPoints', parseInt(e.target.value) || 0)}
                                className="bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-0"
                              />
                            </div>
                          </div>

                          {/* Row 2: Format, Attempts & Evidence */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Submission Formats Brief</label>
                              <input
                                type="text"
                                value={brief.submissionFormat || ''}
                                placeholder="E.g., PDF working calculations, ZIP archive"
                                onChange={(e) => updateAssessmentBrief(activeRubricCompId, 'submissionFormat', e.target.value)}
                                className="bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-0 placeholder:text-slate-700"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Allowed Submissions Attempts</label>
                              <input
                                type="number"
                                value={brief.allowedAttempts}
                                onChange={(e) => updateAssessmentBrief(activeRubricCompId, 'allowedAttempts', parseInt(e.target.value) || 1)}
                                className="bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-0"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Evidence / Items to Submit</label>
                              <input
                                type="text"
                                value={brief.evidenceToSubmit || ''}
                                placeholder="E.g., source_code.zip, report.pdf"
                                onChange={(e) => updateAssessmentBrief(activeRubricCompId, 'evidenceToSubmit', e.target.value)}
                                className="bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-0 placeholder:text-slate-700"
                              />
                            </div>
                          </div>

                          {/* Row 3: Attachment uploader & Google Drive link input */}
                          <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-4 flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wider">Brief Attachments & Previews</span>
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateAssessmentBrief(activeRubricCompId, 'attachmentName', 'CourseArchitect_System_Brief.pdf');
                                    updateAssessmentBrief(activeRubricCompId, 'attachmentUrl', 'https://docs.google.com/document/d/1X45vWf_vXpP6eYt4W-4wR19yFqD77s4qfD3pB2w/preview');
                                  }}
                                  className="text-[9px] bg-slate-900 text-slate-400 hover:text-white px-2 py-1 rounded border border-slate-800 cursor-pointer"
                                >
                                  Mock Google Doc Link
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    updateAssessmentBrief(activeRubricCompId, 'attachmentName', 'syllabus_accreditation_rubric.pdf');
                                    updateAssessmentBrief(activeRubricCompId, 'attachmentUrl', 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');
                                  }}
                                  className="text-[9px] bg-slate-900 text-slate-400 hover:text-white px-2 py-1 rounded border border-slate-800 cursor-pointer"
                                >
                                  Mock Public PDF URL
                                </button>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Direct Google Drive/Web URL */}
                              <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Paste Web/Google Drive Share Link</label>
                                <input
                                  type="text"
                                  value={brief.attachmentUrl || ''}
                                  placeholder="https://drive.google.com/file/... or https://docs.google.com/..."
                                  onChange={(e) => updateAssessmentBrief(activeRubricCompId, 'attachmentUrl', e.target.value)}
                                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-0 placeholder:text-slate-800 text-[11px]"
                                />
                              </div>

                              {/* Local File Uploader */}
                              <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Upload Brief (PDF / Word / Document)</label>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="file"
                                    id="brief-file-upload"
                                    accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
                                    onChange={(e) => handleBriefFileUpload(activeRubricCompId, e.target.files?.[0] || null)}
                                    className="hidden"
                                  />
                                  <label
                                    htmlFor="brief-file-upload"
                                    className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-400 cursor-pointer hover:bg-slate-850 hover:text-white text-center font-bold transition-all truncate"
                                  >
                                    {brief.attachmentName ? `📎 ${brief.attachmentName}` : 'Choose brief file...'}
                                  </label>
                                  {brief.attachmentName && (
                                    <button
                                      type="button"
                                      onClick={() => handleBriefFileUpload(activeRubricCompId, null)}
                                      className="px-2.5 py-2 bg-slate-900 text-rose-400 border border-slate-800 rounded-lg hover:text-rose-300 cursor-pointer"
                                      title="Remove attachment"
                                    >
                                      ✕
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Instructions stacked above Tasks */}
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Assessment Instructions</label>
                            <textarea
                              value={brief.instructions}
                              onChange={(e) => updateAssessmentBrief(activeRubricCompId, 'instructions', e.target.value)}
                              rows={8}
                              placeholder="Provide student guidelines, grading criteria outline..."
                              className="w-full bg-slate-950 border border-slate-850 rounded-lg p-3 text-slate-300 leading-relaxed focus:outline-none focus:border-indigo-500 focus:ring-0 resize-none"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tasks & Deliverables Brief</label>
                            <textarea
                              value={brief.tasks}
                              onChange={(e) => updateAssessmentBrief(activeRubricCompId, 'tasks', e.target.value)}
                              rows={8}
                              placeholder="Task 1: Setup structures...&#10;Task 2: Implement logical units..."
                              className="w-full bg-slate-950 border border-slate-850 rounded-lg p-3 text-slate-300 leading-relaxed focus:outline-none focus:border-indigo-500 focus:ring-0 resize-none"
                            />
                          </div>
                        </div>

                        {/* Right Side: Interactive Preview Frame (45% width) — hideable */}
                        {isDocViewportVisible && (
                          <div className="flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Interactive Document Viewport</span>
                              <button
                                type="button"
                                onClick={() => setIsDocViewportVisible(false)}
                                className="text-[10px] text-slate-500 hover:text-rose-400 font-bold px-2 py-1 rounded border border-slate-800 bg-slate-950 cursor-pointer transition-colors flex items-center gap-1"
                                title="Hide document viewport to expand text editing area"
                              >
                                <EyeOff className="h-3 w-3" />
                                <span>Hide Viewport</span>
                              </button>
                            </div>
                            {(() => {
                              const previewUrl = getBriefPreviewUrl(activeRubricCompId);
                              if (!previewUrl) {
                                return (
                                  <div className="flex-grow min-h-[600px] bg-slate-950/60 border border-slate-900 border-dashed rounded-xl flex flex-col items-center justify-center p-6 text-center text-slate-500 gap-3">
                                    <Eye className="h-8 w-8 text-slate-700 animate-pulse" />
                                    <div>
                                      <span className="text-[11px] font-bold text-slate-400 block mb-1">No Active Preview Loaded</span>
                                      <p className="text-[10px] text-slate-600 leading-relaxed max-w-[220px] mx-auto">
                                        Upload a brief document (PDF/Word) or paste a shareable Google Drive link on the left to activate this frame.
                                      </p>
                                    </div>
                                  </div>
                                );
                              }

                              return (
                                <div className="flex-grow flex flex-col gap-2 bg-slate-950 border border-slate-900 rounded-xl p-3 h-full min-h-[600px]">
                                  <div className="flex items-center justify-between text-[10px] border-b border-slate-900 pb-2">
                                    <div className="flex items-center gap-1.5 text-slate-400">
                                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                                      <span className="font-mono truncate max-w-[200px]" title={brief.attachmentName}>{brief.attachmentName || 'External Source Frame'}</span>
                                    </div>
                                    <a
                                      href={previewUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-indigo-400 hover:underline font-bold"
                                    >
                                      Open Direct ↗
                                    </a>
                                  </div>
                                  <div className="flex-1 relative overflow-hidden rounded-lg bg-slate-950 h-full">
                                    <iframe
                                      src={previewUrl}
                                      className="absolute inset-0 w-full h-full border-0 bg-white"
                                      title="Assessment Brief Frame Viewport"
                                    />
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )}

                        {/* Show Viewport button when hidden */}
                        {!isDocViewportVisible && (
                          <div className="flex items-start pt-8">
                            <button
                              type="button"
                              onClick={() => setIsDocViewportVisible(true)}
                              className="px-4 py-2.5 bg-slate-950 border border-slate-800 hover:border-indigo-500 text-slate-400 hover:text-indigo-400 text-xs font-bold rounded-xl cursor-pointer transition-all flex items-center gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              <span>Show Document Viewport</span>
                            </button>
                          </div>
                        )}

                      </div>
                    );
                  })()}
                </div>

                  {/* ASSESSMENT PROMPT CANVAS — collapsible, placed after Brief Architect */}
                  <div className="bg-slate-900/40 border border-indigo-500/20 rounded-2xl overflow-hidden relative">
                    <div className="absolute right-4 top-4 text-indigo-500/10 opacity-30 select-none pointer-events-none">
                      <Sparkles className="h-24 w-24" />
                    </div>

                    {/* Collapsible Header */}
                    <button
                      type="button"
                      onClick={() => setIsPromptCanvasCollapsed(!isPromptCanvasCollapsed)}
                      className="w-full flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 cursor-pointer text-left hover:bg-slate-900/30 transition-colors"
                    >
                      <div>
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-1.5">
                          <Sparkles className="h-3 w-3 animate-pulse" />
                          AI Brief & Rubrics Prompt Generator
                        </span>
                        <h2 className="text-lg font-bold text-white mt-1">Assessment Prompt Canvas</h2>
                        <p className="text-slate-400 text-[10px] mt-0.5 leading-relaxed">
                          Compiles coursework details, VBE/ESD settings, scenarios, and outcomes into a copy-pasteable AI prompt.
                        </p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded border ${
                          isPromptCanvasCollapsed
                            ? 'border-slate-800 bg-slate-950 text-slate-500'
                            : 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400'
                        }`}>
                          {isPromptCanvasCollapsed ? 'Collapsed' : 'Expanded'}
                        </span>
                        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                          isPromptCanvasCollapsed ? '' : 'rotate-180'
                        }`} />
                      </div>
                    </button>

                    {/* Collapsible Body */}
                    {!isPromptCanvasCollapsed && (
                      <div className="px-6 pb-6 flex flex-col gap-4 border-t border-slate-900/60">
                        <div className="flex justify-end pt-4">
                          <button
                            type="button"
                            onClick={handleCopyPrompt}
                            className={`py-2 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                              copiedPrompt
                                ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow shadow-indigo-500/10'
                            }`}
                          >
                            {copiedPrompt ? (
                              <>
                                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                <span>Prompt Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4" />
                                <span>Copy Prompt for AI</span>
                              </>
                            )}
                          </button>
                        </div>

                        <div className="bg-slate-950/80 border border-slate-900 rounded-xl p-4 max-h-56 overflow-y-auto font-mono text-[10.5px] leading-relaxed text-slate-350 select-all whitespace-pre-wrap">
                          {aiPromptText}
                        </div>

                        <div className="text-[10.5px] leading-relaxed text-indigo-400/80 flex items-start gap-1.5 bg-indigo-500/5 p-3 rounded-xl border border-indigo-500/10">
                          <Info className="h-4 w-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="font-bold">How to use this canvas:</p>
                            <p className="text-slate-400 text-[10px] mt-0.5">
                              1. Copy this prompt and paste it in Gemini or another AI to generate the brief.<br />
                              2. Review and save the AI-generated brief as a PDF.<br />
                              3. Upload/attach the PDF in Assessment Brief Architect above to preview inside the document viewport!
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                {/* Rubrics Builder Section */}
                <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 flex flex-col gap-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Rubrics Design</span>
                      <h2 className="text-xl font-bold text-white mt-1">Rubrics Builder Desk</h2>
                      <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                        Design detailed qualitative scoring descriptors for grading. Choose a component below.
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setIsBulkPasteOpen(!isBulkPasteOpen)}
                        className="px-3 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 text-xs font-bold rounded-lg cursor-pointer transition-all flex items-center gap-1.5"
                      >
                        <FileSpreadsheet className="h-4 w-4" />
                        <span>Bulk Paste from Sheets</span>
                      </button>

                      {/* Component Select Dropdown */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 font-bold whitespace-nowrap">Target:</span>
                        <select 
                          value={activeRubricCompId}
                          onChange={(e) => {
                            setActiveRubricCompId(e.target.value);
                            setSaveStatus(null);
                          }}
                          className="bg-slate-950 border border-slate-800 text-xs font-bold text-slate-200 py-2 px-3 rounded-lg focus:outline-none focus:border-indigo-500 cursor-pointer"
                        >
                          {components.map(c => (
                            <option key={c.id} value={c.id}>{c.name || `Unnamed Component`} ({c.weight}%)</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {isBulkPasteOpen && (
                    <div className="bg-slate-950/80 border border-slate-900 rounded-xl p-4 flex flex-col gap-3 animate-fadeIn">
                      <div>
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Spreadsheet Bulk Import</span>
                        <h4 className="text-xs font-bold text-white mt-0.5">Copy-Paste Matrix Grid</h4>
                        <p className="text-slate-500 text-[10px] mt-0.5">
                          Format requirement: 7 columns separated by Tabs. Row layout: <code>Criteria Name [Tab] Weight (\%) [Tab] L1 Desc [Tab] L2 Desc [Tab] L3 Desc [Tab] L4 Desc [Tab] L5 Desc</code>.
                        </p>
                      </div>
                      
                      <textarea
                        value={bulkPasteText}
                        onChange={(e) => setBulkPasteText(e.target.value)}
                        placeholder="Paste your copied spreadsheet cells here..."
                        rows={5}
                        className="w-full bg-slate-900 border border-slate-850 rounded-lg p-2.5 font-mono text-[10.5px] leading-relaxed text-slate-300 focus:outline-none focus:border-indigo-500 resize-y"
                      />
                      
                      <div className="flex items-center gap-2 justify-end">
                        <button
                          type="button"
                          onClick={handleDownloadSpreadsheetTemplate}
                          className="mr-auto px-3 py-1.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white text-xs font-bold rounded-lg cursor-pointer flex items-center gap-1.5 transition-colors"
                          title="Download a template matching Google Sheets columns format"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Download Sheets Template (CSV)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsBulkPasteOpen(false);
                            setBulkPasteText('');
                          }}
                          className="px-3 py-1.5 bg-slate-900 text-slate-400 hover:text-white text-xs font-bold rounded-lg border border-slate-800 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleBulkPaste}
                          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg cursor-pointer"
                        >
                          Import and Append
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="h-px bg-slate-900"></div>

                  {/* Rubric Criteria items list */}
                  {(() => {
                    const comp = components.find(c => c.id === activeRubricCompId);
                    if (comp?.assessmentType === 'quantitative') {
                      return (
                        <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-6 text-center flex flex-col items-center justify-center gap-3 animate-fadeIn">
                          <div className="h-10 w-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                            <Sparkles className="h-5 w-5 text-indigo-400" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-slate-200">Quantitative Grading Mode Active</h3>
                            <p className="text-slate-500 text-xs mt-1 max-w-md mx-auto leading-relaxed">
                              This component is configured to use Direct numeric scoring (marks) instead of qualitative rubrics. Descriptors and 5-level criteria tables are bypassed.
                            </p>
                          </div>
                          <span className="text-[10px] text-slate-500 bg-slate-900/50 border border-slate-900 px-3 py-1 rounded-lg">
                            💡 Change to Qualitative (Rubric) mode above if you want to use assessment rubrics.
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div className="flex flex-col gap-6">
                        {(!rubrics[activeRubricCompId] || rubrics[activeRubricCompId].length === 0) ? (
                      <div className="text-center py-10 border border-dashed border-slate-900 rounded-xl">
                        <p className="text-slate-600 text-xs font-semibold">No grading criteria defined for this component yet.</p>
                        <button 
                          onClick={() => addRubricCriteria(activeRubricCompId)}
                          className="mt-3 px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 text-xs font-bold rounded-lg cursor-pointer"
                        >
                          + Create First Criteria
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-6">
                        {rubrics[activeRubricCompId].map((crit, cIdx) => {
                          const totalRubricWeights = rubrics[activeRubricCompId].reduce((s, r) => s + r.weight, 0);
                          const mappedClos = cloList.filter(clo => (cloPloMapping[`${activeRubricCompId}_${clo.id}`] || 0) > 0);
                          const targetLevels = mappedClos.map(clo => clo.level).filter(Boolean);
                          const targetLevelsText = targetLevels.length > 0 ? targetLevels.join('/') : '';

                          return (
                            <div key={crit.id} className="bg-slate-950/40 border border-slate-900/60 rounded-xl p-5 flex flex-col gap-4 relative">
                              
                              {/* Top row: criteria header and weight */}
                              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
                                <div className="flex flex-col md:flex-row md:items-center gap-3 w-full md:w-auto flex-1">
                                  <div className="flex items-center gap-2 flex-grow w-full md:w-auto">
                                    <div className="h-6 w-6 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-500 flex-shrink-0">
                                      {cIdx + 1}
                                    </div>
                                    <input 
                                      type="text" 
                                      value={crit.name}
                                      onChange={(e) => updateCriteriaValue(activeRubricCompId, crit.id, 'name', e.target.value)}
                                      placeholder="Criteria Title (e.g. Design Correctness)"
                                      className="bg-transparent border-0 p-0 text-slate-200 font-bold text-sm focus:outline-none focus:ring-0 w-full"
                                    />
                                  </div>
                                  
                                  {/* Quick Paste Row input */}
                                  <div className="w-full md:w-56 flex-shrink-0">
                                    <input 
                                      type="text"
                                      placeholder="Paste spreadsheet row here..."
                                      className="bg-slate-950/60 border border-slate-900/60 text-[10px] py-1 px-2.5 rounded-lg w-full focus:outline-none focus:border-indigo-500 font-sans h-7 text-slate-400 placeholder:text-slate-700"
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        if (val.includes('\t') || val.length > 20) {
                                          handlePasteSpreadsheetRow(crit.id, val);
                                          e.target.value = '';
                                        }
                                      }}
                                      onPaste={(e) => {
                                        e.preventDefault();
                                        const pastedText = e.clipboardData.getData('text');
                                        handlePasteSpreadsheetRow(crit.id, pastedText);
                                      }}
                                    />
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 ml-auto md:ml-0">
                                  <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-900 rounded-lg px-2 py-1">
                                    <span className="text-[10px] text-slate-600 font-bold uppercase">Weight:</span>
                                    <input 
                                      type="number"
                                      value={crit.weight === 0 ? '' : crit.weight}
                                      onChange={(e) => updateCriteriaValue(activeRubricCompId, crit.id, 'weight', e.target.value)}
                                      className="w-10 bg-transparent text-center font-bold text-white text-xs border-0 p-0 focus:ring-0 focus:outline-none"
                                    />
                                    <span className="text-[10px] text-slate-600 font-bold">%</span>
                                  </div>

                                  <button 
                                    onClick={() => deleteRubricCriteria(activeRubricCompId, crit.id)}
                                    className="text-slate-600 hover:text-rose-400 p-1 cursor-pointer"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>

                              {/* Grid of 5 level descriptors */}
                              <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mt-2">
                                {crit.levels.map((level) => (
                                  <div key={level.score} className={`p-3 flex flex-col gap-2 rounded-xl border transition-all ${
                                    level.score === 3 
                                      ? 'bg-indigo-950/15 border-indigo-500/40 shadow-sm shadow-indigo-500/5' 
                                      : 'bg-slate-950/60 border-slate-900'
                                  }`}>
                                    <div className="flex justify-between items-center border-b border-slate-900/60 pb-1.5">
                                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide flex items-center gap-1">
                                        Level {level.score}
                                        {level.score === 3 && targetLevelsText && (
                                          <span className="px-1 py-0.2 rounded bg-emerald-500/10 text-emerald-400 text-[8px] font-bold normal-case tracking-normal">Target: {targetLevelsText}</span>
                                        )}
                                      </span>
                                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase font-mono ${
                                        level.score === 3 
                                          ? 'bg-indigo-500/20 text-indigo-300' 
                                          : 'bg-slate-900 text-slate-400 border border-slate-800'
                                      }`}>
                                        {level.label}
                                      </span>
                                    </div>
                                    <textarea 
                                      value={level.desc}
                                      onChange={(e) => updateCriteriaLevelDesc(activeRubricCompId, crit.id, level.score, e.target.value)}
                                      rows={4}
                                      className="bg-transparent border-0 p-0 text-xs text-slate-400 focus:ring-0 focus:outline-none leading-relaxed resize-none w-full"
                                      placeholder={`Descriptor for level ${level.score}`}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          );
                        })}

                        {/* Add Criteria & Save Rubric Actions */}
                        {(() => {
                          const currentRubrics = rubrics[activeRubricCompId] || [];
                          const totalRubricWeights = currentRubrics.reduce((s, r) => s + r.weight, 0);
                          const isWeightValid = totalRubricWeights === 100;

                          return (
                            <div className="flex flex-col gap-3 mt-2">
                              {/* Rubric Weight Validation Banner */}
                              <div className={`p-4 rounded-xl border flex items-center justify-between transition-all ${
                                isWeightValid
                                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                  : 'bg-rose-500/10 border-rose-500/20 text-rose-400 animate-pulse'
                              }`}>
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className="h-4.5 w-4.5" />
                                  <span className="text-xs font-bold">
                                    {isWeightValid
                                      ? 'Rubric weight allocation matches 100% target.'
                                      : `Rubric weight allocation is currently ${totalRubricWeights}% (Must equal exactly 100%).`
                                    }
                                  </span>
                                </div>
                                <span className="text-xs font-mono font-bold">{totalRubricWeights}% / 100%</span>
                              </div>

                              <button 
                                onClick={() => addRubricCriteria(activeRubricCompId)}
                                className="py-2.5 border border-dashed border-slate-800 rounded-xl text-xs font-bold text-slate-400 hover:text-indigo-400 hover:border-indigo-500/40 hover:bg-indigo-500/5 transition-all cursor-pointer flex items-center justify-center gap-2"
                              >
                                <Plus className="h-4 w-4" />
                                Add Rubric Criteria Block
                              </button>
                            </div>
                          );
                        })()}

                          <div className="h-px bg-slate-900 my-2"></div>

                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleSaveRubric(activeRubricCompId)}
                              disabled={isSaving}
                              className="flex-1 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                            >
                              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                              <span>Commit Rubrics matrix to Sheets DB</span>
                            </button>

                            <button
                              onClick={() => {
                                if (window.confirm("Are you sure you want to reset this component's rubrics to the default 5-level criteria? This will overwrite your current changes for this component.")) {
                                  setRubrics(prev => ({
                                    ...prev,
                                    [activeRubricCompId]: JSON.parse(JSON.stringify(DEFAULT_RUBRICS[activeRubricCompId] || []))
                                  }));
                                  addLog(`Reset rubrics for component ${activeRubricCompId} to defaults.`);
                                }
                              }}
                              className="px-4 py-3.5 border border-slate-800 hover:border-slate-700 bg-slate-950 text-slate-400 hover:text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-2"
                              title="Reset component rubrics to system defaults"
                            >
                              <RefreshCw className="h-4 w-4" />
                              <span>Reset Defaults</span>
                            </button>
                          </div>
                        </div>
                    )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )})()}

            {/* STAGE 3: Distribution Setup & Google Drive */}
            {activeStage === 'distribution' && (
              <div className="flex flex-col gap-6 animate-fadeIn">
                
                {/* Drive folder provisioning */}
                <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 flex flex-col gap-6">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Stage 3</span>
                    <h2 className="text-xl font-bold text-white mt-1">Assignment Distribution & Drive Setup</h2>
                    <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                      Provision student submission directories inside Google Drive automatically. Creates a root folder and component subfolders.
                    </p>
                  </div>

                  <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-5 flex flex-col gap-4">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-bold text-slate-300">Target Folder Structure</span>
                        <p className="text-[11px] text-slate-500 font-mono">
                          Google Drive/CourseArchitect - {courseCode}/ [Midterm, Project, Quizzes]
                        </p>
                      </div>

                      <button
                        onClick={handleProvisionDrive}
                        disabled={provisionState.isLoading || provisionState.provisioned}
                        className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 cursor-pointer ${
                          provisionState.provisioned 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
                        }`}
                      >
                        {provisionState.isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Provisioning Folders...</span>
                          </>
                        ) : provisionState.provisioned ? (
                          <>
                            <Check className="h-4 w-4" />
                            <span>Structure Provisioned</span>
                          </>
                        ) : (
                          <>
                            <FolderOpen className="h-4 w-4" />
                            <span>Generate Google Drive Structure</span>
                          </>
                        )}
                      </button>
                    </div>

                    {!provisionState.provisioned && (
                      <div className="border-t border-slate-900 pt-3 mt-1 flex flex-col gap-2 max-w-md">
                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Google Account Email (For Folder Access Sharing)
                        </label>
                        <input
                          type="email"
                          value={driveShareEmail}
                          onChange={(e) => {
                            setDriveShareEmail(e.target.value);
                            localStorage.setItem('lecturer_profile_email', e.target.value);
                          }}
                          placeholder="your.google.email@gmail.com"
                          className="bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-0 placeholder:text-slate-700"
                        />
                        <span className="text-[9.5px] text-slate-600 leading-normal">
                          The Google Service Account will automatically share editor permissions with this email when generating directories.
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Provisioned Folder Links Display */}
                  {provisionState.provisioned && (
                    <div className="bg-slate-950/80 border border-slate-900 rounded-xl p-4 flex flex-col gap-2.5">
                      <div className="flex items-center gap-2 border-b border-slate-900 pb-2 mb-1">
                        <FolderOpen className="h-4 w-4 text-emerald-400" />
                        <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Drive Directories Ready</span>
                      </div>
                      
                      {Object.entries(provisionState.folderLinks).map(([name, link]) => (
                        <div key={name} className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-slate-300">{name}</span>
                          <a 
                            href={link} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-indigo-400 hover:underline hover:text-indigo-300 truncate max-w-[280px] font-mono text-[10px]"
                          >
                            {link}
                          </a>
                        </div>
                      ))}

                      <div className="border-t border-slate-900 pt-3 mt-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm("Are you sure you want to reset the provisioned status? This will allow you to edit the email and re-provision folders.")) {
                              setProvisionState({ provisioned: false, folderLinks: {}, isLoading: false });
                              addLog("Cleared provisioned state. Roster is ready for re-sharing.");
                            }
                          }}
                          className="py-1 px-2.5 border border-slate-800 hover:border-rose-500/30 hover:bg-rose-500/5 text-slate-400 hover:text-rose-400 text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                        >
                          Reset Provision Status / Change Email
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Google Forms / Submission Webhook simulator */}
                <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 flex flex-col gap-6">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <RefreshCw className="h-4 w-4 text-violet-400" />
                      <span>Google Form Submission Sync</span>
                    </h3>
                    <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                      Simulate student submission delivery. Google Forms are linked to the Sheet; when students submit files via Form, they are automatically placed in their target Drive folder and marked as pending assessment.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border border-slate-900/80 rounded-xl p-4 bg-slate-950/20">
                      <h4 className="text-xs font-bold text-slate-300 mb-1.5">1. Connect Google Form</h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        Create a Google Form with fields: Student ID, Full Name, and File Upload. Make sure the Response destination is set to the designated spreadsheet.
                      </p>
                    </div>
                    <div className="border border-slate-900/80 rounded-xl p-4 bg-slate-950/20">
                      <h4 className="text-xs font-bold text-slate-300 mb-1.5">2. Webhook Sync</h4>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        CourseArchitect reads submissions records from the Response Sheet, and associates each upload PDF file with the corresponding student index.
                      </p>
                    </div>
                  </div>

                  <div className="h-px bg-slate-900"></div>

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={handleSimulateSubmissions}
                      disabled={isSimulatingSubmissions || submissionsSimulated || !provisionState.provisioned}
                      className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer ${
                        !provisionState.provisioned
                          ? 'bg-slate-900 border border-slate-800 text-slate-600 cursor-not-allowed'
                          : submissionsSimulated
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
                      }`}
                    >
                      {isSimulatingSubmissions ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Simulating Form Deliveries...</span>
                        </>
                      ) : submissionsSimulated ? (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Student Portfolios Seeded</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-4 w-4" />
                          <span>Simulate Student Submissions (Google Form Webhook)</span>
                        </>
                      )}
                    </button>
                    {!provisionState.provisioned && (
                      <span className="text-[10px] text-slate-500 text-center font-bold">
                        * Please provision Google Drive Folders first to unlock Form simulation.
                      </span>
                    )}
                  </div>
                </div>

                {/* Google Form Template Architect Card */}
                <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 flex flex-col gap-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Google Form Blueprint Architect</span>
                      <h3 className="text-sm font-bold text-white mt-0.5">Propose Form Structure for Assessments</h3>
                      <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                        If your assessment component is a Quiz, Test, or Exam, construct it via Google Forms. Below is the proposed layout to match CourseArchitect mapping.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-500 font-bold uppercase">Component:</span>
                        <select
                          value={selectedFormCompId}
                          onChange={(e) => setSelectedFormCompId(e.target.value)}
                          className="bg-slate-950 border border-slate-800 text-[11px] font-bold text-slate-200 py-1 px-2.5 rounded-lg focus:outline-none focus:border-indigo-500 cursor-pointer"
                        >
                          {components.map(c => (
                            <option key={c.id} value={c.id}>{c.name || 'Unnamed'}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-slate-500 font-bold uppercase">Format:</span>
                        <select
                          value={formTemplateTypeOverride}
                          onChange={(e) => setFormTemplateTypeOverride(e.target.value)}
                          className="bg-slate-950 border border-slate-800 text-[11px] font-bold text-slate-200 py-1 px-2.5 rounded-lg focus:outline-none focus:border-indigo-500 cursor-pointer"
                        >
                          <option value="auto">Auto-Detect ({detectedFormType.toUpperCase()})</option>
                          <option value="quiz">Quiz Format</option>
                          <option value="test_exam">Test / Exam Format</option>
                          <option value="assignment">Assignment / Project Upload</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="h-px bg-slate-900"></div>

                  {/* Display Blueprint content */}
                  <div className="bg-slate-950/60 border border-slate-900/60 rounded-xl p-5 flex flex-col gap-4">
                    <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Google Form Proposed Setup</span>
                        <h4 className="text-xs font-mono font-bold text-slate-200">{formBlueprint.title}</h4>
                      </div>
                      <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[9px] font-mono font-bold uppercase border border-indigo-500/15">
                        {finalFormType.replace('_', ' ')} format
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 leading-relaxed italic bg-slate-950 p-3 rounded-lg border border-slate-900/40">
                      <strong>Form Description:</strong> {formBlueprint.desc}
                    </div>

                    {/* Render Sections */}
                    <div className="flex flex-col gap-4">
                      {formBlueprint.sections.map((sect, sIdx) => (
                        <div key={sIdx} className="bg-slate-900/30 border border-slate-900/50 rounded-xl p-3.5 flex flex-col gap-3">
                          <span className="text-xs font-bold text-slate-300 border-b border-slate-900 pb-1.5">
                            {sect.name}
                          </span>
                          <div className="flex flex-col gap-2.5">
                            {sect.fields.map((f, fIdx) => (
                              <div key={fIdx} className="bg-slate-950/60 border border-slate-900 rounded-lg p-3 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-bold text-slate-200">{f.label}</span>
                                    {f.req && <span className="text-rose-500 font-bold text-[9px] uppercase border border-rose-500/10 px-1 py-0.2 rounded bg-rose-500/5">* Required</span>}
                                  </div>
                                  {f.note && <p className="text-[10px] text-slate-500 italic mt-0.5">{f.note}</p>}
                                  {f.options && (
                                    <div className="flex flex-col gap-1 mt-1.5 pl-2.5 border-l border-slate-800">
                                      {f.options.map((opt, oIdx) => (
                                        <span key={oIdx} className={`text-[10px] font-mono ${opt.includes('Answer Key') ? 'text-emerald-400 font-semibold' : 'text-slate-500'}`}>
                                          • {opt}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 ml-auto md:ml-0 flex-shrink-0">
                                  {f.points !== undefined && (
                                    <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[10px] font-bold">
                                      {f.points} pts
                                    </span>
                                  )}
                                  <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 text-[10px] font-mono border border-slate-800">
                                    {f.type}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="h-px bg-slate-900 my-1"></div>

                    {/* Form Settings Guidance */}
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Required Google Form Settings</span>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                        {formBlueprint.settings.map((set, setIdx) => (
                          <div key={setIdx} className="bg-slate-900/20 border border-slate-900/60 p-2.5 rounded-lg flex justify-between">
                            <span className="text-slate-400">{set.key}:</span>
                            <span className="font-bold text-slate-300 font-mono text-[10px]">{set.val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Class Roster ({students.length} Students)</span>
                    <button 
                      onClick={() => {
                        setStudents(DEFAULT_STUDENTS);
                        setSubmissionsSimulated(false);
                        addLog("Reset student roster to baseline configuration.");
                      }}
                      className="text-[10px] text-indigo-400 hover:underline font-bold bg-transparent border-0 cursor-pointer"
                    >
                      Reset Class List
                    </button>
                  </div>

                  <div className="max-h-60 overflow-y-auto border border-slate-900 rounded-xl">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-950 sticky top-0">
                        <tr>
                          <th className="py-2.5 px-4 text-slate-500">Student ID</th>
                          <th className="py-2.5 px-4 text-slate-500">Full Name</th>
                          <th className="py-2.5 px-4 text-slate-500">University Email</th>
                          <th className="py-2.5 px-4 text-slate-500 text-right">Portfolio File</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((stud) => (
                          <tr key={stud.id} className="border-b border-slate-900/40 hover:bg-slate-900/10">
                            <td className="py-2.5 px-4 font-mono font-bold text-slate-300">{stud.id}</td>
                            <td className="py-2.5 px-4 text-slate-300 font-semibold">{stud.name}</td>
                            <td className="py-2.5 px-4 text-slate-400">{stud.email}</td>
                            <td className="py-2.5 px-4 text-right">
                              {stud.submissionLink ? (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono truncate max-w-[120px] inline-block">
                                  Linked (PDF)
                                </span>
                              ) : (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950 text-slate-600 border border-slate-900">
                                  No Submission
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* STAGE 4: Interactive Grading Desk */}
            {activeStage === 'grading' && (
              <div className="flex flex-col gap-6 animate-fadeIn">
                
                {/* Multi-Lecturer Settings Header */}
                <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-white">Lecturers Multi-Grading Desk</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">Configure independent double-blind evaluation boards for quality assurance.</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-xs font-bold text-slate-350 cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        checked={enableDoubleMarking}
                        onChange={(e) => {
                          setEnableDoubleMarking(e.target.checked);
                          addLog(`Multi-Lecturer Double Grading: ${e.target.checked ? 'ENABLED' : 'DISABLED'}`);
                        }}
                        className="rounded border-slate-800 bg-slate-950 text-indigo-600 focus:ring-indigo-500/20 cursor-pointer"
                      />
                      <span>Enable Double-Blind Independent Marking</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  
                  {/* Left Roster Panel (cols: 5) */}
                  <div className="md:col-span-5 flex flex-col gap-4 bg-slate-900/40 border border-slate-900 rounded-2xl p-4 max-h-[600px] overflow-y-auto">
                    <div className="flex justify-between items-center border-b border-slate-900 pb-3">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Class Roster</span>
                      <button 
                        onClick={handleAutoGradeAll}
                        className="text-[10px] bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 text-indigo-400 font-bold px-2 py-1 rounded-lg cursor-pointer"
                      >
                        Auto-Grade All
                      </button>
                    </div>

                    <div className="flex flex-col gap-2">
                      {students.map((stud) => {
                        const isSelected = selectedStudentId === stud.id;
                        const hasGradeForActive = stud.grades[activeGradingCompId] !== undefined;

                        return (
                          <button
                            key={stud.id}
                            onClick={() => {
                              setSelectedStudentId(stud.id);
                              setSaveStatus(null);
                            }}
                            className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                              isSelected 
                                ? 'bg-gradient-to-r from-indigo-950 to-indigo-900/40 border-indigo-500 text-white'
                                : 'bg-slate-950/40 border-slate-900/80 text-slate-400 hover:border-slate-800 hover:bg-slate-900/20'
                            }`}
                          >
                            <div className="flex flex-col gap-0.5">
                              <span className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                                {stud.name}
                              </span>
                              <span className="text-[10px] font-mono text-slate-500">{stud.id}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              {hasGradeForActive ? (
                                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold font-mono">
                                  {stud.grades[activeGradingCompId]}%
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[9px] font-bold font-mono">
                                  Pending
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Grading Desk Panel (cols: 7) */}
                  <div className="md:col-span-7 flex flex-col gap-6 bg-slate-900/40 border border-slate-900 rounded-2xl p-6">
                    
                    {/* Header selection info */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-900 pb-4">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Evaluation Sheet</span>
                        <h3 className="text-base font-bold text-white mt-0.5">
                          {students.find(s => s.id === selectedStudentId)?.name || 'Select Student'}
                        </h3>
                        {students.find(s => s.id === selectedStudentId)?.submissionLink && (
                          <a 
                            href={students.find(s => s.id === selectedStudentId)?.submissionLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-indigo-400 hover:underline flex items-center gap-1 mt-1 font-mono"
                          >
                            <FolderOpen className="h-3 w-3" /> View Submitted Portfolio PDF
                          </a>
                        )}
                      </div>

                      <div className="flex flex-col md:flex-row items-start md:items-center gap-3">
                        {enableDoubleMarking && (
                          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-1">
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMarker('Marker A');
                                setSaveStatus(null);
                              }}
                              className={`py-1 px-2.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                activeMarker === 'Marker A'
                                  ? 'bg-indigo-600 text-white shadow-sm'
                                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/10'
                              }`}
                            >
                              Marker A
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveMarker('Marker B');
                                setSaveStatus(null);
                              }}
                              className={`py-1 px-2.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                activeMarker === 'Marker B'
                                  ? 'bg-indigo-600 text-white shadow-sm'
                                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/10'
                              }`}
                            >
                              Marker B
                            </button>
                          </div>
                        )}

                        {/* Grading Component Picker */}
                        <select 
                          value={activeGradingCompId}
                          onChange={(e) => {
                            setActiveGradingCompId(e.target.value);
                            setSaveStatus(null);
                          }}
                          className="bg-slate-950 border border-slate-800 text-xs font-bold text-slate-200 py-1.5 px-3 rounded-lg focus:outline-none focus:border-indigo-500 cursor-pointer w-full md:w-auto"
                        >
                          {components.map(c => (
                            <option key={c.id} value={c.id}>{c.name || 'Unnamed'}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Double Grading Summary Board */}
                    {(() => {
                      if (!enableDoubleMarking) return null;
                      const currentStudentGrades = markerGrades[selectedStudentId] || {};
                      const compGrading = currentStudentGrades[activeGradingCompId] || {};
                      
                      const markerA = compGrading.markerAScore;
                      const markerB = compGrading.markerBScore;
                      const moderated = compGrading.moderatedScore;
                      const remarks = compGrading.moderatorRemarks || '';

                      const hasA = markerA !== undefined;
                      const hasB = markerB !== undefined;
                      const hasBoth = hasA && hasB;
                      const variance = hasBoth ? Math.abs(markerA! - markerB!) : null;
                      const isConflict = variance !== null && variance > 10;
                      const isReconciled = variance !== null && variance <= 10;

                      return (
                        <div className="bg-slate-950/60 border border-slate-900 rounded-xl p-4 flex flex-col gap-4">
                          <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Double-Blind Marking Board</span>
                            <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 text-[9px] font-bold uppercase tracking-wider">
                              Independent Evaluation
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                            <div className="bg-slate-900/40 border border-slate-900 p-3 rounded-lg flex flex-col gap-1">
                              <span className="text-[9px] text-slate-500 font-bold uppercase">Lecturer A Score</span>
                              <span className="text-sm font-bold text-slate-200">
                                {hasA ? `${markerA}%` : <span className="text-slate-600 italic text-[11px]">Not Graded</span>}
                              </span>
                            </div>

                            <div className="bg-slate-900/40 border border-slate-900 p-3 rounded-lg flex flex-col gap-1">
                              <span className="text-[9px] text-slate-500 font-bold uppercase">Lecturer B Score</span>
                              <span className="text-sm font-bold text-slate-200">
                                {hasB ? `${markerB}%` : <span className="text-slate-600 italic text-[11px]">Not Graded</span>}
                              </span>
                            </div>

                            <div className="bg-slate-900/40 border border-slate-900 p-3 rounded-lg flex flex-col gap-1">
                              <span className="text-[9px] text-slate-500 font-bold uppercase">Score Variance</span>
                              <span className={`text-sm font-bold ${
                                isConflict ? 'text-rose-400 bg-rose-500/5 px-1 py-0.5 rounded' : isReconciled ? 'text-emerald-400 bg-emerald-500/5 px-1 py-0.5 rounded' : 'text-slate-400'
                              }`}>
                                {variance !== null ? `${variance}%` : <span className="text-slate-400 italic text-[11px]">—</span>}
                              </span>
                            </div>
                          </div>

                          {/* Status and Reconciliation message */}
                          <div className="text-[11px] leading-relaxed">
                            {!hasBoth ? (
                              <div className="text-slate-500 flex items-center gap-1.5 bg-slate-900/20 p-2.5 rounded-lg border border-slate-900">
                                <Info className="h-4 w-4 text-slate-600 flex-shrink-0" />
                                <span>Awaiting grading from both Marker A and Marker B to calculate consensus score.</span>
                              </div>
                            ) : isReconciled && moderated === undefined ? (
                              <div className="text-emerald-400 flex items-start gap-2 bg-emerald-500/5 p-2.5 rounded-lg border border-emerald-500/10">
                                <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="font-bold">Auto-Reconciled Successfully (Variance ≤ 10%)</p>
                                  <p className="text-slate-400 text-[10px] mt-0.5">Final committed score is the mathematical average: <strong>{Math.round(((markerA! + markerB!) / 2) * 100) / 100}%</strong></p>
                                </div>
                              </div>
                            ) : isConflict && moderated === undefined ? (
                              <div className="text-amber-400 flex items-start gap-2 bg-amber-500/5 p-2.5 rounded-lg border border-amber-500/10 animate-pulse">
                                <AlertTriangle className="h-4.5 w-4.5 text-amber-500 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="font-bold">Discrepancy Conflict Flagged (Variance &gt; 10%)</p>
                                  <p className="text-slate-400 text-[10px] mt-0.5">Lecturers gave different scores that exceed university thresholds. A Moderator must review and key in a final reconciled grade below.</p>
                                </div>
                              </div>
                            ) : moderated !== undefined ? (
                              <div className="text-indigo-400 flex items-start gap-2 bg-indigo-500/5 p-2.5 rounded-lg border border-indigo-500/10">
                                <CheckCircle2 className="h-4.5 w-4.5 text-indigo-400 flex-shrink-0 mt-0.5" />
                                <div>
                                  <p className="font-bold">Committed Moderated Final Score</p>
                                  <p className="text-slate-300 text-[10px] mt-0.5">Score overridden to: <strong>{moderated}%</strong></p>
                                  {remarks && <p className="text-slate-500 text-[9.5px] italic mt-1 font-mono">Remarks: "{remarks}"</p>}
                                </div>
                              </div>
                            ) : null}
                          </div>

                          {/* Moderator Override Section */}
                          {hasBoth && (
                            <div className="border-t border-slate-900 pt-3 flex flex-col gap-2">
                              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">Moderation & Reconciliation Panel</span>
                              <div className="flex flex-col sm:flex-row gap-2">
                                <div className="flex-1 relative flex items-center">
                                  <input 
                                    type="number"
                                    placeholder="Moderated Score (%)"
                                    defaultValue={moderated !== undefined ? moderated : ''}
                                    id="moderator-score-input"
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                                  />
                                  <span className="absolute right-3 text-slate-600 text-xs">%</span>
                                </div>
                                <input 
                                  type="text"
                                  placeholder="Moderator remarks / notes..."
                                  defaultValue={remarks}
                                  id="moderator-remarks-input"
                                  className="flex-[2] bg-slate-950 border border-slate-800 rounded-lg py-2 px-3 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    const scoreVal = parseFloat((document.getElementById('moderator-score-input') as HTMLInputElement)?.value);
                                    const remarksVal = (document.getElementById('moderator-remarks-input') as HTMLInputElement)?.value || '';
                                    if (isNaN(scoreVal) || scoreVal < 0 || scoreVal > 100) {
                                      alert("Please enter a valid moderated score percentage between 0 and 100.");
                                      return;
                                    }
                                    
                                    const updatedComp = {
                                      ...compGrading,
                                      moderatedScore: scoreVal,
                                      moderatorRemarks: remarksVal
                                    };
                                    setMarkerGrades(prev => ({
                                      ...prev,
                                      [selectedStudentId]: {
                                        ...(prev[selectedStudentId] || {}),
                                        [activeGradingCompId]: updatedComp
                                      }
                                    }));
                                    
                                    commitFinalComponentGrade(selectedStudentId, activeGradingCompId, scoreVal);
                                    addLog(`MODERATOR OVERRIDE for ${selectedStudentId} [${activeGradingCompId}]: Final committed score set to ${scoreVal}% with remarks.`);
                                  }}
                                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg shadow cursor-pointer transition-all whitespace-nowrap"
                                >
                                  Commit Moderated Score
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}

                    {/* Criteria Scoring Grid / Quantitative Marks Entry */}
                    {(() => {
                      const comp = components.find(c => c.id === activeGradingCompId);
                      const isQuantitative = comp?.assessmentType === 'quantitative';
                      if (isQuantitative) {
                        const brief = assessmentBriefs[activeGradingCompId] || { maxPoints: 100 };
                        const maxPoints = brief.maxPoints || 100;

                        // Let's get current score for active marker
                        const studentGrades = markerGrades[selectedStudentId] || {};
                        const compGrading = studentGrades[activeGradingCompId] || {};
                        const committedGrade = students.find(s => s.id === selectedStudentId)?.grades[activeGradingCompId];

                        // Determine initial raw score value to show in input
                        let currentPct = 0;
                        if (enableDoubleMarking) {
                          currentPct = (activeMarker === 'Marker A' ? compGrading.markerAScore : compGrading.markerBScore) || 0;
                        } else {
                          currentPct = committedGrade || 0;
                        }
                        const currentRaw = Math.round((currentPct / 100) * maxPoints * 100) / 100;

                        return (
                          <div className="bg-slate-950/40 border border-slate-900 rounded-xl p-5 flex flex-col gap-4">
                            <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                              <div>
                                <h4 className="text-xs font-bold text-slate-200">Quantitative Marks Input</h4>
                                <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Enter direct score. The system scales it to percentage and weightage automatically.</p>
                              </div>
                              <span className="text-xs font-mono font-bold text-indigo-400">Max Marks: {maxPoints} Marks</span>
                            </div>

                            <div className="flex flex-col sm:flex-row items-center gap-4">
                              <div className="flex-1 w-full flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Raw Score Obtained</label>
                                <div className="relative flex items-center">
                                  <input
                                    type="number"
                                    min={0}
                                    max={maxPoints}
                                    step="any"
                                    placeholder={`0 - ${maxPoints}`}
                                    defaultValue={currentRaw || ''}
                                    key={`${selectedStudentId}_${activeGradingCompId}_${activeMarker}`}
                                    id="quantitative-raw-score-input"
                                    onChange={(e) => {
                                      const rawVal = parseFloat(e.target.value) || 0;
                                      const pct = Math.min(100, Math.max(0, Math.round((rawVal / maxPoints) * 100 * 100) / 100));
                                      const pctSpan = document.getElementById('quant-percentage-display');
                                      if (pctSpan) pctSpan.innerText = `${pct}%`;
                                    }}
                                    className="w-full bg-slate-950 border border-slate-850 rounded-lg py-2.5 px-3.5 text-slate-200 text-sm focus:outline-none focus:border-indigo-500 focus:ring-0 placeholder:text-slate-700"
                                  />
                                  <span className="absolute right-3.5 text-slate-500 text-xs font-mono">/ {maxPoints}</span>
                                </div>
                              </div>

                              <div className="w-full sm:w-28 flex flex-col items-center justify-center p-3.5 bg-slate-950 border border-slate-850 rounded-xl flex-shrink-0">
                                <span className="text-[9px] text-slate-500 font-bold uppercase">Percentage</span>
                                <span id="quant-percentage-display" className="text-lg font-mono font-bold text-emerald-400 mt-1">
                                  {currentPct}%
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                const input = document.getElementById('quantitative-raw-score-input') as HTMLInputElement;
                                const rawVal = parseFloat(input?.value);
                                if (isNaN(rawVal) || rawVal < 0 || rawVal > maxPoints) {
                                  alert(`Please enter a valid raw score between 0 and ${maxPoints}.`);
                                  return;
                                }

                                const pctScore = Math.round((rawVal / maxPoints) * 100 * 100) / 100;

                                if (!enableDoubleMarking) {
                                  commitFinalComponentGrade(selectedStudentId, activeGradingCompId, pctScore);
                                  addLog(`Graded Student ${selectedStudentId} [${activeGradingCompId}]: Direct raw score ${rawVal}/${maxPoints} (${pctScore}%)`);
                                } else {
                                  const currentStudentGrades = markerGrades[selectedStudentId] || {};
                                  const compGrading = currentStudentGrades[activeGradingCompId] || {};
                                  const newCompGrading = { ...compGrading };

                                  if (activeMarker === 'Marker A') {
                                    newCompGrading.markerAScore = pctScore;
                                  } else {
                                    newCompGrading.markerBScore = pctScore;
                                  }

                                  let autoFinalScore: number | undefined = undefined;
                                  const markerA = newCompGrading.markerAScore;
                                  const markerB = newCompGrading.markerBScore;

                                  if (markerA !== undefined && markerB !== undefined) {
                                    const variance = Math.abs(markerA - markerB);
                                    if (variance <= 10) {
                                      autoFinalScore = Math.round(((markerA + markerB) / 2) * 100) / 100;
                                    }
                                  }

                                  const newMarkerGrades = {
                                    ...markerGrades,
                                    [selectedStudentId]: {
                                      ...currentStudentGrades,
                                      [activeGradingCompId]: newCompGrading
                                    }
                                  };
                                  setMarkerGrades(newMarkerGrades);

                                  if (autoFinalScore !== undefined) {
                                    commitFinalComponentGrade(selectedStudentId, activeGradingCompId, autoFinalScore);
                                    addLog(`Double Grading updated for ${selectedStudentId} [${activeGradingCompId}]: Marker A: ${markerA}%, Marker B: ${markerB}%. Auto-Reconciled to: ${autoFinalScore}%`);
                                  } else if (markerA !== undefined && markerB !== undefined) {
                                    addLog(`Conflict recorded for ${selectedStudentId} [${activeGradingCompId}]: Marker A: ${markerA}%, Marker B: ${markerB}%. Variance exceeds 10% threshold. Moderator review required.`);
                                  } else {
                                    addLog(`Saved ${activeMarker} score (${pctScore}%) for student ${selectedStudentId} [${activeGradingCompId}].`);
                                  }
                                }
                                setSaveStatus({ success: true, message: 'Grade saved successfully!' });
                                setTimeout(() => setSaveStatus(null), 3000);
                              }}
                              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
                            >
                              <Save className="h-4 w-4" />
                              <span>Save Quantitative Grade</span>
                            </button>

                            {saveStatus?.success && (
                              <div className="text-center text-[10px] text-emerald-400 font-bold animate-pulse">
                                ✓ Grade saved successfully!
                              </div>
                            )}
                          </div>
                        );
                      }

                      // Else show original Rubric scoring
                      if (currentGradingRubric.length === 0) {
                        return (
                          <div className="text-center py-12">
                            <AlertTriangle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                            <p className="text-slate-500 text-xs font-semibold">No rubrics criteria defined for this component.</p>
                            <p className="text-[10px] text-slate-500 mt-1">Please head to Stage 2: Rubrics to design scoring criteria.</p>
                          </div>
                        );
                      }

                      return (
                        <div className="flex flex-col gap-6">
                          {currentGradingRubric.map((crit) => {
                            const mappedClos = cloList.filter(clo => (cloPloMapping[`${activeGradingCompId}_${clo.id}`] || 0) > 0);
                            const targetLevels = mappedClos.map(clo => clo.level).filter(Boolean);
                            const targetLevelsText = targetLevels.length > 0 ? targetLevels.join('/') : '';

                            return (
                              <div key={crit.id} className="flex flex-col gap-2">
                                <div className="flex justify-between text-xs font-bold text-slate-300">
                                  <span>{crit.name}</span>
                                  <span className="text-slate-500">Share weight: {crit.weight}%</span>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                                  {crit.levels.map((level) => {
                                    const isSelected = crit.selectedLevel === level.score;
                                    return (
                                      <button
                                        key={level.score}
                                        type="button"
                                        onClick={() => handleGradingLevelClick(crit.id, level.score)}
                                        title={level.desc}
                                        className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 cursor-pointer transition-all ${
                                          isSelected
                                            ? 'bg-gradient-to-tr from-indigo-950 to-indigo-900 border-indigo-500 text-white shadow-md'
                                            : level.score === 3
                                              ? 'bg-indigo-950/15 border-indigo-500/30 text-slate-300 hover:border-indigo-500/40 hover:bg-indigo-950/20'
                                              : 'bg-slate-950/40 border-slate-900/60 text-slate-400 hover:border-slate-800 hover:bg-slate-900/20'
                                        }`}
                                      >
                                        <div className="flex justify-between items-center text-[10px] font-mono border-b border-slate-900/40 pb-1 w-full font-bold">
                                          <span className="flex items-center gap-1">
                                            L{level.score}
                                            {level.score === 3 && targetLevelsText && (
                                              <span className="text-[7.5px] font-bold text-emerald-400 uppercase font-sans tracking-tight">[{targetLevelsText}]</span>
                                            )}
                                          </span>
                                          <span className={isSelected ? 'text-indigo-400' : 'text-slate-500'}>
                                            {level.label}
                                          </span>
                                        </div>
                                        <p className="text-[9px] leading-relaxed text-slate-500 mt-1">
                                          {level.desc}
                                        </p>
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}

                          <div className="h-px bg-slate-900 mt-2"></div>

                          {/* Grading desk actions */}
                          <div className="flex items-center gap-3">
                            <button
                              onClick={handleSaveStudentGrade}
                              className="flex-1 py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 border-0"
                            >
                              <Save className="h-4 w-4" />
                              <span>
                                {enableDoubleMarking 
                                  ? `Record ${activeMarker} Score` 
                                  : 'Commit Student Mark'}
                              </span>
                            </button>
                            
                            <button
                              onClick={handleSyncGradesToSheets}
                              className="px-4 py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow transition-all cursor-pointer flex items-center gap-2 border-0"
                            >
                              <FileSpreadsheet className="h-4 w-4" />
                              <span>Sync to Sheets</span>
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Overall Coursework Marking Progress Table */}
                  <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 flex flex-col gap-6 print:break-before-page">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-900 pb-4">
                      <div>
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                          <FileSpreadsheet className="h-5 w-5 text-emerald-400" />
                          <span>Overall Coursework Marking Progress</span>
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">Consolidated marksheet ledger showing scores for all components and computed final coursework marks.</p>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <button
                          type="button"
                          onClick={handleSyncGradesToSheets}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow cursor-pointer transition-all flex items-center gap-1.5 border-0"
                        >
                          <FileSpreadsheet className="h-4 w-4" />
                          <span>Export Marksheet to Google Sheets</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const printWindow = window.open('', '_blank');
                            if (printWindow) {
                              const html = `
                                <html>
                                  <head>
                                    <title>Overall Coursework Marking Progress - ${courseCode}</title>
                                    <style>
                                      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 40px; color: #1e293b; }
                                      h1 { font-size: 20px; font-weight: bold; margin-bottom: 5px; }
                                      p { font-size: 12px; color: #64748b; margin-top: 0; margin-bottom: 20px; }
                                      table { border-collapse: collapse; width: 100%; margin-top: 10px; font-size: 11px; }
                                      th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
                                      th { background-color: #f8fafc; font-weight: bold; }
                                      .badge { padding: 2px 6px; border-radius: 4px; font-weight: bold; font-size: 10px; }
                                      .graded { background-color: #dcfce7; color: #15803d; }
                                      .pending { background-color: #fef3c7; color: #b45309; }
                                    </style>
                                  </head>
                                  <body>
                                    <h1>Overall Coursework Marking Progress</h1>
                                    <p>Course Code: ${courseCode} | Semester: ${semester || 'Semester 1'} | Date Generated: ${new Date().toLocaleDateString()}</p>
                                    <table>
                                      <thead>
                                        <tr>
                                          <th>Student ID</th>
                                          <th>Student Name</th>
                                          ${components.map(c => `<th>${c.name} (${c.weight}%)</th>`).join('')}
                                          <th>Final Coursework Mark (100%)</th>
                                          <th>Status</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        ${students.map(s => `
                                          <tr>
                                            <td>${s.id}</td>
                                            <td>${s.name}</td>
                                            ${components.map(c => {
                                              const val = s.grades[c.id];
                                              return `<td>${val !== undefined ? `${val}%` : '—'}</td>`;
                                            }).join('')}
                                            <td><strong>${s.finalMark !== undefined ? `${s.finalMark}%` : '—'}</strong></td>
                                            <td><span class="badge ${s.status === 'Graded' ? 'graded' : 'pending'}">${s.status}</span></td>
                                          </tr>
                                        `).join('')}
                                      </tbody>
                                    </table>
                                  </body>
                                </html>
                              `;
                              printWindow.document.write(html);
                              printWindow.document.close();
                              printWindow.print();
                            }
                          }}
                          className="px-4 py-2 border border-slate-800 hover:border-slate-700 bg-slate-950 text-slate-300 hover:text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                        >
                          <Printer className="h-4 w-4" />
                          <span>Print Marksheet</span>
                        </button>
                      </div>
                    </div>

                    {/* Spreadsheet Paste / Importer Box */}
                    <div className="bg-slate-950/40 border border-slate-900 rounded-xl p-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-300">Spreadsheet Batch Importer (Optional)</span>
                        <button
                          type="button"
                          onClick={() => {
                            const template = `Student ID\tScore\nS101\t85\nS102\t90\nS103\t75`;
                            navigator.clipboard.writeText(template);
                            alert("Example spreadsheet template copied to clipboard! Paste it into Excel or Google Sheets to prepare your marks.");
                          }}
                          className="text-[10px] text-indigo-400 hover:underline font-bold bg-transparent border-0 cursor-pointer"
                        >
                          Copy Excel Template Example
                        </button>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                        Copy grades from Excel or Google Sheets (Column A: <strong>Student ID</strong>, Column B: <strong>Score</strong>) and paste them here to update grades for the active component in bulk.
                      </p>
                      <div className="flex flex-col gap-2">
                        <textarea
                          id="spreadsheet-paste-importer"
                          placeholder="Paste spreadsheet columns here... (e.g. S101 [Tab] 85)"
                          rows={3}
                          className="w-full bg-slate-950 border border-slate-850 rounded-lg p-2.5 text-slate-300 text-xs font-mono focus:outline-none focus:border-indigo-500 focus:ring-0 resize-none placeholder:text-slate-700"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const txt = (document.getElementById('spreadsheet-paste-importer') as HTMLInputElement)?.value;
                            if (!txt || !txt.trim()) {
                              alert("Please paste some columns data first!");
                              return;
                            }
                            const activeComp = components.find(c => c.id === activeGradingCompId);
                            if (!activeComp) return;
                            const brief = assessmentBriefs[activeGradingCompId] || { maxPoints: 100 };
                            const maxPoints = brief.maxPoints || 100;

                            const lines = txt.split('\n');
                            let updatedStudents = [...students];
                            let count = 0;

                            lines.forEach(line => {
                              const parts = line.split('\t');
                              if (parts.length >= 2) {
                                const sId = parts[0]?.trim();
                                const scoreVal = parseFloat(parts[1]?.trim());
                                if (sId && !isNaN(scoreVal)) {
                                  // Raw score to percentage
                                  const scorePct = activeComp.assessmentType === 'quantitative'
                                    ? Math.min(100, Math.max(0, Math.round((scoreVal / maxPoints) * 100 * 100) / 100))
                                    : scoreVal;

                                  updatedStudents = updatedStudents.map(s => {
                                    if (s.id.toLowerCase() === sId.toLowerCase() || s.name.toLowerCase() === sId.toLowerCase()) {
                                      count++;
                                      const newGrades = { ...s.grades, [activeGradingCompId]: scorePct };
                                      
                                      let finalWeighted = 0;
                                      let activeWeightsSum = 0;
                                      components.forEach(comp => {
                                        const compGrade = newGrades[comp.id];
                                        if (compGrade !== undefined) {
                                          finalWeighted += (compGrade / 100) * comp.weight;
                                          activeWeightsSum += comp.weight;
                                        }
                                      });
                                      const finalMark = activeWeightsSum > 0 ? Math.round((finalWeighted * (100 / activeWeightsSum)) * 100) / 100 : 0;

                                      return {
                                        ...s,
                                        grades: newGrades,
                                        status: Object.keys(newGrades).length === components.length ? 'Graded' : 'Pending',
                                        finalMark
                                      };
                                    }
                                    return s;
                                  });
                                }
                              }
                            });

                            if (count > 0) {
                              setStudents(updatedStudents);
                              addLog(`SUCCESS: Imported ${count} student grades for component [${activeComp.name}] from spreadsheet paste.`);
                              (document.getElementById('spreadsheet-paste-importer') as HTMLInputElement).value = '';
                              alert(`Imported ${count} student grades successfully!`);
                            } else {
                              alert("Could not parse any matching Student ID or scores. Make sure you copy both Student ID and Score columns from your spreadsheet.");
                            }
                          }}
                          className="py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition-all border-0 self-end px-5"
                        >
                          Import and Update Grades
                        </button>
                      </div>
                    </div>

                    {/* Marksheet grid table view */}
                    <div className="overflow-x-auto border border-slate-900 rounded-xl">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="bg-slate-950 border-b border-slate-900 text-slate-400 font-bold uppercase text-[9px] tracking-wider">
                            <th className="py-3 px-4">Student ID</th>
                            <th className="py-3 px-4">Student Name</th>
                            {components.map(c => (
                              <th key={c.id} className="py-3 px-4">
                                {c.name} ({c.weight}%)
                              </th>
                            ))}
                            <th className="py-3 px-4">Weighted Coursework Mark (100%)</th>
                            <th className="py-3 px-4">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-900">
                          {students.map((stud) => {
                            const isGraded = stud.status === 'Graded';
                            return (
                              <tr key={stud.id} className="hover:bg-slate-900/10 transition-colors">
                                <td className="py-3.5 px-4 font-mono font-bold text-slate-300">{stud.id}</td>
                                <td className="py-3.5 px-4 text-slate-200">{stud.name}</td>
                                {components.map(c => {
                                  const gradePct = stud.grades[c.id];
                                  const isCompQuant = c.assessmentType === 'quantitative';
                                  const brief = assessmentBriefs[c.id] || { maxPoints: 100 };
                                  const maxPoints = brief.maxPoints || 100;
                                  const rawVal = gradePct !== undefined ? Math.round((gradePct / 100) * maxPoints * 100) / 100 : null;

                                  return (
                                    <td key={c.id} className="py-3.5 px-4 text-slate-300">
                                      {gradePct !== undefined ? (
                                        <div className="flex flex-col gap-0.5">
                                          <span className="font-bold">{gradePct}%</span>
                                          {isCompQuant && rawVal !== null && (
                                            <span className="text-[10px] text-slate-500 font-mono">({rawVal}/{maxPoints} marks)</span>
                                          )}
                                        </div>
                                      ) : (
                                        <span className="text-slate-500 italic">Pending</span>
                                      )}
                                    </td>
                                  );
                                })}
                                <td className="py-3.5 px-4">
                                  <span className="font-mono font-bold text-sm text-indigo-400">
                                    {stud.finalMark !== undefined ? `${stud.finalMark}%` : '—'}
                                  </span>
                                </td>
                                <td className="py-3.5 px-4">
                                  <span className={`px-2.5 py-1 rounded-lg text-[9px] font-bold uppercase border ${
                                    isGraded
                                      ? 'bg-emerald-500/10 text-emerald-405 border-emerald-500/15'
                                      : 'bg-amber-500/10 text-amber-405 border-amber-500/15 animate-pulse'
                                  }`}>
                                    {stud.status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

            {/* STAGE 5: Quality Sampling & Moderator Pack */}
            {activeStage === 'sampling' && (
              <div className="flex flex-col gap-6 animate-fadeIn">
                <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 flex flex-col gap-6">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Stage 5</span>
                    <h2 className="text-xl font-bold text-white mt-1">Accreditation Quality Sampling</h2>
                    <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                      Extract representative portfolios of student work for external moderation audits based on standard quality assurance rules.
                    </p>
                  </div>

                  {/* Sampling configuration parameters */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/40 border border-slate-900 rounded-xl p-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Sampling Rule</label>
                      <select 
                        value={samplingRule}
                        onChange={(e) => setSamplingRule(e.target.value as any)}
                        className="bg-slate-950 border border-slate-800 text-xs font-bold text-slate-200 py-2 px-3 rounded-lg focus:outline-none focus:border-indigo-500 cursor-pointer"
                      >
                        <option value="tmb">Top, Mid, Bottom Sample</option>
                        <option value="random">10% Random Draw</option>
                        <option value="clustered">Average Score Cluster</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5 md:col-span-2 text-xs text-slate-400 leading-relaxed justify-center">
                      <p>
                        {samplingRule === 'tmb' && 'Top, Mid, Bottom extracts 9 students: 3 highest scorers, 3 median scorers, and 3 lowest scorers. Ideal for comprehensive audits.'}
                        {samplingRule === 'random' && 'Extracts a randomized set of 9 student submissions, ensuring zero selector bias.'}
                        {samplingRule === 'clustered' && 'Extracts 9 students clustered around the average class scoring zone to inspect typical learning outcomes.'}
                      </p>
                    </div>
                  </div>

                  <div className="h-px bg-slate-900"></div>

                  {/* Sampled students list */}
                  <div className="flex flex-col gap-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Selected Audit Candidates ({sampledList.length})</span>
                    
                    {sampledList.length === 0 ? (
                      <div className="text-center py-10 border border-dashed border-slate-900 rounded-xl">
                        <AlertTriangle className="h-6 w-6 text-amber-500 mx-auto mb-1" />
                        <p className="text-slate-500 text-xs font-semibold">No graded student profiles found.</p>
                        <p className="text-[10px] text-slate-600 mt-1">Grade students in Stage 4: Grading Workspace to construct samples.</p>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {sampledList.map((stud, idx) => {
                          const tag = idx < 3 ? 'HIGH' : idx < 6 ? 'MID' : 'LOW';
                          const tagColor = idx < 3 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15' 
                            : idx < 6 
                              ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/15' 
                              : 'bg-rose-500/10 text-rose-400 border-rose-500/15';

                          return (
                            <div key={stud.id} className="bg-slate-950/60 border border-slate-900/60 rounded-xl p-3 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="h-7 w-7 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-xs font-mono font-bold text-slate-400">
                                  {stud.id}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold text-slate-200">{stud.name}</span>
                                  <span className="text-[10px] text-slate-500">{stud.email}</span>
                                </div>
                              </div>

                              <div className="flex items-center gap-4">
                                {samplingRule === 'tmb' && (
                                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${tagColor}`}>
                                    {tag} SAMPLE
                                  </span>
                                )}
                                <div className="flex flex-col items-end">
                                  <span className="text-xs font-bold text-slate-200">{stud.finalMark || 0}%</span>
                                  <span className="text-[9px] text-slate-500 font-semibold uppercase">Overall</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        <div className="h-px bg-slate-900 my-2"></div>

                        {/* Export actions */}
                        <div className="flex flex-col gap-3">
                          <button
                            onClick={handleExportSampling}
                            disabled={isCompilingSample || sampledList.length === 0}
                            className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                          >
                            {isCompilingSample ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Assembling Auditor Pac...</span>
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="h-4 w-4 text-indigo-200" />
                                <span>Compile & Export Auditor Moderation Pack</span>
                              </>
                            )}
                          </button>

                          {sampleExportStatus && (
                            <div className="bg-emerald-500/5 border border-emerald-500/15 rounded-xl p-4 flex gap-3 text-xs text-emerald-300">
                              <CheckCircle2 className="h-4.5 w-4.5 text-emerald-400 flex-shrink-0 mt-0.5" />
                              <div className="flex-1">
                                <p className="font-bold">Moderator Pack Generated Successfully</p>
                                <p className="text-slate-400 mt-1">
                                  The sampled portfolios, marked rubrics, and overall spreadsheet reports have been compiled in Drive:
                                </p>
                                <a 
                                  href={sampleExportStatus} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-[10px] text-indigo-400 hover:underline font-mono mt-2 inline-block break-all"
                                >
                                  {sampleExportStatus}
                                </a>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Right Sidebar Status Logs Panel */}
        {isSidebarVisible && (
          <div className="lg:w-[30%] flex flex-col gap-6 animate-fadeIn">
          
          {/* Workstation Status Analyzer Widget */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 flex flex-col gap-5 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Workspace Status</span>
              <span className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/15 text-[9px] font-bold uppercase">
                Active
              </span>
            </div>

            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Total Allocated:</span>
                <span className={`font-bold ${isDesignValid ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {displayTotal}%
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Rubrics Configured:</span>
                <span className="font-bold text-slate-300">
                  {Object.keys(rubrics).filter(k => rubrics[k].length > 0).length} / {components.length}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Student Submissions:</span>
                <span className="font-bold text-slate-300">
                  {students.filter(s => s.submissionLink).length} / {students.length}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Grading Progress:</span>
                <span className="font-bold text-slate-300">
                  {students.filter(s => s.status === 'Graded').length} / {students.length}
                </span>
              </div>
            </div>

            <div className="h-px bg-slate-900"></div>

            {/* Validation progress bar */}
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                <span>Weight Limit (100% Rule)</span>
                <span className={isDesignValid ? 'text-emerald-400' : 'text-amber-400'}>{displayTotal}%</span>
              </div>
              <div className="w-full h-2.5 bg-slate-950 rounded-full border border-slate-900 p-0.5 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${
                    isDesignValid 
                      ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]' 
                      : totalWeight > 100 
                        ? 'bg-rose-500' 
                        : 'bg-amber-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, totalWeight))}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Database Integration Logs */}
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-6 flex flex-col gap-4 backdrop-blur-sm flex-1 max-h-[380px]">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Integration Console</span>
              <button 
                onClick={() => setApiLogs([])}
                className="text-[9px] text-slate-500 hover:text-slate-300 font-bold bg-transparent border-0 cursor-pointer"
              >
                Clear Console
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-950 rounded-xl p-3 border border-slate-900/80 font-mono text-[9px] leading-relaxed text-slate-400 flex flex-col gap-1.5 max-h-[220px]">
              {apiLogs.length === 0 ? (
                <span className="text-slate-700 italic select-none">Console ready. Action logs will be printed here...</span>
              ) : (
                apiLogs.map((log, index) => (
                  <div key={index} className="border-b border-slate-900/40 pb-1 last:border-b-0 break-all select-all hover:bg-slate-900/20">
                    {log}
                  </div>
                ))
              )}
            </div>

            <div className="bg-indigo-950/10 border border-indigo-500/5 rounded-lg p-2.5 text-[9px] text-indigo-400 flex items-start gap-2">
              <Info className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 text-indigo-400" />
              <p className="leading-relaxed">
                App detects credentials dynamically. Sheets database calls and Drive API directory builds output execution stats in real-time.
              </p>
            </div>
          </div>

        </div>
      )}

      </div>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-600 mt-auto print:hidden">
        <p>© 2026 KLUST Assessment Manager. Built for educational alignment and quality assurance.</p>
      </footer>

      {/* Formal PDF Record Container (Print Only) */}
      {/* Formal PDF Record Container (Print Only) */}
      <div className="hidden print:block font-serif text-slate-900 p-8 bg-white min-h-screen">

        {/* SECTION 1: Pre-Setting Audit Record */}
        {activeStage === 'pre_setting' && (
          <div className="flex flex-col gap-6">
            {/* Document Header */}
            <div className="border-b-2 border-slate-950 pb-4 mb-6 flex items-center gap-4">
              <img 
                src="https://raw.githubusercontent.com/rizalhusin-klust/klust-images/main/KLUST%20%20logo%20only.png" 
                alt="KLUST Logo" 
                className="h-16 w-auto object-contain flex-shrink-0"
              />
              <div className="flex-grow text-left">
                <h1 className="text-lg font-bold uppercase tracking-wider leading-tight">Kuala Lumpur University of Science and Technology (KLUST)</h1>
                <h2 className="text-xs font-semibold uppercase text-slate-600 mt-0.5">Academic Quality Assurance Portfolio</h2>
                <div className="flex justify-between items-center text-[9px] mt-2 font-mono border-t border-slate-200 pt-1.5">
                  <span>Course Code: {courseCode}</span>
                  <span>Semester: {semester}</span>
                  <span>Date Generated: {currentDateText || 'Loading...'}</span>
                </div>
              </div>
            </div>

            <div className="text-center mb-4">
              <h3 className="text-base font-bold uppercase border border-slate-950 py-1.5 bg-slate-100">Course Portfolio Pre-Setting Record</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div><strong>Course Name:</strong> {courseName}</div>
              <div><strong>Class Size:</strong> {students.length} Students</div>
            </div>

            <div className="mt-4">
              <h4 className="text-xs font-bold uppercase border-b border-slate-900 pb-1 mb-2">1. Assessment Components & Weightage allocation</h4>
              <table className="w-full text-left text-[11px] border border-slate-400 border-collapse">
                <thead>
                  <tr className="bg-slate-150 border-b border-slate-400">
                    <th className="p-2 border-r border-slate-400">Component</th>
                    <th className="p-2 text-center">Weight (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {components.map(c => (
                    <tr key={c.id} className="border-b border-slate-400">
                      <td className="p-2 border-r border-slate-400 font-semibold">{c.name}</td>
                      <td className="p-2 text-center">{c.weight}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4">
              <h4 className="text-xs font-bold uppercase border-b border-slate-900 pb-1 mb-2">2. Target outcomes mapping (CLOs)</h4>
              {cloList.map(c => (
                <div key={c.id} className="text-[11px] mb-2 leading-relaxed">
                  <strong>{c.code} ({c.category} - level {c.level}):</strong> {c.desc}
                </div>
              ))}
            </div>

            <div className="mt-4">
              <h4 className="text-xs font-bold uppercase border-b border-slate-900 pb-1 mb-2">3. Curricular Integrations (VBE & ESD)</h4>
              <div className="flex flex-col gap-3 text-[11px]">
                <div>
                  <strong>Value-Based Education (VBE) Integration:</strong>
                  <p className="mt-1 text-slate-700">{hasVbeIntegration ? `TnL Plan: ${vbeTnlDetails}. Assessment Plan: ${vbeAssessmentDetails}` : 'No VBE integration planned for this subject.'}</p>
                </div>
                <div>
                  <strong>Education for Sustainable Development (ESD) Integration:</strong>
                  <p className="mt-1 text-slate-700">{hasEsdIntegration ? `TnL Plan: ${esdTnlDetails}. Assessment Plan: ${esdAssessmentDetails}` : 'No ESD integration planned for this subject.'}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: Assessment Briefs & Rubrics (Printed on stage design_brief_rubrics) */}
        {activeStage === 'design_brief_rubrics' && (
          <div className="flex flex-col gap-8">
            {components.map((comp) => {
              const brief = assessmentBriefs[comp.id] || {
                startDate: '',
                endDate: '',
                instructions: '',
                tasks: '',
                submissionFormat: '',
                evidenceToSubmit: '',
                maxPoints: 100,
                allowedAttempts: 1
              };
              const compRubrics = rubrics[comp.id] || [];

              return (
                <div key={comp.id} className="print-page-break flex flex-col gap-4 pt-4">
                  {/* Document Header specifically for this Component */}
                  <div className="border-b-2 border-slate-950 pb-4 mb-6 flex items-center gap-4">
                    <img 
                      src="https://raw.githubusercontent.com/rizalhusin-klust/klust-images/main/KLUST%20%20logo%20only.png" 
                      alt="KLUST Logo" 
                      className="h-16 w-auto object-contain flex-shrink-0"
                    />
                    <div className="flex-grow text-left">
                      <h1 className="text-lg font-bold uppercase tracking-wider leading-tight">Kuala Lumpur University of Science and Technology (KLUST)</h1>
                      <h2 className="text-xs font-semibold uppercase text-slate-600 mt-0.5">Academic Quality Assurance Portfolio - Assessment Brief</h2>
                      <div className="flex justify-between items-center text-[9px] mt-2 font-mono border-t border-slate-200 pt-1.5">
                        <span>Course: {courseCode} ({courseName})</span>
                        <span>Assessment: {comp.name}</span>
                        <span>Date Generated: {currentDateText || 'Loading...'}</span>
                      </div>
                    </div>
                  </div>

                  <h4 className="text-sm font-bold uppercase text-indigo-900">{comp.name} Details ({comp.weight}% Weightage)</h4>
                  
                  <div className="grid grid-cols-3 gap-2 text-[10px] bg-slate-50 p-2 border border-slate-200 mt-1">
                    <div><strong>Start Date:</strong> {brief.startDate || 'Not Configured'}</div>
                    <div><strong>Due Date:</strong> {brief.endDate || 'Not Configured'}</div>
                    <div><strong>Max Marks:</strong> {brief.maxPoints || 100} Marks</div>
                    <div><strong>Submission Format:</strong> {brief.submissionFormat || 'Not Specified'}</div>
                    <div><strong>Allowed Attempts:</strong> {brief.allowedAttempts || 1}</div>
                    <div className="col-span-3 mt-1 pt-1 border-t border-slate-200/60"><strong>Evidence / Item(s) to Submit:</strong> {brief.evidenceToSubmit || 'None'}</div>
                  </div>

                  <div className="text-[11px] mt-2">
                    <strong>Instructions / Briefing Scenario:</strong>
                    <p className="text-slate-700 mt-1 whitespace-pre-wrap leading-relaxed bg-slate-50 p-2.5 border border-slate-200 rounded">{brief.instructions || 'No instructions provided.'}</p>
                  </div>

                  <div className="text-[11px] mt-2">
                    <strong>Tasks & Deliverables:</strong>
                    <p className="text-slate-700 mt-1 whitespace-pre-wrap leading-relaxed bg-slate-50 p-2.5 border border-slate-200 rounded">{brief.tasks || 'No specific tasks defined.'}</p>
                  </div>

                  {/* Brief attachments print representation */}
                  {(brief.attachmentName || brief.attachmentUrl) && (
                    <div className="text-[11px] mt-2 break-inside-avoid">
                      <strong>Document outline link / attachment:</strong>{' '}
                      {brief.attachmentUrl ? (
                        <a 
                          href={brief.attachmentUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-blue-800 underline font-mono text-[10px]"
                        >
                          {brief.attachmentUrl}
                        </a>
                      ) : (
                        <span className="text-slate-500 font-mono text-[10px]">No Link URL Provided</span>
                      )}
                      {brief.attachmentName && (
                        <span className="text-slate-600 ml-1">
                          (Uploaded File: {brief.attachmentName})
                        </span>
                      )}

                      {/* Print document outline preview inline */}
                      {brief.attachmentUrl && (
                        <div className="mt-3 border border-slate-300 rounded p-2 bg-slate-50">
                          <div className="text-[9px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200 pb-1 mb-2">
                            Attachment Preview Outline ({brief.attachmentName || 'Document Outline'})
                          </div>
                          <iframe 
                            src={brief.attachmentUrl}
                            className="w-full h-[550px] border-0"
                            title={`Printed Attachment Outline for ${comp.name}`}
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {comp.assessmentType !== 'quantitative' && (
                    <div className="mt-4 break-inside-avoid">
                      <h5 className="text-xs font-bold uppercase mb-2">Qualitative Assessment Rubric</h5>
                      {compRubrics.length === 0 ? (
                        <p className="text-[11px] text-slate-500">No rubric criteria configured for this component.</p>
                      ) : (
                        <table className="w-full text-left text-[9px] border border-slate-400 border-collapse">
                          <thead>
                            <tr className="bg-slate-100 border-b border-slate-400">
                              <th className="p-2 border-r border-slate-400 w-24">Criteria (Weight)</th>
                              <th className="p-2 border-r border-slate-400">L1</th>
                              <th className="p-2 border-r border-slate-400">L2</th>
                              <th className="p-2 border-r border-slate-400 bg-indigo-50 font-bold">L3 (Target Expected)</th>
                              <th className="p-2 border-r border-slate-400">L4</th>
                              <th className="p-2">L5 (Master)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {compRubrics.map((crit) => (
                              <tr key={crit.id} className="border-b border-slate-400">
                                <td className="p-2 border-r border-slate-400 font-bold">{crit.name} ({crit.weight}%)</td>
                                {crit.levels.map((lvl) => (
                                  <td key={lvl.score} className={`p-2 border-r border-slate-400 leading-normal ${lvl.score === 3 ? 'bg-indigo-50/45 font-semibold' : ''}`}>
                                    {lvl.desc}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* SECTION 3: Grading & Summary (Printed on stage grading or distribution) */}
        {(activeStage === 'grading' || activeStage === 'distribution') && (
          <div className="flex flex-col gap-8">
            {components.map((comp) => {
              const compRubrics = rubrics[comp.id] || [];
              const compGradesList = students.map(s => {
                const markerA = markerGrades[s.id]?.[comp.id]?.markerAScore;
                const markerB = markerGrades[s.id]?.[comp.id]?.markerBScore;
                const finalSc = s.grades[comp.id];
                return {
                  id: s.id,
                  name: s.name,
                  markerA: markerA !== undefined ? `${markerA}%` : 'N/A',
                  markerB: markerB !== undefined ? `${markerB}%` : 'N/A',
                  final: finalSc !== undefined ? `${finalSc}%` : 'Pending'
                };
              });

              return (
                <div key={comp.id} className="print-page-break flex flex-col gap-4 pt-4">
                  {/* Document Header specifically for this Component */}
                  <div className="border-b-2 border-slate-950 pb-4 mb-6 flex items-center gap-4">
                    <img 
                      src="https://raw.githubusercontent.com/rizalhusin-klust/klust-images/main/KLUST%20%20logo%20only.png" 
                      alt="KLUST Logo" 
                      className="h-16 w-auto object-contain flex-shrink-0"
                    />
                    <div className="flex-grow text-left">
                      <h1 className="text-lg font-bold uppercase tracking-wider leading-tight">Kuala Lumpur University of Science and Technology (KLUST)</h1>
                      <h2 className="text-xs font-semibold uppercase text-slate-600 mt-0.5">Academic Quality Assurance Portfolio - Student Score Summary</h2>
                      <div className="flex justify-between items-center text-[9px] mt-2 font-mono border-t border-slate-200 pt-1.5">
                        <span>Course: {courseCode} ({courseName})</span>
                        <span>Assessment: {comp.name}</span>
                        <span>Date Generated: {currentDateText || 'Loading...'}</span>
                      </div>
                    </div>
                  </div>

                  <h4 className="text-sm font-bold uppercase text-indigo-900">{comp.name} Summary ({comp.weight}% Weightage)</h4>
                  
                  {/* Rubric descriptor summary table */}
                  {comp.assessmentType !== 'quantitative' ? (
                    <div className="mt-2">
                      <h5 className="text-[11px] font-bold uppercase text-slate-700 mb-1.5">Criteria & Mapped Target Weights</h5>
                      <table className="w-full text-left text-[10px] border border-slate-300 border-collapse mb-4">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-300">
                            <th className="p-2 border-r border-slate-300">Criteria Name</th>
                            <th className="p-2 border-r border-slate-300 text-center">Weight (%)</th>
                            <th className="p-2">Expected Target (L3)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {compRubrics.map((crit) => (
                            <tr key={crit.id} className="border-b border-slate-300">
                              <td className="p-2 border-r border-slate-300 font-semibold">{crit.name}</td>
                              <td className="p-2 border-r border-slate-300 text-center">{crit.weight}%</td>
                              <td className="p-2 text-slate-500 truncate max-w-xs">{crit.levels.find(l => l.score === 3)?.desc}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="mt-2 border border-slate-200 rounded p-3 bg-slate-50/50 mb-4">
                      <div className="text-[11px] font-bold uppercase text-slate-700 border-b border-slate-200 pb-1 mb-2">
                        Quantitative Grading Parameters
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-[10px]">
                        <div><strong>Framework Mode:</strong> Direct Numeric Marks Scoring</div>
                        <div><strong>Maximum Marks:</strong> {assessmentBriefs[comp.id]?.maxPoints || 100} Marks</div>
                        <div><strong>Component Syllabus Weight:</strong> {comp.weight}%</div>
                      </div>
                    </div>
                  )}

                  {/* Student Grades table */}
                  <div className="mt-2">
                    <h5 className="text-[11px] font-bold uppercase text-slate-700 mb-1.5">Student Grades Ledger Summary</h5>
                    <table className="w-full text-left text-[10px] border border-slate-300 border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-300">
                          <th className="p-2 border-r border-slate-300">Student ID</th>
                          <th className="p-2 border-r border-slate-300">Student Name</th>
                          <th className="p-2 border-r border-slate-300 text-center">Marker A Score</th>
                          <th className="p-2 border-r border-slate-300 text-center">Marker B Score</th>
                          <th className="p-2 text-center bg-indigo-50 font-bold">Final Moderated Score</th>
                        </tr>
                      </thead>
                      <tbody>
                        {compGradesList.map((stud) => (
                          <tr key={stud.id} className="border-b border-slate-300">
                            <td className="p-2 border-r border-slate-300 font-mono">{stud.id}</td>
                            <td className="p-2 border-r border-slate-300">{stud.name}</td>
                            <td className="p-2 border-r border-slate-300 text-center">{stud.markerA}</td>
                            <td className="p-2 border-r border-slate-300 text-center">{stud.markerB}</td>
                            <td className="p-2 text-center bg-indigo-50/20 font-bold">{stud.final}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* SECTION 4: Sampling Audit pack */}
        {activeStage === 'sampling' && (
          <div className="flex flex-col gap-6">
            {/* Document Header */}
            <div className="border-b-2 border-slate-950 pb-4 mb-6 flex items-center gap-4">
              <img 
                src="https://raw.githubusercontent.com/rizalhusin-klust/klust-images/main/KLUST%20%20logo%20only.png" 
                alt="KLUST Logo" 
                className="h-16 w-auto object-contain flex-shrink-0"
              />
              <div className="flex-grow text-left">
                <h1 className="text-lg font-bold uppercase tracking-wider leading-tight">Kuala Lumpur University of Science and Technology (KLUST)</h1>
                <h2 className="text-xs font-semibold uppercase text-slate-600 mt-0.5">Academic Quality Assurance Portfolio</h2>
                <div className="flex justify-between items-center text-[9px] mt-2 font-mono border-t border-slate-200 pt-1.5">
                  <span>Course Code: {courseCode}</span>
                  <span>Semester: {semester}</span>
                  <span>Date Generated: {currentDateText || 'Loading...'}</span>
                </div>
              </div>
            </div>

            <div className="text-center mb-4">
              <h3 className="text-base font-bold uppercase border border-slate-950 py-1.5 bg-slate-100">Course Portfolio Moderation & Sampling Record</h3>
            </div>
            
            <div className="mt-2 text-xs">
              <strong>Sampling Roster & Moderated Portfolios Status:</strong>
              <p className="mt-1">All audit deliverables have been synced to Google Drive root folder: <strong>/ModeratorPack_Audit</strong></p>
            </div>

            <div className="mt-4">
              <h4 className="text-xs font-bold uppercase border-b border-slate-900 pb-1 mb-2">Audit Logs Checklist</h4>
              <table className="w-full text-left text-[10px] border border-slate-300 border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-300">
                    <th className="p-2 border-r border-slate-300">Timestamp</th>
                    <th className="p-2">Log Action Message</th>
                  </tr>
                </thead>
                <tbody>
                  {apiLogs.slice(-10).map((log, idx) => {
                    const time = log.substring(1, 9);
                    const msg = log.substring(11);
                    return (
                      <tr key={idx} className="border-b border-slate-300">
                        <td className="p-2 border-r border-slate-300 font-mono text-[9px]">{time}</td>
                        <td className="p-2 font-mono text-[9px]">{msg}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Fixed Print Footer */}
        <div className="print-footer">
          Copyright of Rizal Husin FABE KLUST
        </div>
      </div>
    </div>
  );
}
