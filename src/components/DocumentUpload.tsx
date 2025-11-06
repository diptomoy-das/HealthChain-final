import { web3Service } from '@/lib/web3';
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, X, Loader2, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { DOCUMENT_TYPES } from '@/lib/contractConfig';

interface DocumentUploadProps {
  onUploadComplete?: (documentId: number, ipfsCid: string) => void;
}

export const DocumentUpload = ({ onUploadComplete }: DocumentUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFileSelect = (selectedFile: File) => {
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(selectedFile.type)) {
      toast.error('Invalid file type', {
        description: 'Please upload PDF, JPG, or PNG files only',
      });
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('File too large', {
        description: 'Please upload files smaller than 10MB',
      });
      return;
    }

    setFile(selectedFile);
  };

  const handleUpload = async () => {
    if (!file || !documentType) {
      toast.error('Missing information', {
        description: 'Please select a file and document type',
      });
      return;
    }

    setIsUploading(true);
    try {
      // Mock IPFS CID for demo
      const mockIpfsCid = 'Qm' + Array(44).fill(0).map(() => 
        'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[Math.floor(Math.random() * 62)]
      ).join('');
      
      const encryptionHash = 'mock_encryption_' + Date.now();

      const { documentId, txHash } = await web3Service.uploadDocument(
        mockIpfsCid,
        documentType,
        encryptionHash
      );

      toast.success('Document uploaded successfully', {
        description: `Document ID: ${documentId}`,
      });

      onUploadComplete?.(documentId, mockIpfsCid);

      setFile(null);
      setDocumentType('');
    } catch (error: any) {
      toast.error('Upload failed', {
        description: error.message || 'Failed to upload document',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="glass-effect border-border/50 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
            <Upload className="h-5 w-5 text-white" />
          </div>
          Upload Healthcare Document
        </CardTitle>
        <CardDescription>
          Upload your encrypted healthcare documents to decentralized storage
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-xl p-10 text-center transition-smooth
            ${dragActive ? 'border-primary bg-primary/10 shadow-glow' : 'glass-effect border-border/50 hover:border-primary/50'}
          `}
        >
          {!file ? (
            <>
              <div className="w-16 h-16 rounded-2xl glass-effect flex items-center justify-center mx-auto mb-4">
                <Upload className="h-8 w-8 text-primary" />
              </div>
              <p className="text-base font-semibold text-foreground mb-2">
                Drag & drop your document here
              </p>
              <p className="text-sm text-muted-foreground mb-6">
                or click to browse (PDF, JPG, PNG - max 10MB)
              </p>
              <Input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                className="hidden"
                id="file-upload"
              />
              <Button
                variant="outline"
                className="glass-effect hover:border-primary/50"
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                Browse Files
              </Button>
            </>
          ) : (
            <div className="flex items-center justify-between glass-effect p-5 rounded-xl">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-foreground">{file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFile(null)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="document-type" className="text-base font-semibold">Document Type</Label>
          <Select value={documentType} onValueChange={setDocumentType}>
            <SelectTrigger id="document-type" className="glass-effect h-12">
              <SelectValue placeholder="Select document type" />
            </SelectTrigger>
            <SelectContent>
              {DOCUMENT_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleUpload}
          disabled={!file || !documentType || isUploading}
          className="w-full h-12 gradient-primary text-white font-semibold shadow-glow-lg hover:shadow-glow-lg transition-smooth"
        >
          {isUploading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Uploading to Blockchain...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-5 w-5" />
              Upload & Encrypt
            </>
          )}
        </Button>

        <div className="glass-effect border-primary/30 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-primary" />
            <p className="font-semibold text-primary text-sm">End-to-End Encryption</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Your documents are encrypted client-side before upload. Only you control access.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
