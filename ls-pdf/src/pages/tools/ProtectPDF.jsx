import React, { useState } from 'react';
import { PDFDocument } from 'pdf-lib';
import { Lock, File as FileIcon, X, AlertCircle, Eye, EyeOff, Shield, Info } from 'lucide-react';
import ToolPageLayout from '../../components/common/ToolPageLayout';
import FileDropzone from '../../components/common/FileDropzone';
import ProcessingStatus from '../../components/common/ProcessingStatus';
import DownloadResult from '../../components/common/DownloadResult';
import { useFileStore } from '../../context/FileStoreContext';
import { addHistoryEntry } from '../../utils/indexedDBUtils';

const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const getPasswordStrength = (pwd) => {
  if (!pwd) return { label: '', color: 'bg-muted/20 text-transparent' };
  
  if (pwd.length < 6) return { label: 'Weak', color: 'bg-red-500 text-white' };
  
  const hasLetters = /[a-zA-Z]/.test(pwd);
  const hasNumbers = /\d/.test(pwd);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);
  
  if (pwd.length >= 8 && hasLetters && hasNumbers && hasSpecial) {
    return { label: 'Strong', color: 'bg-[#22C55E] text-white' };
  }
  
  if (pwd.length >= 6 && ((hasLetters && hasNumbers) || (hasLetters && hasSpecial) || (hasNumbers && hasSpecial))) {
    return { label: 'Medium', color: 'bg-amber-500 text-white' };
  }
  
  return { label: 'Weak', color: 'bg-red-500 text-white' };
};

