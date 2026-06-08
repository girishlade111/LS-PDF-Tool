import { 
  Merge, Scissors, Minimize2, RotateCw, 
  FileImage, ImagePlus, Droplets, Lock, 
  LayoutList, FileText, Hash, Settings, Trash2
} from 'lucide-react';
import React from 'react';

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  category: 'convert' | 'organize' | 'security' | 'optimize';
}

export const tools: ToolDefinition[] = [
  {
    id: 'merge',
    name: 'Merge PDF',
    description: 'Combine multiple PDF files into one document',
    icon: Merge,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-50 hover:bg-orange-100 dark:bg-orange-950/30 dark:hover:bg-orange-950/50',
    category: 'organize',
  },
  {
    id: 'split',
    name: 'Split PDF',
    description: 'Separate one PDF into multiple files',
    icon: Scissors,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/50',
    category: 'organize',
  },
  {
    id: 'compress',
    name: 'Compress PDF',
    description: 'Reduce file size while maintaining quality',
    icon: Minimize2,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 hover:bg-green-100 dark:bg-green-950/30 dark:hover:bg-green-950/50',
    category: 'optimize',
  },
  {
    id: 'rotate',
    name: 'Rotate PDF',
    description: 'Rotate PDF pages to any angle',
    icon: RotateCw,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/30 dark:hover:bg-blue-950/50',
    category: 'organize',
  },
  {
    id: 'pdf-to-jpg',
    name: 'PDF to JPG',
    description: 'Convert PDF pages to JPG images',
    icon: FileImage,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/30 dark:hover:bg-purple-950/50',
    category: 'convert',
  },
  {
    id: 'jpg-to-pdf',
    name: 'JPG to PDF',
    description: 'Convert JPG images to a PDF document',
    icon: ImagePlus,
    color: 'text-pink-600 dark:text-pink-400',
    bgColor: 'bg-pink-50 hover:bg-pink-100 dark:bg-pink-950/30 dark:hover:bg-pink-950/50',
    category: 'convert',
  },
  {
    id: 'watermark',
    name: 'Watermark PDF',
    description: 'Add text or image watermark to PDF',
    icon: Droplets,
    color: 'text-cyan-600 dark:text-cyan-400',
    bgColor: 'bg-cyan-50 hover:bg-cyan-100 dark:bg-cyan-950/30 dark:hover:bg-cyan-950/50',
    category: 'security',
  },
  {
    id: 'protect',
    name: 'Protect PDF',
    description: 'Add password protection to your PDF',
    icon: Lock,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/30 dark:hover:bg-amber-950/50',
    category: 'security',
  },
  {
    id: 'organize',
    name: 'Organize PDF',
    description: 'Reorder, delete, or rearrange PDF pages',
    icon: LayoutList,
    color: 'text-teal-600 dark:text-teal-400',
    bgColor: 'bg-teal-50 hover:bg-teal-100 dark:bg-teal-950/30 dark:hover:bg-teal-950/50',
    category: 'organize',
  },
  {
    id: 'pdf-to-text',
    name: 'PDF to Text',
    description: 'Extract text content from PDF files',
    icon: FileText,
    color: 'text-sky-600 dark:text-sky-400',
    bgColor: 'bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/30 dark:hover:bg-sky-950/50',
    category: 'convert',
  },
  {
    id: 'page-numbers',
    name: 'Page Numbers',
    description: 'Add page numbers to your PDF document',
    icon: Hash,
    color: 'text-violet-600 dark:text-violet-400',
    bgColor: 'bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/30 dark:hover:bg-violet-950/50',
    category: 'organize',
  },
  {
    id: 'extract-pages',
    name: 'Extract Pages',
    description: 'Extract specific pages into a new PDF',
    icon: Scissors,
    color: 'text-rose-600 dark:text-rose-400',
    bgColor: 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50',
    category: 'organize',
  },
  {
    id: 'edit-metadata',
    name: 'Edit Metadata',
    description: 'View and edit PDF document metadata',
    icon: Settings,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-950/50',
    category: 'organize',
  },
  {
    id: 'delete-pages',
    name: 'Delete Pages',
    description: 'Remove specific pages from your PDF',
    icon: Trash2,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-950/50',
    category: 'organize',
  },
  {
    id: 'pdf-to-png',
    name: 'PDF to PNG',
    description: 'Convert PDF pages to PNG images',
    icon: FileImage,
    color: 'text-lime-600 dark:text-lime-400',
    bgColor: 'bg-lime-50 hover:bg-lime-100 dark:bg-lime-950/30 dark:hover:bg-lime-950/50',
    category: 'convert',
  },
];

export function getToolById(id: string): ToolDefinition | undefined {
  return tools.find((t) => t.id === id);
}

export const categories = [
  { id: 'convert', name: 'Convert', description: 'Convert between formats' },
  { id: 'organize', name: 'Organize', description: 'Rearrange and manage pages' },
  { id: 'optimize', name: 'Optimize', description: 'Reduce size and improve performance' },
  { id: 'security', name: 'Security', description: 'Protect and secure your PDFs' },
] as const;
