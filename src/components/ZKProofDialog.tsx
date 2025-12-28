import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { Progress } from "@/components/ui/progress";
import { AVAILABLE_CLAIMS, zkService, ClaimType, ZKProof } from "@/lib/zkService";
import { Copy, Shield, CheckCircle2, Lock, FileText, CheckSquare, Square } from 'lucide-react';
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";

interface ZKProofDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    documentId: number | null;
    ownerAddress?: string;
    onProofGenerated: (proof: ZKProof) => void;
}

export const ZKProofDialog: React.FC<ZKProofDialogProps> = ({
    open,
    onOpenChange,
    documentId,
    ownerAddress,
    onProofGenerated,
}) => {
    const [selectedClaims, setSelectedClaims] = useState<ClaimType[]>(['age_above_18']);
    const [isProving, setIsProving] = useState(false);
    const [progress, setProgress] = useState(0);
    const [generatedProofs, setGeneratedProofs] = useState<ZKProof[]>([]);
    const [matrixText, setMatrixText] = useState("");

    // Matrix animation effect
    useEffect(() => {
        if (isProving) {
            const chars = "XYZ01010101010101ABCDEFΩμ∑π";
            const interval = setInterval(() => {
                let str = "";
                for (let i = 0; i < 40; i++) {
                    str += chars.charAt(Math.floor(Math.random() * chars.length));
                }
                setMatrixText(str);
            }, 50);
            return () => clearInterval(interval);
        }
    }, [isProving]);

    const toggleClaim = (type: ClaimType) => {
        setSelectedClaims(prev =>
            prev.includes(type)
                ? prev.filter(t => t !== type)
                : [...prev, type]
        );
    };

    const handleGenerate = async () => {
        if (!documentId || selectedClaims.length === 0) return;

        setIsProving(true);
        setGeneratedProofs([]);
        setProgress(0);

        // Simulate progress for the batch
        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 90) return 90;
                return prev + 2;
            });
        }, 100);

        try {
            if (!ownerAddress) throw new Error("Owner address required");

            const results: ZKProof[] = [];
            for (const claim of selectedClaims) {
                // Generate sequentially for effect
                const result = await zkService.generateProof(documentId, ownerAddress, claim);
                results.push(result);
                // Fire callback immediately for each
                onProofGenerated(result);
            }

            clearInterval(progressInterval);
            setProgress(100);

            // Artificial delay for 100% completion
            setTimeout(() => {
                setGeneratedProofs(results);
                setIsProving(false);
                toast.success(`Successfully generated ${results.length} Zero-Knowledge Proofs`);
            }, 500);
        } catch (error) {
            console.error(error);
            setIsProving(false);
            toast.error("Failed to generate proofs");
        }
    };

    const handleCopyProof = (proofString: string) => {
        navigator.clipboard.writeText(proofString);
        toast.success("Proof copied to clipboard");
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md bg-zinc-950 border-2 border-emerald-500/20 text-white shadow-[0_0_50px_-10px_rgba(16,185,129,0.2)]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold text-white">
                        <Shield className="h-6 w-6 text-emerald-400" />
                        Zero-Knowledge Proof
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Prove a fact about this document without revealing the underlying data.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {!isProving && generatedProofs.length === 0 ? (
                        <>
                            {/* Claim Selection */}
                            <div className="space-y-4">
                                <label className="text-sm font-medium text-emerald-400/80 uppercase tracking-wider block">
                                    Select Claims to Prove ({selectedClaims.length})
                                </label>
                                <div className="grid gap-3">
                                    {AVAILABLE_CLAIMS.map((claim) => {
                                        const isSelected = selectedClaims.includes(claim.type);
                                        return (
                                            <div
                                                key={claim.type}
                                                className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${isSelected
                                                    ? 'bg-emerald-500/10 border-emerald-500/50'
                                                    : 'bg-zinc-900/50 border-white/5 hover:border-white/10'
                                                    }`}
                                                onClick={() => toggleClaim(claim.type)}
                                            >
                                                <Checkbox
                                                    checked={isSelected}
                                                    onCheckedChange={() => toggleClaim(claim.type)}
                                                    className="mt-1 border-white/20 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                                                />
                                                <div>
                                                    <p className={`text-sm font-bold ${isSelected ? 'text-white' : 'text-zinc-400'}`}>
                                                        {claim.label}
                                                    </p>
                                                    <p className="text-xs text-zinc-500 mt-0.5">
                                                        {claim.description}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Proving Animation */}
                            {isProving && (
                                <div className="space-y-4 rounded-xl bg-black/40 p-4 border border-emerald-500/30 font-mono relative overflow-hidden">
                                    <div className="flex justify-between text-xs text-emerald-400 mb-2">
                                        <span>
                                            {progress < 30 ? "READING PRIVATE DOC..." :
                                                progress < 60 ? "CHECKING CONSTRAINTS (AGE > 18)..." :
                                                    "GENERATING ZK-SNARK..."}
                                        </span>
                                        <span>{progress}%</span>
                                    </div>
                                    <Progress value={progress} className="h-2 bg-emerald-950" />

                                    <div className="h-24 mt-4 overflow-hidden text-xs text-emerald-600/50 break-all leading-tight select-none opacity-50 blur-[0.5px]">
                                        {matrixText}<br />
                                        {matrixText.split('').reverse().join('')}<br />
                                        {matrixText}<br />
                                        {matrixText.split('').reverse().join('')}
                                    </div>

                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
                                </div>
                            )}

                            <Button
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold tracking-wide transition-all shadow-lg hover:shadow-emerald-500/20"
                                onClick={handleGenerate}
                                disabled={isProving || selectedClaims.length === 0}
                            >
                                {isProving ? (
                                    <span className="flex items-center gap-2 animate-pulse">
                                        <Lock className="h-4 w-4" /> BATCH COMPUTING...
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-2">
                                        Generate {selectedClaims.length} Proofs
                                        <Lock className="h-4 w-4" />
                                    </span>
                                )}
                            </Button>
                        </>
                    ) : generatedProofs.length > 0 ? (
                        <div className="space-y-6 animate-in fade-in zoom-in duration-300">
                            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-6 flex flex-col items-center text-center">
                                <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4 ring-1 ring-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                                    <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                                </div>
                                <h3 className="text-lg font-bold text-white mb-1">Batch Generation Complete!</h3>
                                <p className="text-sm text-emerald-200/60">
                                    Successfully generated <span className="text-emerald-300 font-bold">{generatedProofs.length}</span> Zero-Knowledge Proofs.
                                </p>
                            </div>

                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                                {generatedProofs.map((p, i) => (
                                    <div key={i} className="bg-black/20 border border-emerald-500/20 rounded-lg p-3">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-xs font-bold text-emerald-400 uppercase">
                                                {AVAILABLE_CLAIMS.find(c => c.type === p.claimType)?.label}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-zinc-400 hover:text-white"
                                                onClick={() => handleCopyProof(p.proofString)}
                                            >
                                                <Copy className="h-3 w-3" />
                                            </Button>
                                        </div>
                                        <code className="block bg-black/40 rounded p-2 text-[10px] text-zinc-500 font-mono break-all truncate">
                                            {p.proofString}
                                        </code>
                                    </div>
                                ))}
                            </div>

                            <Button className="w-full bg-white/10 hover:bg-white/20 text-white" onClick={() => onOpenChange(false)}>
                                Done
                            </Button>
                        </div>
                    ) : null}
                </div>
            </DialogContent>
        </Dialog>
    );
};
