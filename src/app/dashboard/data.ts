import {
  BarChart3,
  BriefcaseBusiness,
  HelpCircle,
  Home,
  Network,
  Settings2,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  icon: LucideIcon;
  active?: boolean;
};

export type RequestStatus = "On Track" | "Delayed" | "Critical";

export type LiveRequest = {
  id: string;
  title: string;
  owner: string;
  date: string;
  status: RequestStatus;
  badges: number[];
};

export type Kpi = {
  label: string;
  value: string;
};

export type DonutPoint = {
  name: string;
  value: number;
  color: string;
};

export type ClientVolumePoint = {
  client: string;
  assignments: number;
};

export const navItems: NavItem[] = [
  { label: "Home", icon: Home },
  { label: "Requests", icon: BriefcaseBusiness, active: true },
  { label: "Teams", icon: Network },
  { label: "Analytics", icon: BarChart3 },
  { label: "Settings", icon: Settings2 },
  { label: "Help", icon: HelpCircle },
];

export const kpis: Kpi[] = [
  { label: "Requests", value: "10" },
  { label: "Deliveries", value: "08" },
  { label: "AI Efficiency Gain", value: "80%" },
  { label: "Skills", value: "4" },
];

export const liveRequests: LiveRequest[] = [
  {
    id: "REQ-EYGD-240801",
    title: "McKinsey UI/UX",
    owner: "Andrew Garfield",
    date: "26th Sept, 14:00",
    status: "On Track",
    badges: [2],
  },
  {
    id: "REQ-EYGD-240801",
    title: "MCK Translation",
    owner: "Tom Holland",
    date: "26th Sept, 14:00",
    status: "Delayed",
    badges: [2],
  },
  {
    id: "REQ-EYGD-240801",
    title: "Presentation Design Project",
    owner: "Tobey Maguire",
    date: "26th Sept, 14:00",
    status: "On Track",
    badges: [2],
  },
  {
    id: "REQ-EYGD-240801",
    title: "McKinsey UI/UX",
    owner: "Andrew Garfield",
    date: "26th Sept, 14:00",
    status: "On Track",
    badges: [2, 2],
  },
  {
    id: "REQ-EYGD-240801",
    title: "MCK Translation",
    owner: "Tom Holland",
    date: "26th Sept, 14:00",
    status: "Critical",
    badges: [2, 2, 2],
  },
  {
    id: "REQ-EYGD-240801",
    title: "Presentation Design Project",
    owner: "Tobey Maguire",
    date: "26th Sept, 14:00",
    status: "On Track",
    badges: [2],
  },
  {
    id: "REQ-EYGD-240801",
    title: "McKinsey UI/UX",
    owner: "Andrew Garfield",
    date: "26th Sept, 14:00",
    status: "On Track",
    badges: [2, 2],
  },
  {
    id: "REQ-EYGD-240801",
    title: "MCK Translation",
    owner: "Tom Holland",
    date: "26th Sept, 14:00",
    status: "Delayed",
    badges: [2],
  },
];

export const qualityBreakdown: DonutPoint[] = [
  { name: "First Time Right", value: 30, color: "#1e3d35" },
  { name: "Positive", value: 24, color: "#4fc487" },
  { name: "No Reply", value: 16, color: "#b7e8cb" },
  { name: "Negative", value: 10, color: "#69d598" },
  { name: "Rework", value: 10, color: "#dceee6" },
];

export const timelinessBreakdown: DonutPoint[] = [
  { name: "Before Time", value: 22, color: "#1e3d35" },
  { name: "On Time", value: 20, color: "#54c88d" },
  { name: "Slightly Late", value: 18, color: "#c4ead3" },
  { name: "Very Late", value: 10, color: "#63d292" },
  { name: "Unable to Deliver", value: 5, color: "#e3f1ea" },
];

export const clientVolumeData: ClientVolumePoint[] = [
  { client: "Studio 57", assignments: 67 },
  { client: "Tenor", assignments: 61 },
  { client: "ArchStays", assignments: 40 },
  { client: "XLR8", assignments: 30 },
  { client: "Mayfield", assignments: 20 },
  { client: "Others", assignments: 40 },
];
