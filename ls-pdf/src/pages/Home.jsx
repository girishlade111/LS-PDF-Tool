import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Lock, Zap, BadgeCheck, GitMerge, Scissors, 
  PackageOpen, RotateCw, Image as ImageIcon, FileImage, 
  Stamp, LayoutGrid, FileText 
} from 'lucide-react';

const tools = [
  { name: 'Merge PDF', desc: 'Combine multiple PDFs into one unified document.', route: '/merge', icon: GitMerge, color: 'text-red-500', bg: 'bg-red-50' },
  { name: 'Split PDF', desc: 'Extract pages from your PDF or save each page as a separate PDF.', route: '/split', icon: Scissors, color: 'text-orange-500', bg: 'bg-orange-50' },
  { name: 'Compress PDF', desc: 'Reduce PDF file size while maintaining visual quality.', route: '/compress', icon: PackageOpen, color: 'text-blue-500', bg: 'bg-blue-50' },
  { name: 'Rotate PDF', desc: 'Rotate your PDFs the way you need them. You can even rotate multiple PDFs at once!', route: '/rotate', icon: RotateCw, color: 'text-purple-500', bg: 'bg-purple-50' },
  { name: 'PDF to JPG', desc: 'Convert each PDF page into a JPG or extract all images contained in a PDF.', route: '/pdf-to-jpg', icon: ImageIcon, color: 'text-green-500', bg: 'bg-green-50' },
  { name: 'JPG to PDF', desc: 'Convert JPG images to PDF in seconds. Easily adjust orientation and margins.', route: '/jpg-to-pdf', icon: FileImage, color: 'text-amber-500', bg: 'bg-amber-50' },
  { name: 'Watermark PDF', desc: 'Stamp an image or text over your PDF in seconds.', route: '/watermark', icon: Stamp, color: 'text-pink-500', bg: 'bg-pink-50' },
  { name: 'Protect PDF', desc: 'Encrypt your PDF with a password to keep sensitive data confidential.', route: '/protect', icon: Lock, color: 'text-gray-700', bg: 'bg-gray-100' },
  { name: 'Organize PDF', desc: 'Sort, add and delete PDF pages. Drag and drop the page thumbnails.', route: '/organize', icon: LayoutGrid, color: 'text-teal-500', bg: 'bg-teal-50' },
  { name: 'PDF to Text', desc: 'Extract text from your PDF document into a simple TXT file.', route: '/pdf-to-text', icon: FileText, color: 'text-indigo-500', bg: 'bg-indigo-50' },
];

export default function Home() {
  const handleScrollToTools = (e) => {
    e.preventDefault();
    const toolsSection = document.getElementById('tools');
    if (toolsSection) {
      toolsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="w-full bg-surface py-16 px-4 border-b border-muted/10">
        <div className="max-w-4xl mx-auto text-center flex flex-col items-center">
          
          <h1 className="text-3xl md:text-5xl font-bold text-text mb-6">
            Every PDF Tool You Need — <span className="text-primary">100% Free</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted mb-10 max-w-2xl">
            Merge, split, compress, convert and more. No login required. Works in your browser.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md mx-auto mb-16">
            <a
              href="#tools"
              onClick={handleScrollToTools}
              className="flex-1 bg-primary hover:bg-primary/90 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center shadow-sm"
            >
              Try All Tools
            </a>
            <div className="flex-1 border-2 border-muted/20 text-muted font-medium py-3 px-6 rounded-lg flex items-center justify-center cursor-default bg-white/50">
              No Sign-up Needed
            </div>
          </div>

          {/* Trust Badges */}
          <div className="w-full overflow-x-auto pb-4 -mb-4">
            <div className="flex flex-nowrap md:flex-wrap items-center justify-start md:justify-center gap-6 min-w-max px-2">
              <div className="flex items-center gap-2 text-sm font-medium text-text bg-white px-4 py-2 rounded-full shadow-sm border border-muted/10">
                <Lock className="w-4 h-4 text-primary shrink-0" />
                <span>100% Private — Files never leave your browser</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-text bg-white px-4 py-2 rounded-full shadow-sm border border-muted/10">
                <Zap className="w-4 h-4 text-[#EAB308] shrink-0" />
                <span>Instant Processing</span>
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-text bg-white px-4 py-2 rounded-full shadow-sm border border-muted/10">
                <BadgeCheck className="w-4 h-4 text-[#22C55E] shrink-0" />
                <span>Always Free</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Tools Section */}
      <section id="tools" className="w-full bg-white py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-text mb-10">All PDF Tools</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {tools.map((tool, idx) => {
              const Icon = tool.icon;
              return (
                <Link
                  key={idx}
                  to={tool.route}
                  className="bg-white border border-muted/10 rounded-xl p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col items-center text-center group"
                >
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-5 transition-transform group-hover:scale-110 duration-200 ${tool.bg} ${tool.color}`}>
                    <Icon className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-text mb-2">{tool.name}</h3>
                  <p className="text-sm text-muted line-clamp-2 leading-relaxed">
                    {tool.desc}
                  </p>
                </Link>
              );
            })}
          </div>
          
        </div>
      </section>
    </div>
  );
}
