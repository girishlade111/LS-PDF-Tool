import React from 'react';

export default function PDFThumbnail({ 
  src, 
  badgeText,
  label,
  isSelected, 
  onClick, 
  imageStyle,
  imageClassName = '',
  imageOverlay,
  children, 
  className = '' 
}) {
  return (
    <div 
      onClick={onClick}
      className={`relative flex flex-col items-center bg-white p-2 rounded-lg border-2 shadow-sm transition-all ${
        onClick ? 'cursor-pointer' : ''
      } ${
        isSelected ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/50' : 'border-muted/20 hover:border-primary/30'
      } ${className}`}
    >
      <div className="relative w-full aspect-[1/1.4] flex items-center justify-center bg-surface mb-2 overflow-hidden rounded border border-muted/10">
        {!src ? (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/5 animate-pulse text-muted">
            <span className="text-xs">Loading...</span>
          </div>
        ) : (
          <img 
            src={src} 
            alt={label || badgeText || 'Thumbnail'} 
            style={imageStyle}
            className={`max-w-full max-h-full object-contain shadow-sm transition-transform duration-300 ${imageClassName}`} 
          />
        )}
        {imageOverlay}
        
        {badgeText && (
          <div className="absolute top-1 left-1 bg-white/90 backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] font-bold text-text shadow-sm z-20 border border-muted/10">
            {badgeText}
          </div>
        )}
      </div>
      
      {label && (
        <span className={`text-xs font-bold mb-1 ${isSelected ? 'text-blue-600' : 'text-muted'}`}>
          {label}
        </span>
      )}
      
      {children}
    </div>
  );
}
