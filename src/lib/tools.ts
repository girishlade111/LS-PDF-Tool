import { 
  Merge, Scissors, Minimize2, RotateCw, 
  FileImage, ImagePlus, Droplets, Lock, 
  LayoutList, FileText 
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
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 hover:bg-orange-100',
    category: 'organize',
  },
  {
    id: 'split',
    name: 'Split PDF',
    description: 'Separate one PDF into multiple files',
    icon: Scissors,
    color: 'text-red-600',
    bgColor: 'bg-red-50 hover:bg-red-100',
    category: 'organize',
  },
  {
    id: 'compress',
    name: 'Compress PDF',
    description: 'Reduce file size while maintaining quality',
    icon: Minimize2,
    color: 'text-green-600',
    bgColor: 'bg-green-50 hover:bg-green-100',
    category: 'optimize',
  },
  {
    id: 'rotate',
    name: 'Rotate PDF',
    description: 'Rotate PDF pages to any angle',
    icon: RotateCw,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 hover:bg-blue-100',
    category: 'organize',
  },
  {
    id: 'pdf-to-jpg',
    name: 'PDF to JPG',
    description: 'Convert PDF pages to JPG images',
    icon: FileImage,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 hover:bg-purple-100',
    category: 'convert',
  },
  {
    id: 'jpg-to-pdf',
    name: 'JPG to PDF',
    description: 'Convert JPG images to a PDF document',
    icon: ImagePlus,
    color: 'text-pink-600',
    bgColor: 'bg-pink-50 hover:bg-pink-100',
    category: 'convert',
  },
  {
    id: 'watermark',
    name: 'Watermark PDF',
    description: 'Add text or image watermark to PDF',
    icon: Droplets,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50 hover:bg-cyan-100',
    category: 'security',
  },
  {
    id: 'protect',
    name: 'Protect PDF',
    description: 'Add password protection to your PDF',
    icon: Lock,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 hover:bg-amber-100',
    category: 'security',
  },
  {
    id: 'organize',
    name: 'Organize PDF',
    description: 'Reorder, delete, or rearrange PDF pages',
    icon: LayoutList,
    color: 'text-teal-600',
    bgColor: 'bg-teal-50 hover:bg-teal-100',
    category: 'organize',
  },
  {
    id: 'pdf-to-text',
    name: 'PDF to Text',
    description: 'Extract text content from PDF files',
    icon: FileText,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50 hover:bg-indigo-100',
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
