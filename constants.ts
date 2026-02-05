import { Theme } from './types';

export const FONTS: Record<string, string> = {
  'Fredoka': 'Rounded',
  'Inter': 'Modern',
  'Comic Neue': 'Playful',
  'Playfair Display': 'Elegant',
  'Roboto Mono': 'Technical'
};

export const THEMES: Record<string, Theme> = {
  pastel: {
    id: 'pastel',
    name: 'Pastel Party',
    bg: '#f8fafc',
    floor: 'radial-gradient(#e2e8f0 15%, transparent 16%)', 
    floorSize: '24px 24px',
    groups: [
      { main: '#FF6B6B', light: '#FFE3E3', text: '#333' },
      { main: '#4ECDC4', light: '#E0F7FA', text: '#333' },
      { main: '#FFD166', light: '#FFF8E1', text: '#333' },
      { main: '#6C5CE7', light: '#EBE8FF', text: '#333' },
      { main: '#55E6C1', light: '#E0F2F1', text: '#333' },
      { main: '#ff9ff3', light: '#fce4ec', text: '#333' },
    ]
  },
  wood: {
    id: 'wood',
    name: 'Cozy Classroom',
    bg: '#f7f1e3',
    floor: 'repeating-linear-gradient(45deg, #d4a373 0, #d4a373 20px, #cd9b6a 20px, #cd9b6a 40px)', 
    floorSize: '100% 100%',
    groups: [
      { main: '#2c3e50', light: '#ecf0f1', text: '#fff' },
      { main: '#27ae60', light: '#eafaf1', text: '#333' },
      { main: '#d35400', light: '#fae5d3', text: '#333' },
      { main: '#8e44ad', light: '#f4ecf7', text: '#333' },
      { main: '#c0392b', light: '#f9e79f', text: '#333' },
      { main: '#16a085', light: '#e8f8f5', text: '#333' },
    ]
  },
  blueprint: {
    id: 'blueprint',
    name: 'Blueprint',
    bg: '#2c3e50',
    floor: `linear-gradient(#34495e 1px, transparent 1px), linear-gradient(90deg, #34495e 1px, transparent 1px)`,
    floorSize: '40px 40px',
    groups: [
      { main: '#3498db', light: '#2980b9', text: '#fff' },
      { main: '#3498db', light: '#2980b9', text: '#fff' },
      { main: '#3498db', light: '#2980b9', text: '#fff' },
      { main: '#3498db', light: '#2980b9', text: '#fff' },
      { main: '#3498db', light: '#2980b9', text: '#fff' },
      { main: '#3498db', light: '#2980b9', text: '#fff' },
    ]
  },
  grid: {
    id: 'grid',
    name: 'Graph Paper',
    bg: '#ffffff',
    floor: `linear-gradient(#e5e7eb 1px, transparent 1px), linear-gradient(90deg, #e5e7eb 1px, transparent 1px)`,
    floorSize: '20px 20px',
    groups: [
      { main: '#111827', light: '#f3f4f6', text: '#fff' },
      { main: '#4b5563', light: '#f3f4f6', text: '#fff' },
      { main: '#111827', light: '#f3f4f6', text: '#fff' },
      { main: '#4b5563', light: '#f3f4f6', text: '#fff' },
      { main: '#111827', light: '#f3f4f6', text: '#fff' },
      { main: '#4b5563', light: '#f3f4f6', text: '#fff' },
    ]
  },
  night: {
    id: 'night',
    name: 'Night Sky',
    bg: '#0f172a',
    floor: 'radial-gradient(white 1px, transparent 0)',
    floorSize: '40px 40px',
    groups: [
      { main: '#818cf8', light: '#1e1b4b', text: '#fff' },
      { main: '#c084fc', light: '#2e1065', text: '#fff' },
      { main: '#2dd4bf', light: '#134e4a', text: '#fff' },
      { main: '#fb7185', light: '#4c0519', text: '#fff' },
      { main: '#38bdf8', light: '#0c4a6e', text: '#fff' },
      { main: '#a78bfa', light: '#2e1065', text: '#fff' },
    ]
  },
  garden: {
    id: 'garden',
    name: 'Garden',
    bg: '#f0fdf4',
    floor: 'radial-gradient(#bbf7d0 20%, transparent 20%)',
    floorSize: '30px 30px',
    groups: [
      { main: '#15803d', light: '#dcfce7', text: '#fff' },
      { main: '#ea580c', light: '#ffedd5', text: '#fff' },
      { main: '#0369a1', light: '#e0f2fe', text: '#fff' },
      { main: '#b91c1c', light: '#fee2e2', text: '#fff' },
      { main: '#7e22ce', light: '#f3e8ff', text: '#fff' },
      { main: '#be185d', light: '#fce7f3', text: '#fff' },
    ]
  }
};

export const DEFAULT_NAMES = [
  "Bilal", "Mustafa", "Adam", "Sarah", "Noor", 
  "Hassan", "Dalia", "Lina", "Mariam", "Abdullah", 
  "Hamza", "Youssef", "Tarek", "Salma", "Khalid", 
  "Zaid", "Rania", "Ahmed", "Huda", "Fatimah", 
  "Aisha", "Leen", "Ibrahim", "Omar", "Reem"
];