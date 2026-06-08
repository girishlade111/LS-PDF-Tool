import { create } from 'zustand';

export type ToolId = 
  | 'merge'
  | 'split'
  | 'compress'
  | 'rotate'
  | 'pdf-to-jpg'
  | 'jpg-to-pdf'
  | 'watermark'
  | 'protect'
  | 'organize'
  | 'pdf-to-text'
  | 'page-numbers'
  | 'extract-pages'
  | 'edit-metadata'
  | 'delete-pages'
  | 'pdf-to-png';

interface NavStore {
  currentPage: 'home' | ToolId;
  navigate: (page: 'home' | ToolId) => void;
  goHome: () => void;
}

export const useNavStore = create<NavStore>((set) => ({
  currentPage: 'home',
  navigate: (page) => {
    if (page === 'home') {
      window.location.hash = '';
    } else {
      window.location.hash = `#${page}`;
    }
    set({ currentPage: page });
  },
  goHome: () => {
    window.location.hash = '';
    set({ currentPage: 'home' });
  },
}));

// Initialize from hash on load
if (typeof window !== 'undefined') {
  const hash = window.location.hash.replace('#', '');
  if (hash) {
    useNavStore.setState({ currentPage: hash as NavStore['currentPage'] });
  }
  
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '') || 'home';
    useNavStore.setState({ currentPage: hash as NavStore['currentPage'] });
  });
}