export default function ProtectPDF() {
  const { state, dispatch } = useFileStore();
  const { inputFiles, outputFile, outputFileName, status, progress, errorMessage } = state;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [allowPrint, setAllowPrint] = useState(true);
  const [allowCopy, setAllowCopy] = useState(false);
  const [allowEdit, setAllowEdit] = useState(false);

  const handleFilesAccepted = (files) => {
    if (files.length === 0) return;
    dispatch({ type: 'SET_INPUT_FILES', payload: [files[0]] });
    dispatch({ type: 'SET_ERROR', payload: '' });
  };

  const removeFile = () => {
    dispatch({ type: 'SET_INPUT_FILES', payload: [] });
  };

  const handleProtect = async () => {
    if (inputFiles.length === 0 || !password || password !== confirmPassword) return;
    
    dispatch({ type: 'SET_STATUS', payload: { status: 'processing', progress: 0 } });
    dispatch({ type: 'SET_ERROR', payload: '' });

    try {
      const file = inputFiles[0];
      const arrayBuffer = await file.arrayBuffer();
      
      dispatch({ type: 'SET_STATUS', payload: { status: 'processing', progress: 30 } });
      
      const pdfDoc = await PDFDocument.load(arrayBuffer);

      dispatch({ type: 'SET_STATUS', payload: { status: 'processing', progress: 60 } });

      const pdfBytes = await pdfDoc.save({
        userPassword: password,
        ownerPassword: password + '_owner', // Give owner password a random-ish suffix so user isn't locked out of changing it if they only know one
        permissions: {
          printing: allowPrint ? 'highResolution' : undefined,
          modifying: allowEdit,
          copying: allowCopy,
        },
      });

      dispatch({ type: 'SET_STATUS', payload: { status: 'processing', progress: 90 } });

      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const outName = 'protected.pdf';
      
      dispatch({ type: 'SET_OUTPUT', payload: { file: blob, fileName: outName } });
      dispatch({ type: 'SET_STATUS', payload: { status: 'done', progress: 100 } });

      await addHistoryEntry({
        toolName: 'Protect PDF',
        fileName: file.name,
        fileSize: blob.size,
        status: 'success'
      });

    } catch (error) {
      console.error("Protect error:", error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to protect PDF. ' + (error.message || 'The file might already be encrypted or is corrupted.') });
    }
  };

  const handleReset = () => {
    dispatch({ type: 'RESET' });
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setAllowPrint(true);
    setAllowCopy(false);
    setAllowEdit(false);
  };

  const strength = getPasswordStrength(password);
  const passwordsMatch = password === confirmPassword;
  const showMismatchError = confirmPassword.length > 0 && !passwordsMatch;

  return (
    <ToolPageLayout
      toolName="Protect PDF"
      description="Encrypt your PDF with a password to keep sensitive data confidential."
      icon={<Shield className="w-8 h-8" />}
      iconColor="text-gray-700"
      iconBg="bg-gray-100"
    >
      {(status === 'idle' || status === 'error') && (
        <div className="space-y-6">
          {status === 'error' && errorMessage && (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg font-medium text-sm border border-red-100 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {inputFiles.length === 0 ? (
            <FileDropzone 
              accept={{ 'application/pdf': ['.pdf'] }} 
              multiple={false} 
              onFilesAccepted={handleFilesAccepted}
            />
          ) : (
            <div className="space-y-6">
              
              {/* Selected File Box */}
              <div className="flex items-center justify-between p-4 border border-muted/20 rounded-lg bg-surface">
                <div className="flex items-center gap-3 overflow-hidden">
                  <FileIcon className="text-primary w-6 h-6 shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-text truncate max-w-[200px] sm:max-w-xs">{inputFiles[0].name}</span>
                    <span className="text-xs text-muted">{formatFileSize(inputFiles[0].size)}</span>
                  </div>
                </div>
                <button 
                  onClick={removeFile}
                  className="p-2 text-muted hover:text-primary transition-colors rounded-full hover:bg-primary/10 shrink-0"
                  aria-label="Remove file"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Info Banner */}
              <div className="bg-slate-50 text-slate-700 p-4 rounded-lg font-medium text-sm border border-slate-200 flex items-start gap-3">
                <Lock className="w-5 h-5 shrink-0 mt-0.5 text-slate-500" />
                <p>Password is applied securely in your browser. We never see your file or password.</p>
              </div>

              {/* Password Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-white p-6 border border-muted/20 rounded-xl shadow-sm">
                
                {/* Set Password */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-text">Set Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter a strong password"
                      className="w-full px-4 py-2.5 pr-10 border border-muted/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text transition-colors"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  
                  {/* Strength Indicator */}
                  <div className="flex items-center justify-between pt-1">
                    <div className="flex gap-1 w-full max-w-[150px]">
                      <div className={`h-1.5 flex-1 rounded-full transition-colors ${password.length > 0 ? (strength.label === 'Weak' ? 'bg-red-500' : strength.label === 'Medium' ? 'bg-amber-500' : 'bg-[#22C55E]') : 'bg-muted/20'}`}></div>
                      <div className={`h-1.5 flex-1 rounded-full transition-colors ${password.length > 0 && (strength.label === 'Medium' || strength.label === 'Strong') ? (strength.label === 'Medium' ? 'bg-amber-500' : 'bg-[#22C55E]') : 'bg-muted/20'}`}></div>
                      <div className={`h-1.5 flex-1 rounded-full transition-colors ${password.length > 0 && strength.label === 'Strong' ? 'bg-[#22C55E]' : 'bg-muted/20'}`}></div>
                    </div>
                    {password && (
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${strength.color}`}>
                        {strength.label}
                      </span>
                    )}
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-text">Confirm Password</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat password"
                      className={`w-full px-4 py-2.5 pr-10 border rounded-lg focus:outline-none focus:ring-2 transition-colors ${
                        showMismatchError 
                          ? 'border-red-300 focus:ring-red-200 focus:border-red-500' 
                          : 'border-muted/30 focus:ring-primary/20 focus:border-primary'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text transition-colors"
                      aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {showMismatchError && (
                    <p className="text-red-500 text-xs font-medium mt-1">Passwords do not match</p>
                  )}
                </div>

              </div>

              {/* Permissions */}
              <div className="bg-surface p-5 border border-muted/20 rounded-xl">
                <h3 className="text-sm font-bold text-text mb-4">Document Permissions</h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={allowPrint} 
                      onChange={(e) => setAllowPrint(e.target.checked)}
                      className="w-4 h-4 text-primary border-muted/40 rounded focus:ring-primary focus:ring-offset-0 cursor-pointer"
                    />
                    <span className="text-sm font-medium text-text group-hover:text-primary transition-colors">Allow Printing</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={allowCopy} 
                      onChange={(e) => setAllowCopy(e.target.checked)}
                      className="w-4 h-4 text-primary border-muted/40 rounded focus:ring-primary focus:ring-offset-0 cursor-pointer"
                    />
                    <span className="text-sm font-medium text-text group-hover:text-primary transition-colors">Allow Copying Text</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={allowEdit} 
                      onChange={(e) => setAllowEdit(e.target.checked)}
                      className="w-4 h-4 text-primary border-muted/40 rounded focus:ring-primary focus:ring-offset-0 cursor-pointer"
                    />
                    <span className="text-sm font-medium text-text group-hover:text-primary transition-colors">Allow Editing</span>
                  </label>
                </div>
              </div>

              {/* Action Button */}
              <button
                onClick={handleProtect}
                disabled={!password || !passwordsMatch}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white font-bold py-3.5 px-6 rounded-lg hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Lock className="w-5 h-5" />
                Protect PDF
              </button>
            </div>
          )}
        </div>
      )}

      {status === 'processing' && (
        <ProcessingStatus progress={progress} message="Encrypting your PDF document..." />
      )}

      {status === 'done' && (
        <DownloadResult 
          outputFile={outputFile} 
          outputFileName={outputFileName} 
          onReset={handleReset} 
          toolName="Protected PDF"
        />
      )}
    </ToolPageLayout>
  );
}
