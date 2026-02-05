import React, { useState, useEffect, useRef } from 'react';
import { 
  Printer, 
  Shuffle, 
  Users, 
  Settings, 
  LayoutGrid, 
  UserPlus, 
  Ban, 
  Link as LinkIcon, 
  GraduationCap,
  Trash2,
  AlertCircle,
  ClipboardList,
  Linkedin,
  BookOpen,
  Download,
  Upload,
  Image as ImageIcon,
  X,
  FileText,
  ChevronDown,
  Palette,
  Layout,
  Grid,
  Circle,
  Rows,
  Box,
  Sparkles,
  Maximize2,
  Copy,
  Check,
  Type,
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

import { THEMES, DEFAULT_NAMES, FONTS } from './constants';
import { Student, Rule, Config, ExportData, RuleType, StudentLevel } from './types';
import TableGroup from './components/TableGroup';

/* --- ALGORITHMS --- */

const shuffle = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  let currentIndex = newArray.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [newArray[currentIndex], newArray[randomIndex]] = [newArray[randomIndex], newArray[currentIndex]];
  }
  return newArray;
};

// Accordion Component
const AccordionSection = ({ 
  title, 
  icon: Icon, 
  children, 
  defaultOpen = false 
}: { 
  title: string; 
  icon: any; 
  children: React.ReactNode; 
  defaultOpen?: boolean; 
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-white hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2 text-slate-700 font-bold text-sm">
          <Icon className="w-4 h-4 text-indigo-500" />
          {title}
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="p-4 bg-slate-50/50 animate-in slide-in-from-top-1">
          {children}
        </div>
      )}
    </div>
  );
};

