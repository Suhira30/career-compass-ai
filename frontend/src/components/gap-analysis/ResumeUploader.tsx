import React, { useRef, useState } from 'react';
import { apiService, parseApiError } from '../../services/api';
import { ResumeUploadResponse } from '../../types';

interface ResumeUploaderProps {
  onExtractionSuccess: (data: ResumeUploadResponse) => void;
  extractedFileName?: string;
  onRemoveFile?: () => void;
}

export const ResumeUploader: React.FC<ResumeUploaderProps> = ({
  onExtractionSuccess,
  extractedFileName,
  onRemoveFile,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    // Basic format validation
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'pdf' && ext !== 'docx') {
      setErrorMessage('Please upload a valid PDF or DOCX resume.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMessage('File exceeds the 10MB limit.');
      return;
    }

    setErrorMessage(null);
    setIsScanning(true);

    try {
      // Call backend API
      const result = await apiService.uploadResume(file);
      onExtractionSuccess(result);
    } catch (err) {
      console.error('API upload failed:', err);
      setErrorMessage(parseApiError(err));
    } finally {
      setIsScanning(false);
    }
  };

  const handleSampleResume = () => {
    const mockFile = new File(['mock content'], 'alex_rivera_senior_ai_engineer.pdf', {
      type: 'application/pdf',
    });
    handleFileUpload(mockFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="glass-frame rounded-3xl p-6 sm:p-7 flex flex-col justify-between space-y-5">
      <div className="space-y-4">
        {/* Card Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-300 text-sm">
              📄
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">Resume Ingestion</h3>
              <p className="text-[11px] text-white/50">Upload your latest CV or portfolio</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleSampleResume}
            disabled={isScanning}
            className="glass-pill hover:bg-white/20 text-xs font-semibold text-cyan-300 px-3.5 py-1.5 rounded-full transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <span>⚡</span> Load Sample Resume
          </button>
        </div>

        {/* Drag & Drop Frame with Optical Scanning Laser */}
        <div
          onClick={() => !isScanning && fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`drop-zone relative overflow-hidden rounded-2xl p-7 text-center cursor-pointer scan-grid group transition-all ${
            isDragging ? 'border-cyan-400 bg-cyan-500/10' : ''
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileUpload(e.target.files[0]);
              }
            }}
          />

          {/* Scanning Laser Beam & Luminous Trailing Beam */}
          <div
            className="scan-beam"
            style={{
              animationDuration: isScanning ? '1.1s' : '3.2s',
            }}
          />
          <div
            className="scan-glow"
            style={{
              animationDuration: isScanning ? '1.1s' : '3.2s',
            }}
          />

          {/* Animated Upload Logo with Concentric Radar Ripples */}
          <div className="relative w-14 h-14 mx-auto mb-3.5 logo-float">
            <div className="radar-wave" />
            <div className="radar-wave" style={{ animationDelay: '1.2s' }} />

            <div className="relative w-full h-full rounded-2xl bg-gradient-to-b from-cyan-500/25 to-blue-600/25 border border-cyan-400/40 backdrop-blur-md flex items-center justify-center text-cyan-300 shadow-[0_0_25px_rgba(56,189,248,0.35)] group-hover:scale-105 transition-transform">
              <svg className="w-6 h-6 arrow-bob" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
          </div>

          {/* Interactive State Texts */}
          {isScanning ? (
            <div>
              <h4 className="text-sm font-bold text-cyan-300 tracking-tight animate-pulse">
                ⚡ Scanning Resume & Extracting Skills...
              </h4>
              <p className="text-xs text-white/60 mt-1">Analyzing token density and parsing milestones</p>
            </div>
          ) : (
            <div>
              <h4 className="text-sm font-bold text-white tracking-tight group-hover:text-cyan-300 transition-colors">
                Click or drag & drop your resume here
              </h4>
              <p className="text-xs text-white/60 mt-1">Supports PDF or DOCX up to 10MB</p>
            </div>
          )}

          <div className="mt-3.5 inline-flex items-center gap-2 text-[10px] font-mono text-cyan-300/90">
            <span className="glass-pill-dark px-2.5 py-0.5 rounded-full border border-white/10">PDF (Recommended)</span>
            <span className="glass-pill-dark px-2.5 py-0.5 rounded-full border border-white/10">DOCX</span>
          </div>
        </div>

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
            {errorMessage}
          </div>
        )}

        {/* Parsed File Status Card */}
        {extractedFileName && (
          <div className="glass-pill-dark rounded-2xl p-4 flex items-center justify-between border border-white/15 animate-in fade-in duration-300">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-300 text-sm">
                ✓
              </div>
              <div>
                <span className="text-xs font-bold text-white block leading-tight">{extractedFileName}</span>
                <span className="text-[11px] text-emerald-400 font-medium">100% Parsed & Ready</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-medium">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-cyan-400 hover:text-cyan-300 transition-colors cursor-pointer"
              >
                Replace
              </button>
              <span className="text-white/20">|</span>
              <button
                type="button"
                onClick={onRemoveFile}
                className="text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
              >
                Remove
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-white/50">
        <span>Processing Mode: <strong className="text-white">In-Memory (PII Private)</strong></span>
        <span className="text-cyan-300 font-medium">Dual Vector Ready</span>
      </div>
    </div>
  );
};
