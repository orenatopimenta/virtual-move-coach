
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, Video } from 'lucide-react';

interface ExerciseModelUploaderProps {
  exerciseId: string;
  onUploadComplete: () => void;
}

const ExerciseModelUploader: React.FC<ExerciseModelUploaderProps> = ({ 
  exerciseId, 
  onUploadComplete 
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type.startsWith('video/')) {
      setFile(selectedFile);
      const objectUrl = URL.createObjectURL(selectedFile);
      setPreview(objectUrl);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type.startsWith('video/')) {
        setFile(droppedFile);
        const objectUrl = URL.createObjectURL(droppedFile);
        setPreview(objectUrl);
      }
    }
  };

  const simulateUpload = () => {
    setUploading(true);
    setProgress(0);
    
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 5;
        if (newProgress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setUploading(false);
            onUploadComplete();
          }, 500);
          return 100;
        }
        return newProgress;
      });
    }, 100);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload de Vídeo</CardTitle>
        <CardDescription>
          Faça o upload de um vídeo do exercício executado por um profissional
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept="video/*"
          className="hidden"
        />
        
        {!preview ? (
          <div 
            className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="flex flex-col items-center justify-center space-y-2">
              <Upload className="h-12 w-12 text-gray-400" />
              <h3 className="text-lg font-medium">Arraste e solte seu vídeo aqui</h3>
              <p className="text-sm text-gray-500">Ou clique para selecionar um arquivo</p>
              <p className="text-xs text-gray-400 mt-2">Formatos aceitos: MP4, MOV, WEBM (máx. 100MB)</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg overflow-hidden bg-black">
              <video 
                src={preview} 
                controls 
                className="w-full h-auto max-h-96 object-contain"
              />
            </div>
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500 truncate flex-1 mr-2">
                {file?.name}
              </p>
              <Button variant="outline" size="sm" onClick={() => {
                setFile(null);
                setPreview(null);
              }}>
                Trocar
              </Button>
            </div>
          </div>
        )}

        {uploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Processando...</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} />
          </div>
        )}

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" disabled={uploading}>
            Cancelar
          </Button>
          <Button 
            onClick={simulateUpload} 
            disabled={!file || uploading}
            className="flex items-center"
          >
            <Video className="mr-2 h-4 w-4" />
            {uploading ? "Processando..." : "Processar Vídeo"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ExerciseModelUploader;
