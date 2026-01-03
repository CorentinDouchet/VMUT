import { useState } from 'react';

/**
 * Composant d'upload de fichiers pour les pièces jointes (STB_REQ_0300)
 * Formats acceptés: PDF, TXT, PNG, JPG, DOCX, DOC
 */
function FileUpload({ onFileSelect, maxSizeMB = 10 }) {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');

  const ALLOWED_TYPES = [
    'application/pdf',
    'text/plain',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'
  ];

  const ALLOWED_EXTENSIONS = ['.pdf', '.txt', '.png', '.jpg', '.jpeg', '.docx', '.doc'];

  const validateFile = (file) => {
    setError('');

    // Vérifier la taille
    const maxBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxBytes) {
      setError(`Fichier trop volumineux (max ${maxSizeMB}MB)`);
      return false;
    }

    // Vérifier le type
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(`Type de fichier non autorisé. Formats acceptés: ${ALLOWED_EXTENSIONS.join(', ')}`);
      return false;
    }

    return true;
  };

  const handleFiles = (files) => {
    if (files.length === 0) return;

    const file = files[0]; // Un seul fichier à la fois
    if (validateFile(file)) {
      onFileSelect(file);
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files);
    }
  };

  return (
    <div className="w-full">
      <div 
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-slate-300 bg-white hover:border-slate-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          onChange={handleChange}
          accept={ALLOWED_EXTENSIONS.join(',')}
        />
        
        <label htmlFor="file-upload" className="cursor-pointer">
          <div className="flex flex-col items-center gap-2">
            <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <div className="text-sm text-slate-600">
              <span className="text-blue-600 font-semibold hover:underline">
                Cliquez pour sélectionner
              </span>
              {' '}ou glissez-déposez un fichier
            </div>
            <div className="text-xs text-slate-500">
              {ALLOWED_EXTENSIONS.join(', ').toUpperCase()} (max {maxSizeMB}MB)
            </div>
          </div>
        </label>
      </div>

      {error && (
        <div className="mt-2 text-sm text-red-600 flex items-center gap-2">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          {error}
        </div>
      )}
    </div>
  );
}

export default FileUpload;
