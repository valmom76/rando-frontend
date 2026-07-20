import React, { useCallback, useRef } from 'react';
import type { ChangeEvent } from 'react';
import type { DragEvent } from 'react';
import type { FileUploadProps } from './types';

const FileUpload: React.FC<FileUploadProps> = ({ onFileUpload }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = useCallback((file: File) => {
    if (!file.name.toLowerCase().endsWith('.txt')) {
      alert('Por favor, selecione um arquivo .txt');
      return;
    }
    
    if (file.size > 1024 * 1024) { // 1MB limite
      alert('Arquivo muito grande. Máximo: 1MB');
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        onFileUpload(file, content);
      } catch (error) {
        console.error('Erro ao ler arquivo:', error);
        alert('Erro ao processar o arquivo. Verifique o formato.');
      }
    };
    
    reader.onerror = () => {
      alert('Erro ao ler o arquivo. Tente novamente.');
    };
    
    reader.readAsText(file, 'UTF-8');
  }, [onFileUpload]);

  const handleFileSelect = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
      // Limpa o valor do input para permitir novo upload do mesmo arquivo
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [processFile]);

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  }, [processFile]);

  // Função para acionar o clique no input de arquivo
  const handleBrowseClick = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  return (
    <div 
      className="file-upload-compact"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Input de arquivo oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt"
        onChange={handleFileSelect}
        className="file-input-hidden"
      />
      
      <div className="upload-header">
        <span className="upload-icon">📤</span>
        <h3>Upload de Arquivo</h3>
      </div>
      
      <div className="upload-options">
        {/* Botão principal */}
        <button 
          onClick={handleBrowseClick}
          className="browse-btn-compact"
          type="button"
        >
          Escolher arquivo .txt
        </button>
        
        <div className="drag-hint">
          <span className="hint-text">ou arraste e solte aqui</span>
        </div>
      </div>
      
      <div className="upload-info">
        <div className="info-item">
          <span className="info-icon">📄</span>
          <span className="info-text">Formato: .txt</span>
        </div>
        <div className="info-item">
          <span className="info-icon">📏</span>
          <span className="info-text">Tamanho máximo: 1MB</span>
        </div>
        <div className="info-item">
          <span className="info-icon">👥</span>
          <span className="info-text">Jogadores por nível</span>
        </div>
      </div>
    </div>
  );
};

export default FileUpload;