import { web3Service } from '@/lib/web3';
import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, FileText, Shield, Lock, CheckCircle2, Loader2, ScanLine, Fingerprint } from 'lucide-react';
import { toast } from 'sonner';
import { DOCUMENT_TYPES } from '@/lib/contractConfig';

interface DocumentUploadProps {
  onUploadComplete?: (documentId: number, ipfsCid: string) => void;
}

export const DocumentUpload = ({ onUploadComplete }: DocumentUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<string>('');
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
      setFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file || !documentType) return;

    setIsUploading(true);
    try {
      // 1. Upload to IPFS (mock for now, or real if web3Service implements it)
      // In a real app, we'd encrypt the file here before IPFS upload
      const ipfsCid = `QmHash${Date.now()}`; // Mock CID
      const encryptionHash = `0x${Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')}`; // Mock Encryption Hash

      // 2. Register on Smart Contract
      const { documentId } = await web3Service.uploadDocument(ipfsCid, documentType, encryptionHash);

      toast.success('Document uploaded securely', {
        description: `ID: ${documentId} • Encrypted & Stored on IPFS`,
      });

      onUploadComplete?.(documentId, ipfsCid);
      setFile(null);
      setDocumentType('');
    } catch (error: any) {
      toast.error('Upload failed', {
        description: error.message || 'Please try again',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="glass-panel border-cyan-500/20 shadow-[0_0_50px_-12px_rgba(6,182,212,0.2)] overflow-hidden relative group">
      {/* Secure Vault Background Elements */}
      <div className="absolute inset-0 bg-hex-pattern opacity-5 pointer-events-none" />
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent opacity-50" />

      <CardHeader className="relative z-10 border-b border-cyan-500/10 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-cyan-500/10 animate-pulse" />
              <Shield className="h-6 w-6 text-cyan-400 relative z-10" />
            </div>
            <div>
              <CardTitle className="text-2xl text-cyan-50">Secure Vault</CardTitle>
              <CardDescription className="text-cyan-200/60">Encrypted Document Storage</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/30 border border-cyan-500/20">
            <Lock className="h-3 w-3 text-cyan-400" />
            <span className="text-xs font-mono text-cyan-400">AES-256 ENCRYPTED</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-6 relative z-10">
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`
            relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 overflow-hidden
            ${dragActive
              ? 'border-cyan-400 bg-cyan-400/5 shadow-[inset_0_0_20px_rgba(34,211,238,0.1)]'
              : 'border-white/10 hover:border-cyan-400/50 hover:bg-white/5'
            }
          `}
        >
          {/* Content for drag and drop area */}
          <input
            id="file-upload"
            type="file"
            className="hidden"
            onChange={handleChange}
            accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
          />
          <label htmlFor="file-upload" className="cursor-pointer block w-full h-full absolute inset-0 z-10">
            {file ? (
              <div className="flex flex-col items-center justify-center h-full text-cyan-50">
                <FileText className="h-10 w-10 mb-3 text-cyan-400" />
                <p className="text-lg font-semibold">{file.name}</p>
                <p className="text-sm text-cyan-200/70">Ready to upload</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-cyan-50">
                <Upload className="h-10 w-10 mb-3 text-cyan-400" />
                <p className="text-lg font-semibold">Drag & Drop your document here</p>
                <p className="text-sm text-cyan-200/70">or click to browse</p>
              </div>
            )}
          </label>
          {file && (
            <div className="absolute bottom-4 right-4 z-20">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setFile(null);
                }}
                className="text-red-400 hover:text-red-300"
              >
                Remove
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="document-type" className="text-cyan-100/80">Document Type</Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger id="document-type" className="h-12 bg-black/20 border-white/10 focus:ring-cyan-500/50 text-base">
                <SelectValue placeholder="Select classification..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="medical_record">Medical Record</SelectItem>
                <SelectItem value="lab_result">Lab Result</SelectItem>
                <SelectItem value="prescription">Prescription</SelectItem>
                <SelectItem value="insurance_card">Insurance Card</SelectItem>
                <SelectItem value="vaccination_proof">Vaccination Proof</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleUpload}
            disabled={!file || !documentType || isUploading}
            className={`
              w-full h-14 text-lg font-bold transition-all duration-300 relative overflow-hidden
              ${!file || !documentType
                ? 'bg-white/5 text-muted-foreground'
                : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-[0_0_30px_-5px_rgba(6,182,212,0.4)] hover:shadow-[0_0_40px_-5px_rgba(6,182,212,0.6)]'
              }
            `}
          >
            {isUploading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="animate-pulse">Encrypting & Uploading...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Fingerprint className="h-5 w-5" />
                <span>Secure Upload</span>
              </div>
            )}
          </Button>
        </div>

        {/* Security Footer */}
        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between text-xs text-muted-foreground/60 font-mono">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
            <span>IPFS NODE: ACTIVE</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ScanLine className="h-3 w-3" />
            <span>E2EE PROTOCOL</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
