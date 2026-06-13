import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { Upload as UploadIcon, Shield, FileImage, X, ChevronRight, AlertCircle } from 'lucide-react';
import clsx from 'clsx';
import { verifyImage } from '../api';

const MODALITIES = [
  { value: 'xray', label: 'X-Ray' },
  { value: 'mri', label: 'MRI' },
  { value: 'ct', label: 'CT Scan' },
  { value: 'ultrasound', label: 'Ultrasound' },
  { value: 'other', label: 'Other' },
];

export default function Upload() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [modality, setModality] = useState('xray');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const onDrop = useCallback((accepted, rejected) => {
    if (rejected.length > 0) {
      setError('File must be PNG, JPEG, or DICOM and under 20MB.');
      return;
    }
    if (accepted.length > 0) {
      const f = accepted[0];
      setFile(f);
      setError(null);
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(f);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/jpeg': [], 'image/png': [], 'image/dcm': [], 'application/octet-stream': ['.dcm'] },
    maxSize: 20 * 1024 * 1024,
    multiple: false,
  });

  const handleVerify = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const result = await verifyImage(file, modality);
      navigate(`/verifying/${result.audit_id}`, { state: { result } });
    } catch (e) {
      setError('Verification failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="motion-page"
    >
      {/* Hero background */}
      <div
        className="min-h-[calc(100vh-64px)] flex flex-col items-center justify-center px-6 py-16 relative overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #F8FAFC 0%, #EEF4FB 50%, #F8FAFC 100%)',
        }}
      >
        {/* Background grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle, #0F2A47 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* Background blobs */}
        <div className="absolute top-20 right-20 w-96 h-96 rounded-full opacity-5" style={{ background: 'radial-gradient(circle, #2E5C8A, transparent)' }} />
        <div className="absolute bottom-20 left-10 w-64 h-64 rounded-full opacity-5" style={{ background: 'radial-gradient(circle, #0F2A47, transparent)' }} />

        <div className="w-full max-w-2xl relative z-10">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-aegis-navy/8 border border-aegis-navy/15 text-aegis-navy text-xs font-semibold uppercase tracking-wider mb-5">
              <Shield className="w-3.5 h-3.5" />
              Medical Image Verification
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold text-aegis-navy tracking-tight mb-3">
              Verify Your Image
            </h1>
            <p className="text-slate-500 text-lg max-w-md mx-auto leading-relaxed">
              Upload a medical scan and our 5-agent AI pipeline will detect manipulation within seconds.
            </p>
          </motion.div>

          {/* Upload Card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="glass-card p-8"
          >
            {/* Drop zone */}
            {!file ? (
              <div
                {...getRootProps()}
                data-testid="upload-dropzone"
                className={clsx(
                  'relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300',
                  isDragActive
                    ? 'border-aegis-blue bg-blue-50/60 scale-[1.01]'
                    : 'border-aegis-border hover:border-aegis-blue/50 hover:bg-blue-50/20'
                )}
              >
                <input {...getInputProps()} />
                <div className={clsx(
                  'w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all duration-300',
                  isDragActive ? 'bg-aegis-blue text-white' : 'bg-aegis-navy/8 text-aegis-navy'
                )}>
                  <UploadIcon className="w-8 h-8" />
                </div>
                {isDragActive ? (
                  <p className="text-aegis-blue font-semibold text-lg">Drop it here</p>
                ) : (
                  <>
                    <p className="text-aegis-navy font-semibold text-lg mb-1">
                      Drag & drop your medical scan
                    </p>
                    <p className="text-slate-400 text-sm mb-4">
                      or <span className="text-aegis-blue font-medium underline underline-offset-2">browse files</span>
                    </p>
                    <p className="text-slate-400 text-xs">
                      Supports PNG, JPEG, DICOM · Max 20MB
                    </p>
                  </>
                )}
              </div>
            ) : (
              /* File preview */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative rounded-2xl overflow-hidden border border-aegis-border"
                data-testid="file-preview"
              >
                {preview && (
                  <img
                    src={preview}
                    alt="Medical scan preview"
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white">
                    <FileImage className="w-4 h-4" />
                    <span className="text-sm font-medium truncate max-w-[200px]">{file.name}</span>
                    <span className="text-xs text-white/60">
                      {(file.size / 1024 / 1024).toFixed(1)}MB
                    </span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); setFile(null); setPreview(null); }}
                    className="w-7 h-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                    data-testid="remove-file-btn"
                  >
                    <X className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* Modality selector */}
            <div className="mt-6">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 block">
                Imaging Modality
              </label>
              <div className="flex flex-wrap gap-2" data-testid="modality-selector">
                {MODALITIES.map((m) => (
                  <button
                    key={m.value}
                    onClick={() => setModality(m.value)}
                    data-testid={`modality-${m.value}`}
                    className={clsx(
                      'px-4 py-2 rounded-xl text-sm font-medium border transition-all duration-200',
                      modality === m.value
                        ? 'bg-aegis-navy text-white border-aegis-navy shadow-md'
                        : 'bg-white text-slate-600 border-aegis-border hover:border-aegis-blue/40 hover:text-aegis-blue'
                    )}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm"
                data-testid="upload-error"
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </motion.div>
            )}

            {/* Verify button */}
            <button
              onClick={handleVerify}
              disabled={!file || loading}
              data-testid="verify-submit-btn"
              className={clsx(
                'w-full mt-6 py-4 rounded-2xl font-semibold text-base flex items-center justify-center gap-3',
                'transition-all duration-300',
                file && !loading
                  ? 'btn-primary cursor-pointer hover:shadow-lg'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
              )}
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  Verify Image
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </motion.div>

          {/* Trust indicators */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-8 flex items-center justify-center gap-8 text-xs text-slate-400"
          >
            {['SHA-256 Verified', '5-Agent Pipeline', 'HIPAA-Aligned Audit'].map((item) => (
              <div key={item} className="flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-aegis-blue/40" />
                {item}
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
