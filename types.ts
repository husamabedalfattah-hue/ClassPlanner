export type StudentLevel = 'High' | 'Mid' | 'Low';

export interface Student {
  id: string;
  name: string;
  level: StudentLevel;
}

export type RuleType = 'pair' | 'separate';

export interface Rule {
  id: number;
  type: RuleType;
  studentAId: string;
  studentBId: string;
}

export interface Config {
  groupSize: number;
  theme: string;
  strategy: 'random' | 'mix' | 'group';
  teacherName: string;
  className: string;
  subject: string;
  customBgImage: string | null;
  layoutMode: 'circle' | 'rect' | 'row';
  font: string;
  fontSize: number;
}

export interface ThemeGroup {
  main: string;
  light: string;
  text: string;
}

export interface Theme {
  id: string;
  name: string;
  bg: string;
  floor: string;
  floorSize: string;
  groups: ThemeGroup[];
}

export interface ExportData {
  version: string;
  date: string;
  config: Config;
  students: Student[];
  rules: Rule[];
}