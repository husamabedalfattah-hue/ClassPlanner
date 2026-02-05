import React, { useState } from 'react';
import { Student, Theme } from '../types';

interface TableGroupProps {
  index: number;
  students: Student[];
  theme: Theme;
  groupSize: number;
  strategy: string;
  layoutMode: 'circle' | 'rect' | 'row';
  name: string;
  fontSize: number;
  onRename: (newName: string) => void;
  onStudentDrop: (studentId: string, targetIndex: number) => void;
}

const TableGroup: React.FC<TableGroupProps> = ({ index, students, theme, layoutMode, name, fontSize, onRename, onStudentDrop }) => {
  const colorTheme = theme.groups[index % theme.groups.length];
  const [isDragOver, setIsDragOver] = useState(false);
  
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const studentId = e.dataTransfer.getData('studentId');
    if (studentId) {
      onStudentDrop(studentId, index);
    }
  };

  // Helper for consistent seat styling
  const getSeatTextStyle = () => ({
    fontSize: `${fontSize}px`,
    lineHeight: '1.2',
    wordBreak: 'break-word' as const
  });

  // --- RENDERERS ---

  // 1. CIRCULAR LAYOUT (Classic)
  const renderCircle = () => {
    const baseRadius = 100; 
    const radius = students.length > 6 ? baseRadius + (students.length - 6) * 15 : baseRadius;
    const containerSize = radius * 2 + 80;

    return (
      <div 
        className="relative"
        style={{ width: containerSize, height: containerSize }}
      >
        {/* Table Surface */}
        <div 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full flex flex-col items-center justify-center text-center z-10 shadow-xl border-4 transition-all duration-300 group"
          style={{ 
            width: '140px',
            height: '140px',
            backgroundColor: colorTheme.main,
            borderColor: 'rgba(255,255,255,0.2)',
            color: colorTheme.text
          }}
        >
           <input 
              type="text"
              value={name}
              onChange={(e) => onRename(e.target.value)}
              className="bg-transparent border-b border-transparent hover:border-white/50 focus:border-white text-center w-3/4 font-black text-xl focus:outline-none transition-colors"
              style={{ color: colorTheme.text }}
           />
           <span className="text-[10px] opacity-60 mt-1 font-medium">{students.length} Seats</span>
        </div>

        {/* Seats */}
        {students.map((student, i) => {
          const total = students.length;
          const angle = (i * (360 / total)) - 90;
          const angleRad = angle * (Math.PI / 180);
          const x = Math.cos(angleRad) * radius;
          const y = Math.sin(angleRad) * radius;

          return (
            <div
              key={student.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('studentId', student.id);
                e.dataTransfer.effectAllowed = 'move';
              }}
              className="absolute top-1/2 left-1/2 flex items-center justify-center w-20 h-20 rounded-full shadow-lg bg-white border-4 transition-all duration-300 hover:scale-110 hover:z-50 z-20 cursor-move"
              style={{
                borderColor: colorTheme.main,
                transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
              }}
            >
               {/* Inner Flex Container ensuring robust centering for HTML2Canvas */}
               <div className="w-full h-full flex flex-col justify-center items-center p-2 text-center overflow-hidden">
                 <span 
                   className="font-bold text-slate-700 select-none pointer-events-none w-full"
                   style={getSeatTextStyle()}
                 >
                  {student.name}
                </span>
               </div>
            </div>
          );
        })}
      </div>
    );
  };

  // 2. RECTANGULAR TABLE LAYOUT
  const renderRect = () => {
    // Split students into two sides for a rectangular table
    const sideA = students.slice(0, Math.ceil(students.length / 2));
    const sideB = students.slice(Math.ceil(students.length / 2));

    return (
      <div className="flex flex-col items-center justify-center p-4">
        {/* Top Side */}
        <div className="flex gap-4 mb-2">
          {sideA.map((student) => (
            <div
              key={student.id}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('studentId', student.id);
                e.dataTransfer.effectAllowed = 'move';
              }}
              className="w-20 h-16 bg-white rounded-lg shadow-md border-b-4 p-1 cursor-move hover:scale-105 transition-transform"
              style={{ borderColor: colorTheme.main }}
            >
               <div className="w-full h-full flex flex-col justify-center items-center text-center overflow-hidden">
                 <span 
                   className="font-bold text-slate-700 select-none pointer-events-none w-full"
                   style={getSeatTextStyle()}
                 >
                   {student.name}
                 </span>
               </div>
            </div>
          ))}
        </div>

        {/* Table Surface */}
        <div 
          className="rounded-lg shadow-lg border-4 flex items-center justify-center relative mb-2"
          style={{ 
            width: `${Math.max(sideA.length, sideB.length, 2) * 90}px`,
            height: '80px',
            backgroundColor: colorTheme.main,
            borderColor: 'rgba(255,255,255,0.2)',
          }}
        >
          <div className="text-center w-full px-4" style={{ color: colorTheme.text }}>
             <input 
                type="text"
                value={name}
                onChange={(e) => onRename(e.target.value)}
                className="bg-transparent border-b border-transparent hover:border-white/50 focus:border-white text-center w-full font-black text-xl focus:outline-none transition-colors"
                style={{ color: colorTheme.text }}
             />
          </div>
        </div>

        {/* Bottom Side */}
        <div className="flex gap-4">
          {sideB.map((student) => (
             <div
             key={student.id}
             draggable
             onDragStart={(e) => {
               e.dataTransfer.setData('studentId', student.id);
               e.dataTransfer.effectAllowed = 'move';
             }}
             className="w-20 h-16 bg-white rounded-lg shadow-md border-t-4 p-1 cursor-move hover:scale-105 transition-transform"
             style={{ borderColor: colorTheme.main }}
           >
             <div className="w-full h-full flex flex-col justify-center items-center text-center overflow-hidden">
                <span 
                  className="font-bold text-slate-700 select-none pointer-events-none w-full"
                  style={getSeatTextStyle()}
                >
                  {student.name}
                </span>
             </div>
           </div>
          ))}
        </div>
      </div>
    );
  };

  // 3. ROWS LAYOUT (Grid of desks)
  const renderRow = () => {
    return (
      <div className="p-4 bg-white/40 rounded-xl border border-dashed border-slate-300">
         <div className="mb-3 flex items-center gap-2">
            <span 
              className="px-2 py-1 rounded text-xs font-bold text-white shadow-sm"
              style={{ backgroundColor: colorTheme.main }}
            >
              <input 
                type="text"
                value={name}
                onChange={(e) => onRename(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-white text-xs font-bold w-16 focus:outline-none focus:bg-white/20 rounded px-1"
                style={{ color: 'white' }}
              />
            </span>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">{students.length} Desks</span>
         </div>
         
         <div className="flex flex-wrap gap-4">
            {students.map((student) => (
              <div
                key={student.id}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData('studentId', student.id);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                className="w-24 h-20 bg-white rounded shadow-sm border border-slate-200 flex flex-col relative overflow-hidden group hover:shadow-md transition-all cursor-move"
              >
                  <div className="h-1 w-full" style={{ backgroundColor: colorTheme.main }}></div>
                  <div className="flex-1 p-1 w-full overflow-hidden">
                    <div className="w-full h-full flex flex-col justify-center items-center text-center">
                      <span 
                        className="font-bold text-slate-700 select-none pointer-events-none w-full"
                        style={getSeatTextStyle()}
                      >
                        {student.name}
                      </span>
                    </div>
                  </div>
                  <div className="h-1 w-full bg-slate-100 mt-auto"></div>
              </div>
            ))}
            {/* Empty Desk Placeholders if row isn't full */}
            {Array.from({ length: Math.max(0, 2 - students.length) }).map((_, i) => (
               <div key={`empty-${i}`} className="w-24 h-20 border-2 border-dashed border-slate-200 rounded flex items-center justify-center opacity-50">
                  <span className="text-[10px] text-slate-300 uppercase">Empty</span>
               </div>
            ))}
         </div>
      </div>
    );
  };

  return (
    <div 
      className={`page-break relative flex flex-col items-center justify-center transition-all duration-300 rounded-3xl ${isDragOver ? 'ring-4 ring-indigo-400 ring-opacity-50 bg-indigo-50/30' : ''}`}
      style={{ margin: '0 auto', minWidth: '200px' }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {layoutMode === 'circle' && renderCircle()}
      {layoutMode === 'rect' && renderRect()}
      {layoutMode === 'row' && renderRow()}
    </div>
  );
};

export default TableGroup;