export default function App() {
  // Core State
  const [students, setStudents] = useState<Student[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [config, setConfig] = useState<Config>({
    groupSize: 5,
    theme: 'wood',
    strategy: 'mix',
    teacherName: 'Husam Abed Al-Fattah',
    className: 'Grade 12 A',
    subject: 'Chemistry',
    customBgImage: null,
    layoutMode: 'circle',
    font: 'Fredoka',
    fontSize: 12
  });
  const [generatedGroups, setGeneratedGroups] = useState<Student[][]>([]);
  const [groupNames, setGroupNames] = useState<Record<number, string>>({});
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  
  // UI State
  const [zoomLevel, setZoomLevel] = useState(1);
  
  // Prompt Export State
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [hasCopied, setHasCopied] = useState(false);

  // Bulk Import State
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [bulkText, setBulkText] = useState('');
  
  // File Input Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // Initialize Default Data
  useEffect(() => {
    const initialStudents: Student[] = DEFAULT_NAMES.map((name, i) => ({
      id: `s-${i}`,
      name,
      level: 'Mid' as StudentLevel
    }));
    setStudents(initialStudents);
  }, []);

  // Regenerate groups whenever data changes
  useEffect(() => {
    generateGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [students, config.groupSize, config.strategy, rules]);

  const generateGroups = () => {
    if (students.length === 0) {
      setGeneratedGroups([]);
      return;
    }

    let pool = [...students];

    // 1. Handle "Keep Together" Rules
    const clusters: Student[][] = [];
    const pairedIds = new Set<string>();
    
    const pairRules = rules.filter(r => r.type === 'pair');
    pairRules.forEach(rule => {
      if (pairedIds.has(rule.studentAId) || pairedIds.has(rule.studentBId)) return;
      const sA = pool.find(s => s.id === rule.studentAId);
      const sB = pool.find(s => s.id === rule.studentBId);
      if (sA && sB) {
        clusters.push([sA, sB]);
        pairedIds.add(sA.id);
        pairedIds.add(sB.id);
      }
    });

    pool = pool.filter(s => !pairedIds.has(s.id));

    // 2. Sort remaining pool based on Strategy
    if (config.strategy === 'mix') {
      const levelMap: Record<string, number> = { 'High': 3, 'Mid': 2, 'Low': 1 };
      pool.sort((a, b) => levelMap[b.level] - levelMap[a.level]);
    } else if (config.strategy === 'group') {
      const levelMap: Record<string, number> = { 'High': 3, 'Mid': 2, 'Low': 1 };
      pool.sort((a, b) => levelMap[b.level] - levelMap[a.level]);
    } else {
      pool = shuffle(pool);
    }

    // 3. Distribute into Groups
    const numGroups = Math.ceil((pool.length + pairedIds.size) / config.groupSize);
    const groups: Student[][] = Array.from({ length: numGroups }, () => []);

    const separateRules = rules.filter(r => r.type === 'separate');
    
    const canPlaceInGroup = (student: Student, group: Student[]) => {
      for (const s of group) {
        const conflict = separateRules.find(r => 
          (r.studentAId === student.id && r.studentBId === s.id) ||
          (r.studentAId === s.id && r.studentBId === student.id)
        );
        if (conflict) return false;
      }
      return true;
    };

    // Place Clusters
    clusters.forEach(cluster => {
      let placed = false;
      for (const g of groups) {
        if (g.length + cluster.length <= config.groupSize) {
           let valid = true;
           for (const cMember of cluster) {
             if (!canPlaceInGroup(cMember, g)) valid = false;
           }
           
           if (valid) {
             g.push(...cluster);
             placed = true;
             break;
           }
        }
      }
      if (!placed && groups.length > 0) groups[0].push(...cluster);
    });

    // Place remaining individual students
    pool.forEach((student, i) => {
      let placed = false;
      
      let targetGroupIndices: number[] = [];
      if (config.strategy === 'mix') {
        const snakeIndex = i % numGroups;
        targetGroupIndices = [snakeIndex];
        for(let j=0; j<numGroups; j++) if(j!==snakeIndex) targetGroupIndices.push(j);
      } else {
        targetGroupIndices = groups.map((_, idx) => idx);
      }

      for (const gIdx of targetGroupIndices) {
        const g = groups[gIdx];
        if (g.length < config.groupSize && canPlaceInGroup(student, g)) {
          g.push(student);
          placed = true;
          break;
        }
      }
      
      if (!placed) {
        for (const g of groups) {
          if (g.length < config.groupSize) {
            g.push(student);
            placed = true;
            break;
          }
        }
      }
      
      if (!placed && groups.length > 0) {
        groups[groups.length - 1].push(student);
      }
    });

    setGeneratedGroups(groups.filter(g => g.length > 0));
  };

  /* --- HANDLERS --- */
  
  const addStudent = () => {
    const newId = `s-${Date.now()}`;
    setStudents([{ id: newId, name: 'New Student', level: 'Mid' }, ...students]);
  };

  const handleBulkImport = () => {
    if (!bulkText.trim()) return;
    const names = bulkText.split('\n').filter(n => n.trim());
    const newStudents: Student[] = names.map((name, i) => ({
      id: `s-bulk-${Date.now()}-${i}`,
      name: name.trim(),
      level: 'Mid'
    }));
    setStudents([...students, ...newStudents]);
    setBulkText('');
    setIsBulkMode(false);
  };

  const updateStudent = (id: string, field: keyof Student, value: string) => {
    setStudents(students.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const removeStudent = (id: string) => {
    setStudents(students.filter(s => s.id !== id));
    setRules(rules.filter(r => r.studentAId !== id && r.studentBId !== id));
  };

  const addRule = (type: RuleType) => {
    if (students.length < 2) return;
    setRules([...rules, { 
      id: Date.now(), 
      type, 
      studentAId: students[0].id, 
      studentBId: students[1].id 
    }]);
  };

  const updateRule = (ruleId: number, field: keyof Rule, value: string) => {
    setRules(rules.map(r => r.id === ruleId ? { ...r, [field]: value } : r));
  };

  const removeRule = (ruleId: number) => {
    setRules(rules.filter(r => r.id !== ruleId));
  };

  // Image Upload Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          setConfig(prev => ({ ...prev, customBgImage: reader.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Drag and Drop Handler
  const handleStudentDrop = (studentId: string, targetGroupIndex: number) => {
    const newGroups = [...generatedGroups];
    
    // Find source group and student
    let sourceGroupIndex = -1;
    let studentToMove: Student | undefined;

    for (let i = 0; i < newGroups.length; i++) {
      const studentIndex = newGroups[i].findIndex(s => s.id === studentId);
      if (studentIndex !== -1) {
        sourceGroupIndex = i;
        studentToMove = newGroups[i][studentIndex];
        // Remove from old group
        newGroups[i] = newGroups[i].filter(s => s.id !== studentId);
        break;
      }
    }

    if (studentToMove && sourceGroupIndex !== -1) {
      // Add to new group
      if (targetGroupIndex < newGroups.length) {
        newGroups[targetGroupIndex] = [...newGroups[targetGroupIndex], studentToMove];
        setGeneratedGroups(newGroups);
      }
    }
  };

  // Rename Group Handler
  const handleGroupNameChange = (index: number, newName: string) => {
     setGroupNames(prev => ({ ...prev, [index]: newName }));
  };

  // Export Plan Handler
  const handleExportPlan = () => {
    const data: ExportData = {
      version: '1.0',
      date: new Date().toISOString(),
      config,
      students,
      rules
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `seating-plan-${config.className.replace(/\s+/g, '-').toLowerCase()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Import Plan Handler
  const handleImportPlan = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          if (event.target?.result && typeof event.target.result === 'string') {
            const data = JSON.parse(event.target.result) as ExportData;
            if (data.config && data.students) {
              setConfig(data.config);
              setStudents(data.students);
              setRules(data.rules || []);
              alert('Plan imported successfully!');
            } else {
              alert('Invalid file format');
            }
          }
        } catch (error) {
          alert('Error reading file');
        }
      };
      reader.readAsText(file);
    }
    // Reset input
    e.target.value = '';
  };

  // --- PDF GENERATION ---
  const handleDownloadPDF = async () => {
    if (!printRef.current) return;
    
    // Store current zoom level and reset to 1
    const previousZoom = zoomLevel;
    setIsGeneratingPdf(true);
    setZoomLevel(1);
    
    try {
      // Small delay to allow UI to reset to zoom 1
      await new Promise(resolve => setTimeout(resolve, 300));

      const canvas = await html2canvas(printRef.current, {
        scale: 3, // High resolution for clear names
        useCORS: true,
        logging: false,
        backgroundColor: null, // Transparent to keep container background
      });

      const imgData = canvas.toDataURL('image/png');
      
      // Calculate dimensions to fit A4 landscape or maintain aspect ratio
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      
      // Initialize PDF (landscape)
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [imgWidth, imgHeight] // Match canvas size for 1:1 fidelity
      });

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`ClassPlanner_${config.className || 'Plan'}.pdf`);
      
    } catch (error) {
      console.error('PDF Generation failed', error);
      alert('Could not generate PDF. Please use the system Print option instead.');
    } finally {
      setIsGeneratingPdf(false);
      setZoomLevel(previousZoom);
    }
  };

  // --- ZOOM HANDLERS ---
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
  const handleZoomReset = () => setZoomLevel(1);

  // --- AI PROMPT BUILDER ---
  const buildAiPrompt = () => {
    let layoutDesc = "";
    if (config.layoutMode === 'circle') layoutDesc = "circular tables distributed evenly";
    if (config.layoutMode === 'rect') layoutDesc = "rectangular teamwork tables";
    if (config.layoutMode === 'row') layoutDesc = "traditional rows of desks facing the front";

    // Build the group list string
    const groupsList = generatedGroups.map((group, index) => {
        const studentNames = group.map(s => s.name).join(", ");
        const groupName = groupNames[index] || `Group ${index + 1}`;
        return `${groupName}: ${studentNames}`;
    }).join("\n");

    const prompt = `
Create a colorful, student-friendly classroom seating plan illustration for a ${config.subject || 'Class'} class.
Teacher: ${config.teacherName || 'The Teacher'}. Class: ${config.className || 'My Class'}.

The classroom is organized into ${generatedGroups.length} groups of tables, with each table seating approximately ${config.groupSize} students.
Layout Style: ${layoutDesc}.

Students are arranged around each table, clearly showing group seating.

Display large, bold, easy-to-read student names above or inside each seat.

Make sure all provided students are included in the seating plan, with no missing or repeated names.

Use bright, cheerful colors, rounded shapes, and a clean, modern cartoon-style design suitable for middle or high school students.

Tables should be visually separated and labeled with their group names.

The layout should look organized, positive, and welcoming, with a clear layout.

Here is the student list per group:
${groupsList}
    `.trim();

    return prompt;
  };

  // --- PROMPT EXPORT HANDLER ---
  const handleOpenPromptModal = () => {
    const prompt = buildAiPrompt();
    setGeneratedPrompt(prompt);
    setHasCopied(false);
    setShowPromptModal(true);
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(generatedPrompt);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  const currentTheme = THEMES[config.theme] || THEMES.wood;

  return (
    <div className="flex h-screen overflow-hidden font-sans text-slate-800 bg-white main-container" style={{ fontFamily: config.font }}>
      <style>{`
        .scrollbar-thin::-webkit-scrollbar { width: 6px; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background-color: #cbd5e1; border-radius: 3px; }
        
        /* Updated Print Styles for PDF Generation */
        @media print {
          @page { 
            margin: 0;
            size: auto; 
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            height: 100% !important;
            width: 100% !important;
            background: white !important;
          }
          .no-print { display: none !important; }
          .print-area {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            overflow: visible !important;
          }
        }
      `}</style>

      {/* --- PROMPT EXPORT MODAL --- */}
      {showPromptModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in" style={{ fontFamily: 'Fredoka, sans-serif' }}>
           <div className="bg-white rounded-xl overflow-hidden max-w-2xl w-full shadow-2xl flex flex-col">
              <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                 <div className="flex items-center gap-2">
                    <Copy className="w-5 h-5 text-indigo-600" />
                    <h3 className="font-bold text-slate-800">Copy Prompt for External AI</h3>
                 </div>
                 <button onClick={() => setShowPromptModal(false)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                    <X className="w-5 h-5 text-slate-500" />
                 </button>
              </div>
              <div className="p-6 bg-white space-y-4">
                 <p className="text-sm text-slate-600 bg-blue-50 p-3 rounded-lg border border-blue-100">
                    <strong>Instructions:</strong> To generate the image, open Gemini, activate the <strong>Nano Banana</strong> model (or other image generation models), and paste the prompt below.
                 </p>
                 <div className="relative">
                   <textarea 
                     readOnly
                     value={generatedPrompt}
                     className="w-full h-48 p-4 text-xs font-mono text-slate-700 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                   />
                   <button 
                    onClick={handleCopyPrompt}
                    className="absolute bottom-4 right-4 px-3 py-1.5 bg-white shadow-sm border border-slate-200 rounded text-xs font-bold text-indigo-600 hover:bg-indigo-50 flex items-center gap-1 transition-colors"
                   >
                     {hasCopied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                     {hasCopied ? 'Copied!' : 'Copy Text'}
                   </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* --- SIDEBAR --- */ }
      <div className="w-96 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col z-20 shadow-xl no-print" style={{ fontFamily: 'Fredoka, sans-serif' }}>
        
        {/* Header */}
        <div className="p-5 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-6 h-6 text-indigo-600" />
            <h1 className="text-xl font-bold text-slate-800">ClassPlanner</h1>
          </div>
          <div className="flex justify-between items-center">
            <p className="text-xs text-slate-500 font-medium">Drag & Drop students to rearrange</p>
            <div className="flex gap-1">
               <button 
                onClick={handleExportPlan} 
                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                title="Save/Export Plan to File"
               >
                 <Download className="w-4 h-4" />
               </button>
               <button 
                onClick={() => jsonInputRef.current?.click()} 
                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                title="Load/Import Plan from File"
               >
                 <Upload className="w-4 h-4" />
               </button>
               <input 
                 type="file" 
                 ref={jsonInputRef} 
                 className="hidden" 
                 accept=".json" 
                 onChange={handleImportPlan} 
               />
            </div>
          </div>
        </div>

        {/* Scrollable Content with Accordions */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          
          {/* SECTION 1: Class Details & Layout */}
          <AccordionSection title="Class & Layout" icon={Settings} defaultOpen={true}>
            <div className="space-y-4">
               {/* Inputs */}
               <div className="grid grid-cols-2 gap-2">
                 <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Class</label>
                    <input 
                      type="text" 
                      value={config.className}
                      onChange={(e) => setConfig({...config, className: e.target.value})}
                      className="w-full text-xs border-slate-200 rounded focus:border-indigo-500 p-1.5 border"
                    />
                 </div>
                 <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Subject</label>
                    <input 
                      type="text" 
                      value={config.subject}
                      onChange={(e) => setConfig({...config, subject: e.target.value})}
                      className="w-full text-xs border-slate-200 rounded focus:border-indigo-500 p-1.5 border"
                    />
                 </div>
               </div>
               <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Teacher</label>
                  <input 
                    type="text" 
                    value={config.teacherName}
                    onChange={(e) => setConfig({...config, teacherName: e.target.value})}
                    className="w-full text-xs border-slate-200 rounded focus:border-indigo-500 p-2 border font-medium text-slate-700"
                    placeholder="Enter Teacher Name"
                  />
               </div>
               
               {/* New Layout Selector */}
               <div>
                 <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Layout Style</label>
                 <div className="grid grid-cols-3 gap-2">
                    <button 
                      onClick={() => setConfig({...config, layoutMode: 'circle'})}
                      className={`flex flex-col items-center justify-center gap-1 py-2 rounded border transition-all ${config.layoutMode === 'circle' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                    >
                      <Circle className="w-4 h-4" />
                      <span className="text-[10px] font-bold">Tables</span>
                    </button>
                    <button 
                      onClick={() => setConfig({...config, layoutMode: 'rect'})}
                      className={`flex flex-col items-center justify-center gap-1 py-2 rounded border transition-all ${config.layoutMode === 'rect' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                    >
                      <Layout className="w-4 h-4" />
                      <span className="text-[10px] font-bold">Groups</span>
                    </button>
                    <button 
                      onClick={() => setConfig({...config, layoutMode: 'row'})}
                      className={`flex flex-col items-center justify-center gap-1 py-2 rounded border transition-all ${config.layoutMode === 'row' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                    >
                      <Rows className="w-4 h-4" />
                      <span className="text-[10px] font-bold">Rows</span>
                    </button>
                 </div>
               </div>

               <div className="border-t border-slate-200 pt-3">
                  <div className="flex justify-between text-xs text-slate-600 mb-1">
                    <span>Group Size / Row Length</span>
                    <span className="font-bold">{config.groupSize} Students</span>
                  </div>
                  <input 
                    type="range" 
                    min="2" 
                    max="8" 
                    value={config.groupSize} 
                    onChange={(e) => setConfig({...config, groupSize: parseInt(e.target.value)})}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
               </div>

               <div>
                 <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Strategy</label>
                 <div className="grid grid-cols-3 gap-1">
                    <button 
                      onClick={() => setConfig({...config, strategy: 'random'})}
                      className={`text-[10px] py-1.5 rounded border ${config.strategy === 'random' ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-bold' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                    >
                      Random
                    </button>
                    <button 
                      onClick={() => setConfig({...config, strategy: 'mix'})}
                      className={`text-[10px] py-1.5 rounded border ${config.strategy === 'mix' ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-bold' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                    >
                      Mix Levels
                    </button>
                    <button 
                      onClick={() => setConfig({...config, strategy: 'group'})}
                      className={`text-[10px] py-1.5 rounded border ${config.strategy === 'group' ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-bold' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                    >
                      Match Levels
                    </button>
                  </div>
               </div>
            </div>
          </AccordionSection>

          {/* SECTION 2: Students */}
          <AccordionSection title={`Students (${students.length})`} icon={Users} defaultOpen={false}>
            <div className="space-y-3">
              <div className="flex gap-2">
                  <button 
                    onClick={() => setIsBulkMode(!isBulkMode)}
                    className={`flex-1 text-xs px-2 py-1.5 rounded flex justify-center items-center gap-1 font-bold border transition-colors ${isBulkMode ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-indigo-600 border-indigo-200 hover:border-indigo-400'}`}
                  >
                    <ClipboardList className="w-3 h-3" /> {isBulkMode ? 'Cancel Paste' : 'Paste List'}
                  </button>
                  <button 
                    onClick={addStudent}
                    className="flex-1 text-xs bg-indigo-100 text-indigo-700 px-2 py-1.5 rounded hover:bg-indigo-200 flex justify-center items-center gap-1 font-bold"
                  >
                    <UserPlus className="w-3 h-3" /> Add One
                  </button>
              </div>

              {isBulkMode && (
                <div className="bg-white p-2 rounded-lg border border-indigo-200 shadow-sm">
                  <textarea 
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    className="w-full h-24 text-xs border-slate-200 rounded-md focus:border-indigo-500 focus:ring-0 mb-2"
                    placeholder="Alice&#10;Bob..."
                    autoFocus
                  />
                  <button 
                    onClick={handleBulkImport}
                    className="w-full py-1.5 bg-indigo-600 text-white rounded text-xs font-bold hover:bg-indigo-700"
                  >
                    Import
                  </button>
                </div>
              )}

              <div className="max-h-60 overflow-y-auto space-y-1 pr-1">
                {students.map(student => (
                  <div key={student.id} className="group flex items-center gap-1 bg-white p-1.5 rounded border border-slate-200 hover:border-indigo-300 transition-colors">
                    <input 
                      type="text" 
                      value={student.name}
                      onChange={(e) => updateStudent(student.id, 'name', e.target.value)}
                      className="flex-1 text-xs font-medium border-none p-0 focus:ring-0 text-slate-700 bg-transparent placeholder-slate-300 outline-none"
                      placeholder="Name"
                    />
                    <select 
                      value={student.level}
                      onChange={(e) => updateStudent(student.id, 'level', e.target.value)}
                      className={`text-[10px] font-bold rounded px-1 py-0.5 border-none focus:ring-0 cursor-pointer h-6 ${
                        student.level === 'High' ? 'bg-green-100 text-green-700' :
                        student.level === 'Low' ? 'bg-orange-100 text-orange-700' :
                        'bg-blue-100 text-blue-700'
                      }`}
                    >
                      <option value="High">High</option>
                      <option value="Mid">Mid</option>
                      <option value="Low">Low</option>
                    </select>
                    <button 
                      onClick={() => removeStudent(student.id)}
                      className="text-slate-300 hover:text-red-500 p-0.5"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </AccordionSection>

          {/* SECTION 3: Rules */}
          <AccordionSection title="Rules & Constraints" icon={AlertCircle}>
             <div className="space-y-3">
                <div className="flex gap-2">
                  <button 
                    onClick={() => addRule('separate')}
                    className="flex-1 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded text-[10px] font-bold flex items-center justify-center gap-1 hover:bg-red-100"
                  >
                    <Ban className="w-3 h-3" /> Separate
                  </button>
                  <button 
                    onClick={() => addRule('pair')}
                    className="flex-1 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded text-[10px] font-bold flex items-center justify-center gap-1 hover:bg-emerald-100"
                  >
                    <LinkIcon className="w-3 h-3" /> Pair
                  </button>
                </div>

                <div className="space-y-2">
                  {rules.length === 0 && <p className="text-center text-xs text-slate-400 italic">No rules defined.</p>}
                  {rules.map(rule => (
                    <div key={rule.id} className="bg-white p-2 rounded border border-slate-200 flex flex-col gap-1 relative">
                       <div className={`text-[10px] font-bold uppercase flex items-center gap-1 ${rule.type === 'separate' ? 'text-red-500' : 'text-emerald-500'}`}>
                          {rule.type === 'separate' ? 'Separate' : 'Pair'}
                       </div>
                       <div className="flex items-center gap-1">
                          <select 
                            className="flex-1 text-xs border-slate-200 rounded p-1"
                            value={rule.studentAId}
                            onChange={(e) => updateRule(rule.id, 'studentAId', e.target.value)}
                          >
                            {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                          <select 
                            className="flex-1 text-xs border-slate-200 rounded p-1"
                            value={rule.studentBId}
                            onChange={(e) => updateRule(rule.id, 'studentBId', e.target.value)}
                          >
                            {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                       </div>
                       <button 
                          onClick={() => removeRule(rule.id)}
                          className="absolute top-1 right-1 text-slate-300 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                    </div>
                  ))}
                </div>
             </div>
          </AccordionSection>

          {/* SECTION 4: AI Visualization */}
          <AccordionSection title="AI Visualization" icon={Sparkles}>
            <div className="space-y-3">
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Generate a specific prompt for this classroom layout to use with external AI image generators (like Gemini, Midjourney, etc).
              </p>
              
              <button 
                onClick={handleOpenPromptModal}
                className="w-full py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg font-bold text-xs shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                title="Copy Prompt for External AI"
              >
                <Copy className="w-4 h-4" /> Get AI Prompt
              </button>
            </div>
          </AccordionSection>

          {/* SECTION 5: Design */}
          <AccordionSection title="Appearance" icon={Palette}>
              <div className="space-y-4">
                 {/* Font Selector */}
                 <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block flex items-center gap-1">
                       <Type className="w-3 h-3" /> Typography
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                       {Object.entries(FONTS).map(([fontName, label]) => (
                          <button
                            key={fontName}
                            onClick={() => setConfig({ ...config, font: fontName })}
                            className={`px-2 py-1.5 rounded text-[10px] border transition-all text-left truncate ${
                               config.font === fontName 
                               ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-bold' 
                               : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                            style={{ fontFamily: fontName }}
                          >
                            {label}
                          </button>
                       ))}
                    </div>
                 </div>

                 {/* Font Size Selector */}
                 <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex justify-between">
                       <span>Font Size</span>
                       <span>{config.fontSize}px</span>
                    </label>
                    <input 
                      type="range" 
                      min="8" 
                      max="20" 
                      step="1"
                      value={config.fontSize}
                      onChange={(e) => setConfig({ ...config, fontSize: parseInt(e.target.value) })}
                      className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                 </div>

                 {/* Image Upload */}
                 <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Background</label>
                    <div 
                         className="w-full h-16 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center cursor-pointer hover:bg-slate-50 hover:border-indigo-400 transition-colors relative overflow-hidden"
                         onClick={() => fileInputRef.current?.click()}
                       >
                         {config.customBgImage ? (
                            <>
                              <img src={config.customBgImage} alt="Custom bg" className="absolute inset-0 w-full h-full object-cover opacity-50" />
                              <div className="absolute inset-0 flex items-center justify-center bg-black/10">
                                <span className="text-[10px] font-bold text-white flex items-center gap-1">
                                  <ImageIcon className="w-3 h-3" /> Change
                                </span>
                              </div>
                            </>
                         ) : (
                           <span className="text-[10px] text-slate-500 flex items-center gap-1">
                             <Upload className="w-3 h-3" /> Upload Floor Image
                           </span>
                         )}
                         <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </div>
                    {config.customBgImage && (
                       <button onClick={() => setConfig({ ...config, customBgImage: null })} className="text-[10px] text-red-500 flex items-center gap-1 hover:underline mt-1">
                         <X className="w-3 h-3" /> Remove image
                       </button>
                    )}
                </div>

                <div>
                   <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block">Color Theme</label>
                   <div className="grid grid-cols-3 gap-2">
                    {Object.values(THEMES).map(t => (
                      <button
                        key={t.id}
                        onClick={() => setConfig({...config, theme: t.id})}
                        className={`p-1.5 rounded-lg text-[10px] font-medium transition-all border-2 flex flex-col items-center gap-1 ${config.theme === t.id ? 'border-indigo-500 bg-indigo-50' : 'border-transparent hover:bg-slate-100'}`}
                      >
                        <div className="w-full h-4 rounded border border-slate-100" style={{ background: t.bg }}></div>
                        <span className="text-slate-600 truncate w-full text-center">{t.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
          </AccordionSection>

        </div>

        {/* Action Footer */}
        <div className="p-4 border-t border-slate-200 bg-white space-y-3 z-30 shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.1)]">
          <button 
            onClick={generateGroups}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white hover:bg-indigo-700 py-3 rounded-lg font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95"
          >
            <Shuffle className="w-4 h-4" /> Re-Shuffle Seating
          </button>
          <button 
            onClick={handleDownloadPDF}
            disabled={isGeneratingPdf}
            className="w-full flex items-center justify-center gap-2 bg-slate-800 text-white hover:bg-slate-900 py-2 rounded-lg font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-wait"
            title="Download high-quality PDF"
          >
            {isGeneratingPdf ? 'Generating...' : <><FileText className="w-4 h-4" /> Download PDF</>}
          </button>
          
          {/* Credits */}
          <div className="pt-2 border-t border-slate-100 text-center">
            <p className="text-[10px] text-slate-400 mb-1">Created by Hussam Abed Alfattah</p>
            <a 
              href="https://www.linkedin.com/in/husam-abed-al-fattah-350053138" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold bg-indigo-50 px-2 py-1 rounded-full transition-colors"
            >
              <Linkedin className="w-3 h-3" /> Connect on LinkedIn
            </a>
          </div>
        </div>
      </div>

      {/* --- MAIN PREVIEW --- */}
      <div className="flex-1 overflow-auto relative print-area" 
           style={{ 
             backgroundColor: config.customBgImage ? '#fff' : currentTheme.bg,
             backgroundImage: config.customBgImage ? `url(${config.customBgImage})` : currentTheme.floor,
             backgroundSize: config.customBgImage ? 'cover' : currentTheme.floorSize,
             backgroundPosition: 'center',
             backgroundAttachment: config.customBgImage ? 'fixed' : 'scroll'
           }}>
        
        {/* If using custom bg, add an overlay to ensure text readability */}
        {config.customBgImage && (
          <div className="absolute inset-0 bg-white/50 pointer-events-none"></div>
        )}

        {/* ZOOM CONTROLS */}
        <div className="fixed top-5 right-5 z-40 bg-white shadow-lg rounded-lg flex flex-col gap-1 p-1 border border-slate-200 no-print">
            <button 
              onClick={handleZoomIn}
              className="p-1.5 hover:bg-slate-100 text-slate-600 rounded"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <div className="text-[10px] font-bold text-center text-slate-400 border-y border-slate-100 py-1">
              {Math.round(zoomLevel * 100)}%
            </div>
            <button 
              onClick={handleZoomOut}
              className="p-1.5 hover:bg-slate-100 text-slate-600 rounded"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button 
              onClick={handleZoomReset}
              className="p-1.5 hover:bg-slate-100 text-slate-600 rounded border-t border-slate-100"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
        </div>
        
        {/* WE MOVE THE printRef HERE TO CAPTURE THE BACKGROUND TOO */}
        {/* Added wrapper for zoom scaling */}
        <div 
          style={{ 
            transform: `scale(${zoomLevel})`, 
            transformOrigin: 'top center',
            width: 'fit-content',
            minWidth: '100%',
            margin: '0 auto',
            transition: 'transform 0.2s ease-out'
          }}
        >
          <div 
            ref={printRef} 
            className="min-h-full p-12 flex flex-col items-center relative z-10 w-fit mx-auto min-w-full"
            style={{
              // Ensure background is inherited/visible when capturing this specific element
              // We duplicate the background styles here for the capture element
              backgroundColor: config.customBgImage ? 'rgba(255,255,255,0.8)' : currentTheme.bg, 
              backgroundImage: config.customBgImage ? `url(${config.customBgImage})` : currentTheme.floor,
              backgroundSize: config.customBgImage ? 'cover' : currentTheme.floorSize,
            }}
          >
            
            {/* Paper Header (Print View) */}
            <div className="text-center mb-12 bg-white/95 backdrop-blur-sm px-10 py-6 rounded-xl shadow-lg border border-slate-200 max-w-2xl w-full relative transform rotate-1 hover:rotate-0 transition-transform duration-500 page-break">
              {/* Thumbtack visual */}
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-4 h-4 rounded-full bg-red-500 shadow-sm border-2 border-red-700 z-10"></div>
              
              <h2 className="text-3xl font-black text-slate-800 mb-1 tracking-tight">{config.className || 'Classroom Plan'}</h2>
              <h3 className="text-xl font-bold text-indigo-600 mb-2">{config.subject || 'Seating Chart'}</h3>
              
              <div className="flex items-center justify-center gap-3 text-slate-500 font-medium text-sm">
                <span className="flex items-center gap-1"><Users className="w-4 h-4"/> {students.length} Students</span>
                <span className="text-slate-300">|</span>
                <span className="flex items-center gap-1"><GraduationCap className="w-4 h-4"/> {config.teacherName || 'Teacher'}</span>
              </div>
              
              <div className="absolute top-4 right-4 text-[10px] text-slate-300 font-mono hidden md:block">
                {new Date().toLocaleDateString()}
              </div>
            </div>
            
            {/* Table Grid */}
            {generatedGroups.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-20 w-full max-w-7xl mx-auto px-4 pb-20 grid-print-layout">
                {generatedGroups.map((group, groupIndex) => (
                  <TableGroup 
                    key={groupIndex}
                    index={groupIndex}
                    students={group}
                    theme={currentTheme}
                    groupSize={config.groupSize}
                    strategy={config.strategy}
                    layoutMode={config.layoutMode}
                    name={groupNames[groupIndex] || `Group ${groupIndex + 1}`}
                    fontSize={config.fontSize}
                    onRename={(newName) => handleGroupNameChange(groupIndex, newName)}
                    onStudentDrop={handleStudentDrop}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-slate-400 mt-20 bg-white/50 p-10 rounded-xl">
                <LayoutGrid className="w-16 h-16 mb-4 opacity-50" />
                <p className="text-xl font-medium">Add students to the roster to begin!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}