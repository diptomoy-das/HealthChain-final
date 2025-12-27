import { web3Service } from '@/lib/web3';
import { useState, useEffect } from 'react';
import { WalletConnect } from '@/components/WalletConnect';
import { DocumentUpload } from '@/components/DocumentUpload';
import { FacilitySelector } from '@/components/FacilitySelector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Shield, FileText, Building2, History, Send, ExternalLink, Key, Blocks, Lock, CheckCircle2, Clock, Hash, FileCheck, Copy, Eye, Stethoscope } from 'lucide-react';
import { toast } from 'sonner';

const Index = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [hasEnteredApp, setHasEnteredApp] = useState(false);
  const [userAddress, setUserAddress] = useState<string>('');
  const [activeTab, setActiveTab] = useState('upload');
  const [uploadedDocuments, setUploadedDocuments] = useState<
    Array<{ id: number; ipfsCid: string; type: string; timestamp: number; verifiedBy: string; fileUrl?: string; owner: string }>
  >([]);
  const [selectedDocuments, setSelectedDocuments] = useState<number[]>([]);
  const [viewingDoc, setViewingDoc] = useState<{ id: number; ipfsCid: string; type: string; timestamp: number; verifiedBy: string; fileUrl?: string; owner: string } | null>(null);
  const [transactionHistory, setTransactionHistory] = useState<
    Array<{
      id: string;
      timestamp: number;
      documentIds: number[];
      facilityNames: string[];
      txHash: string;
    }>
  >([]);

  const handleWalletConnect = (address: string) => {
    setIsConnected(true);
    setUserAddress(address);
  };

  const handleWalletDisconnect = () => {
    setIsConnected(false);
    setHasEnteredApp(false);
    setUserAddress('');
    // setUploadedDocuments([]); // Keep documents to allow doctor verification flow
    setSelectedDocuments([]);
  };

  const handleEnterApp = () => {
    setHasEnteredApp(true);
  };

  const handleSwitchWallet = async () => {
    try {
      const address = await web3Service.connect(true);
      setUserAddress(address);
      setIsConnected(true);
      // We do NOT reset hasEnteredApp, so the user stays on the current tab (e.g., Verification)
      toast.success('Wallet Switched', {
        description: `Connected to ${address.substring(0, 6)}...${address.substring(address.length - 4)}`
      });
    } catch (error) {
      console.warn('Wallet switch cancelled or failed', error);
      // If user cancels, we stay as we were, or disconnected if the provider state was cleared.
    }
  };

  const handleDocumentUpload = (documentId: number, ipfsCid: string, fileUrl?: string) => {
    setUploadedDocuments((prev) => [
      ...prev,
      {
        id: documentId,
        ipfsCid,
        type: 'insurance_card',
        timestamp: Date.now(),
        verifiedBy: '0x0000000000000000000000000000000000000000',
        fileUrl,
        owner: userAddress,
      },
    ]);
  };

  const handleAccessGranted = (data: {
    documentIds: number[];
    facilityNames: string[];
    txHash: string;
  }) => {
    const transaction = {
      id: `tx-${Date.now()}`,
      timestamp: Date.now(),
      documentIds: data.documentIds,
      facilityNames: data.facilityNames,
      txHash: data.txHash,
    };
    setTransactionHistory((prev) => [transaction, ...prev]);
  };

  const toggleDocumentSelection = (documentId: number) => {
    const doc = uploadedDocuments.find((d) => d.id === documentId);
    if (!doc) return;

    // Check if document is verified
    const isVerified = doc.verifiedBy && doc.verifiedBy !== '0x0000000000000000000000000000000000000000';

    if (doc.owner !== userAddress) {
      toast.error('Permission Denied', {
        description: 'You can only share documents you own.',
      });
      return;
    }

    if (!isVerified) {
      toast.error('Cannot Share Unverified Document', {
        description: 'Only verified documents can be shared with facilities.',
      });
      return;
    }

    setSelectedDocuments((prev) =>
      prev.includes(documentId)
        ? prev.filter((id) => id !== documentId)
        : [...prev, documentId]
    );
  };

  const handleVerifyDocument = async (documentId: number): Promise<boolean> => {
    try {
      const txHash = await web3Service.verifyDocument(documentId);
      toast.success('Document Verified', {
        description: `Document #${documentId} has been verified on-chain.`,
      });

      // Update local state to reflect verification
      setUploadedDocuments(prev => prev.map(doc =>
        doc.id === documentId
          ? { ...doc, verifiedBy: userAddress }
          : doc
      ));
      return true;
    } catch (error) {
      console.warn('Verification failed on-chain, falling back to local demo mode:', error);
      toast.success('Document Verified (Demo Mode)', {
        description: `Note: Contract verification failed, but document is marked verified locally.`,
      });

      // Fallback: Update local state to reflect verification
      setUploadedDocuments(prev => prev.map(doc =>
        doc.id === documentId
          ? { ...doc, verifiedBy: userAddress }
          : doc
      ));
      return true;
    }
  };

  const handleVerifyRequest = async (doc: typeof uploadedDocuments[0]) => {
    if (doc.owner === userAddress) {
      toast.error('Verification Restricted', {
        description: 'You cannot verify your own document. Please connect a different wallet (e.g., Doctor).',
      });
      // Optional: Auto-disconnect to prompt switch
      handleWalletDisconnect();
      return;
    }

    if (!isConnected) {
      toast.error('Wallet Not Connected', { description: 'Please connect a doctor wallet to verify.' });
      return;
    }

    const success = await handleVerifyDocument(doc.id);
    if (success) {
      setViewingDoc(null); // Close dialog after verification
    }
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    toast.success('Transaction Hash Copied', {
      description: 'The transaction hash has been copied to your clipboard.',
    });
  };

  const handleViewDocument = (ipfsCid: string) => {
    const doc = uploadedDocuments.find(d => d.ipfsCid === ipfsCid);
    if (doc) {
      setViewingDoc(doc);
    }
  };

  // Dynamic background based on active tab
  const getBackgroundClass = () => {
    switch (activeTab) {
      case 'upload':
        return 'bg-gradient-to-br from-cyan-950/30 via-background to-background';
      case 'share':
        return 'bg-gradient-to-br from-purple-950/30 via-background to-background';
      case 'history':
        return 'bg-gradient-to-br from-emerald-950/30 via-background to-background';
      default:
        return 'bg-background';
    }
  };

  return (
    <div className={`min-h-screen flex flex-col transition-colors duration-700 ${isConnected && hasEnteredApp ? getBackgroundClass() : ''}`}>
      <header className="glass-panel sticky top-0 z-50 border-b-0">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center shadow-glow animate-pulse-glow">
                <Shield className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-primary/80">
                  HealthChain
                </h1>
                <p className="text-xs text-muted-foreground font-medium tracking-wide">
                  Decentralized Healthcare Records
                </p>
              </div>
            </div>
            <WalletConnect onConnect={handleWalletConnect} onDisconnect={handleWalletDisconnect} />
          </div>
        </div>
      </header>

      {(!isConnected || !hasEnteredApp) && (
        <section className="flex-1 flex flex-col justify-center py-20 px-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-hero opacity-20 blur-[100px] animate-pulse-glow"></div>
          <div className="container mx-auto max-w-6xl text-center relative z-10">
            <div className="mb-16 animate-fade-in">
              <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-6 py-2 rounded-full text-sm font-medium mb-8 backdrop-blur-md shadow-lg hover:bg-white/10 transition-colors">
                <Blocks className="h-4 w-4 text-primary" />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                  Powered by Celo Blockchain
                </span>
              </div>
              <h2 className="text-6xl md:text-8xl font-bold mb-8 leading-tight tracking-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/50">
                  Your Healthcare
                </span>
                <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent">
                  Securely on Chain
                </span>
              </h2>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-12 leading-relaxed font-light">
                Upload once, share with multiple medical facilities in a single transaction.
                <br />
                <span className="text-foreground font-medium">End-to-End Encrypted. Decentralized. Patient-Controlled.</span>
              </p>

              <div className="flex justify-center scale-110 transform transition-transform duration-500 hover:scale-115">
                {!isConnected ? (
                  <WalletConnect onConnect={handleWalletConnect} onDisconnect={handleWalletDisconnect} />
                ) : (
                  <Button
                    onClick={handleEnterApp}
                    className="relative group overflow-hidden rounded-full px-10 py-7 transition-all duration-300 hover:shadow-glow-lg"
                  >
                    <div className="absolute inset-0 gradient-primary opacity-90 group-hover:opacity-100 transition-opacity" />
                    <div className="relative flex items-center gap-3 text-white font-bold text-xl">
                      Launch App
                      <Send className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Button>
                )}
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-8 animate-slide-up delay-200">
              {[
                {
                  icon: Key,
                  title: "You Own Your Data",
                  desc: "Complete control over who accesses your healthcare documents with smart contract permissions."
                },
                {
                  icon: Shield,
                  title: "End-to-End Encrypted",
                  desc: "Client-side encryption ensures maximum privacy. Only you hold the decryption keys."
                },
                {
                  icon: Blocks,
                  title: "Blockchain Verified",
                  desc: "Immutable audit trail on Celo blockchain ensures authenticity and prevents tampering."
                }
              ].map((item, index) => (
                <Card key={index} className="glass-card border-0 group overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  <CardHeader className="relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300 border border-white/10 group-hover:border-primary/30">
                      <item.icon className="h-8 w-8 text-primary group-hover:text-white transition-colors duration-300" />
                    </div>
                    <CardTitle className="text-xl font-bold">{item.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="relative z-10">
                    <CardDescription className="text-base leading-relaxed text-muted-foreground/80">
                      {item.desc}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {isConnected && hasEnteredApp && (
        <div className="container mx-auto px-4 py-12 flex-1 animate-fade-in">
          <Tabs defaultValue="upload" className="space-y-8" onValueChange={setActiveTab}>
            <TabsList className="glass-panel p-2 h-auto rounded-2xl flex justify-center gap-2 max-w-2xl mx-auto">
              {[
                { value: "upload", icon: FileText, label: "Upload Documents" },
                { value: "share", icon: Building2, label: "Share with Facilities" },
                { value: "history", icon: History, label: "History & Access" },
                { value: "verification", icon: Stethoscope, label: "Verification Portal" }
              ].map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className={`
                    flex-1 gap-2 py-3 rounded-xl transition-all duration-300
                    data-[state=active]:shadow-glow
                    ${tab.value === 'upload' ? 'data-[state=active]:bg-cyan-600' : ''}
                    ${tab.value === 'share' ? 'data-[state=active]:bg-purple-600' : ''}
                    ${tab.value === 'history' ? 'data-[state=active]:bg-emerald-600' : ''}
                    ${tab.value === 'verification' ? 'data-[state=active]:bg-blue-600' : ''}
                    data-[state=active]:text-white
                  `}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="upload" className="space-y-8 animate-slide-up">
              <div className="grid lg:grid-cols-2 gap-8">
                <DocumentUpload onUploadComplete={handleDocumentUpload} />

                <Card className="glass-panel border-cyan-500/20 overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-2xl flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-cyan-400" />
                      </div>
                      Your Documents
                    </CardTitle>
                    <CardDescription className="ml-13">Manage your uploaded healthcare records</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    {uploadedDocuments.length === 0 ? (
                      <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/5 border-dashed">
                        <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                          <FileText className="h-10 w-10 text-muted-foreground/50" />
                        </div>
                        <p className="text-lg font-medium text-muted-foreground">No documents uploaded yet</p>
                        <p className="text-sm text-muted-foreground/60">Upload your first document to get started</p>
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {uploadedDocuments.map((doc) => (
                          <div
                            key={doc.id}
                            className={`
                              flex items-center justify-between p-4 rounded-xl border transition-all duration-300 cursor-pointer group
                              ${selectedDocuments.includes(doc.id)
                                ? 'border-cyan-500 bg-cyan-500/10 shadow-glow'
                                : 'bg-white/5 border-white/10 hover:border-cyan-500/50 hover:bg-white/10'
                              }
                            `}
                            onClick={() => toggleDocumentSelection(doc.id)}
                          >
                            <div className="flex items-center gap-4">
                              <div className={`
                                w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300
                                ${selectedDocuments.includes(doc.id) ? 'bg-cyan-500 shadow-glow text-white' : 'bg-white/10 group-hover:bg-white/20 text-cyan-400'}
                              `}>
                                <FileText className="h-6 w-6" />
                              </div>
                              <div>
                                <p className="text-base font-semibold text-foreground">Document #{doc.id}</p>
                                <p className="text-xs text-muted-foreground font-mono bg-black/20 px-2 py-0.5 rounded mt-1 inline-block">
                                  {doc.ipfsCid.substring(0, 20)}...
                                </p>
                                {doc.verifiedBy && doc.verifiedBy !== '0x0000000000000000000000000000000000000000' && (
                                  <div className="flex items-center gap-1 mt-1 text-emerald-400 text-xs font-medium">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Verified
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-white hover:bg-white/10"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleViewDocument(doc.ipfsCid);
                                }}
                                title="View Document"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              {/* Verify button removed from here, moved to View Dialog */}
                              {selectedDocuments.includes(doc.id) && (
                                <div className="w-4 h-4 rounded-full bg-cyan-500 shadow-glow animate-pulse" />
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="share" className="animate-slide-up">
              <FacilitySelector
                selectedDocuments={selectedDocuments}
                onAccessGranted={handleAccessGranted}
              />
            </TabsContent>

            <TabsContent value="history" className="animate-slide-up">
              <Card className="glass-panel border-emerald-500/20 shadow-[0_0_50px_-12px_rgba(16,185,129,0.2)]">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                        <History className="h-6 w-6 text-emerald-400" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl text-emerald-50">Immutable Ledger</CardTitle>
                        <CardDescription className="text-emerald-200/60">Verified On-Chain Transaction History</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-950/30 border border-emerald-500/20">
                      <Blocks className="h-3 w-3 text-emerald-400" />
                      <span className="text-xs font-mono text-emerald-400">CELO MAINNET</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {transactionHistory.length === 0 ? (
                    <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/5 border-dashed">
                      <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                        <History className="h-10 w-10 text-muted-foreground/50" />
                      </div>
                      <p className="text-lg font-medium text-muted-foreground">No transactions yet</p>
                    </div>
                  ) : (
                    <div className="relative border-l-2 border-emerald-500/20 ml-6 space-y-8 py-4">
                      {transactionHistory.map((tx) => (
                        <div key={tx.id} className="relative pl-8 group">
                          {/* Timeline Dot */}
                          <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-emerald-950 border-2 border-emerald-500 group-hover:scale-125 transition-transform duration-300 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />

                          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all duration-300 shadow-lg">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center shadow-glow">
                                  <FileCheck className="h-6 w-6 text-emerald-400" />
                                </div>
                                <div>
                                  <p className="text-lg font-semibold text-foreground flex items-center gap-2">
                                    Access Granted
                                    <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">CONFIRMED</span>
                                  </p>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    {new Date(tx.timestamp).toLocaleString()}
                                  </div>
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-2 border-emerald-500/30 hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500"
                                onClick={() => window.open(`https://alfajores.celoscan.io/tx/${tx.txHash}`, '_blank')}
                              >
                                View on Explorer
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4 text-sm bg-black/20 p-4 rounded-xl border border-white/5">
                              <div className="flex flex-col gap-1">
                                <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold flex items-center gap-1">
                                  <FileText className="h-3 w-3" /> Documents
                                </span>
                                <span className="font-mono text-foreground bg-white/5 px-2 py-1 rounded border border-white/5">
                                  {tx.documentIds.map((id, i) => {
                                    const doc = uploadedDocuments.find(d => d.id === id);
                                    const isVerified = doc?.verifiedBy && doc.verifiedBy !== '0x0000000000000000000000000000000000000000';
                                    return (
                                      <span key={id} className="inline-flex items-center gap-1">
                                        #{id}
                                        {isVerified && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
                                        {i < tx.documentIds.length - 1 && ", "}
                                      </span>
                                    );
                                  })}
                                </span>
                              </div>
                              <div className="flex flex-col gap-1">
                                <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold flex items-center gap-1">
                                  <Building2 className="h-3 w-3" /> Facilities
                                </span>
                                <span className="text-foreground font-medium">
                                  {tx.facilityNames.join(', ')}
                                </span>
                              </div>
                              <div className="flex flex-col gap-1 md:col-span-2">
                                <span className="text-muted-foreground text-xs uppercase tracking-wider font-semibold flex items-center gap-1">
                                  <Hash className="h-3 w-3" /> Tx Hash
                                </span>
                                <div className="flex items-center gap-2">
                                  <span className="font-mono text-emerald-400/80 truncate bg-emerald-950/30 px-2 py-1 rounded border border-emerald-500/20 flex-1">
                                    {tx.txHash}
                                  </span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/20"
                                    onClick={() => handleCopyHash(tx.txHash)}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="verification" className="animate-slide-up">
              <Card className="glass-panel border-pink-500/20 shadow-[0_0_50px_-12px_rgba(236,72,153,0.3)] overflow-hidden relative">
                {/* Decorative background elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none" />

                <CardHeader className="relative z-10 border-b border-pink-500/10 pb-6 bg-gradient-to-r from-pink-950/30 to-transparent">
                  <div className="flex items-center gap-5">
                    <div className="relative">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 p-[1px] shadow-lg shadow-pink-500/20">
                        <div className="w-full h-full rounded-2xl bg-black/40 backdrop-blur-md flex items-center justify-center">
                          <Stethoscope className="h-7 w-7 text-pink-200" />
                        </div>
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 ring-4 ring-black/50 animate-pulse" />
                    </div>
                    <div>
                      <CardTitle className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-pink-100 via-pink-400 to-rose-400">
                        Medical Verification Portal
                      </CardTitle>
                      <CardDescription className="text-pink-200/60 font-medium mt-1">
                        Authorized Personnel Only • Secure Blockchain Verification
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="relative z-10 p-6 sm:p-8 space-y-8">
                  {!isConnected ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-8 min-h-[400px]">
                      <div className="relative group">
                        <div className="absolute inset-0 bg-pink-500/20 blur-2xl rounded-full group-hover:bg-pink-500/30 transition-all duration-500" />
                        <div className="relative p-8 bg-black/40 border border-pink-500/30 rounded-3xl backdrop-blur-xl shadow-2xl ring-1 ring-white/10 group-hover:scale-105 transition-transform duration-500">
                          <Shield className="h-16 w-16 text-pink-400 group-hover:text-pink-300 transition-colors" />
                        </div>
                      </div>
                      <div className="text-center space-y-3 max-w-md mx-auto">
                        <h3 className="text-2xl font-bold text-white tracking-tight">Doctor Authentication Required</h3>
                        <p className="text-pink-200/60 leading-relaxed">
                          Securely connect your authorized medical wallet to access patient records and perform on-chain verifications.
                        </p>
                      </div>
                      <div className="scale-110 shadow-xl shadow-pink-500/10 rounded-xl overflow-hidden ring-1 ring-white/10">
                        <WalletConnect onConnect={handleWalletConnect} onDisconnect={handleWalletDisconnect} />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                      {/* Status Bar */}
                      <div className="flex flex-col sm:flex-row justify-between items-center bg-gradient-to-r from-pink-900/40 via-pink-900/20 to-pink-900/10 border border-pink-500/20 p-1.5 rounded-2xl backdrop-blur-md shadow-lg">
                        <div className="flex items-center gap-4 px-4 py-2 w-full sm:w-auto">
                          <div className="flex items-center gap-3">
                            <span className="relative flex h-3 w-3">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 shadow-[0_0_10px_#22c55e]"></span>
                            </span>
                            <span className="text-sm font-semibold tracking-wide text-pink-100 uppercase">Doctor Mode Active</span>
                          </div>
                          <div className="h-4 w-px bg-white/10 mx-2 hidden sm:block" />
                          <div className="hidden sm:flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                            <div className="w-2 h-2 rounded-full bg-pink-400" />
                            <p className="text-xs font-mono text-pink-200/80">
                              {userAddress.substring(0, 10)}...{userAddress.substring(userAddress.length - 4)}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full sm:w-auto m-1 text-xs font-medium bg-pink-500/10 text-pink-300 hover:text-white hover:bg-pink-600 rounded-xl transition-all duration-300 border border-transparent hover:border-pink-400/30 hover:shadow-lg hover:shadow-pink-500/20"
                          onClick={handleSwitchWallet}
                        >
                          Switch Wallet
                        </Button>
                      </div>

                      {/* Documents List */}
                      <div className="space-y-5">
                        <div className="flex items-center justify-between px-2">
                          <div className="flex items-center gap-2">
                            <h3 className="text-sm uppercase tracking-wider text-pink-400/60 font-bold">Pending Verification Queue</h3>
                            <div className="h-px w-12 bg-pink-500/20" />
                          </div>
                          <span className="bg-pink-950/50 px-3 py-1 rounded-full text-xs font-bold text-pink-400 border border-pink-500/20 shadow-inner">
                            {uploadedDocuments.length} Records
                          </span>
                        </div>

                        {uploadedDocuments.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-20 border border-white/5 border-dashed rounded-3xl bg-white/5/50 backdrop-blur-sm">
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                              <FileCheck className="h-8 w-8 text-muted-foreground/50" />
                            </div>
                            <p className="text-lg font-medium text-muted-foreground">No documents found in registry</p>
                            <p className="text-sm text-muted-foreground/50 mt-1">New patient uploads will appear here instantly</p>
                          </div>
                        ) : (
                          <div className="grid gap-4">
                            {uploadedDocuments.map((doc) => (
                              <div
                                key={doc.id}
                                className="group relative overflow-hidden bg-gradient-to-br from-white/5 to-white/0 border border-white/10 hover:border-pink-500/30 rounded-2xl p-1 transition-all duration-500 hover:shadow-[0_0_30px_-5px_rgba(236,72,153,0.15)]"
                              >
                                {/* Hover Gradient Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-r from-pink-600/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                                <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between p-5 rounded-xl bg-black/20 group-hover:bg-transparent transition-colors duration-500 gap-4 sm:gap-0">
                                  <div className="flex items-center gap-5">
                                    <div className="relative shrink-0">
                                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-800 to-black border border-white/10 flex items-center justify-center group-hover:border-pink-500/30 transition-colors shadow-lg">
                                        <span className="text-xl font-bold text-muted-foreground/50 group-hover:text-pink-400 transition-colors">#{doc.id}</span>
                                      </div>
                                      {doc.verifiedBy && doc.verifiedBy !== '0x0000000000000000000000000000000000000000' && (
                                        <div className="absolute -top-2 -right-2 bg-emerald-500 text-white p-1 rounded-full shadow-lg shadow-emerald-500/30 ring-4 ring-black scale-0 group-hover:scale-100 transition-transform duration-300">
                                          <CheckCircle2 className="h-3 w-3" />
                                        </div>
                                      )}
                                    </div>

                                    <div className="space-y-1.5">
                                      <div className="flex items-center gap-3 flex-wrap">
                                        <h4 className="text-lg font-bold text-white group-hover:text-pink-100 transition-colors tracking-tight">
                                          Medical Record
                                        </h4>
                                        <span className="text-[10px] font-mono font-medium text-muted-foreground bg-white/5 px-2 py-1 rounded border border-white/10 group-hover:border-pink-500/20 transition-colors">
                                          {new Date(doc.timestamp).toLocaleDateString()}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        <span className="flex items-center gap-2 pl-1">
                                          <div className="w-1.5 h-1.5 rounded-full bg-pink-500" />
                                          <span className="opacity-70">Owner:</span>
                                          <span className="font-mono text-xs bg-white/5 px-1.5 py-0.5 rounded">{doc.owner.substring(0, 12)}...</span>
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        const d = uploadedDocuments.find(d => d.id === doc.id);
                                        if (d) setViewingDoc(d);
                                      }}
                                      className="flex-1 sm:flex-none text-muted-foreground hover:text-white hover:bg-white/5"
                                    >
                                      <Eye className="h-4 w-4 mr-2" />
                                      View
                                    </Button>

                                    {doc.verifiedBy && doc.verifiedBy !== '0x0000000000000000000000000000000000000000' ? (
                                      <div className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 font-bold text-sm shadow-[0_0_20px_-5px_rgba(16,185,129,0.2)]">
                                        <Shield className="h-4 w-4 fill-emerald-500/20" />
                                        <span>Verified</span>
                                      </div>
                                    ) : (doc.owner === userAddress ? (
                                      <div className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 bg-yellow-500/5 border border-yellow-500/10 rounded-xl text-yellow-500/60 font-medium text-xs">
                                        <Lock className="h-3 w-3" />
                                        <span>Self-Verify Restricted</span>
                                      </div>
                                    ) : (
                                      <Button
                                        onClick={() => {
                                          const d = uploadedDocuments.find(d => d.id === doc.id);
                                          if (d) handleVerifyRequest(d);
                                        }}
                                        className="flex-1 sm:flex-none bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white border-0 shadow-lg shadow-pink-600/20 text-sm font-bold h-10 px-6 rounded-xl hover:scale-105 active:scale-95 transition-all duration-300 relative overflow-hidden"
                                      >
                                        <span className="relative z-10 flex items-center gap-2">
                                          <CheckCircle2 className="h-4 w-4" />
                                          Verify Record
                                        </span>
                                        <div className="absolute inset-0 bg-white/20 translate-y-full hover:translate-y-0 transition-transform duration-300" />
                                      </Button>
                                    )
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      )}

      <footer className="glass-panel border-t-0 mt-auto py-12">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-primary">
              HealthChain
            </span>
          </div>
          <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
            Built on Celo Blockchain • IPFS Decentralized Storage • End-to-End Encrypted
          </p>
          <p className="text-xs text-muted-foreground/60">
            © {new Date().getFullYear()} HealthChain. Your data, your control.
          </p>
        </div>
      </footer>
      <Dialog open={!!viewingDoc} onOpenChange={(open) => !open && setViewingDoc(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto glass-panel border-cyan-500/30">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <FileText className="h-6 w-6 text-cyan-400" />
              Document Viewer
            </DialogTitle>
            <DialogDescription>
              Reviewing Document #{viewingDoc?.id}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 bg-white/5 rounded-xl p-6 border border-white/10 min-h-[400px]">
            {/* Simple visual representation for the demo - in real app would be an iframe or PDF viewer */}
            <div className="space-y-6">
              <div className="flex justify-between items-start border-b border-white/10 pb-6">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">Medical Record</h3>
                  <p className="text-muted-foreground text-sm">Official HealthChain Document</p>
                </div>
                <div className="bg-cyan-500/10 text-cyan-400 px-3 py-1 rounded-full text-xs font-mono border border-cyan-500/30">
                  IPFS: {viewingDoc?.ipfsCid}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Patient</label>
                  <p className="text-lg text-white">John Doe</p>
                </div>
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Date</label>
                  <p className="text-lg text-white">{new Date(viewingDoc?.timestamp || Date.now()).toLocaleDateString()}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Medical Summary</label>
                  <p className="text-white/90 leading-relaxed mt-1">
                    Patient exhibits normal vital signs. Blood pressure 120/80. Heart rate 72 bpm.
                    No significant abnormalities detected in routine checkup.
                    Recommended to continue regular exercise and balanced diet.
                  </p>
                </div>
              </div>

              {viewingDoc?.fileUrl && (
                <div className="mt-4">
                  <img src={viewingDoc.fileUrl} alt="Document Preview" className="max-w-full rounded-lg border border-white/10" />
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="flex justify-between items-center sm:justify-between gap-4 mt-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Shield className="h-4 w-4" />
              <span>Uploaded by: {viewingDoc?.owner?.substring(0, 10)}...</span>
            </div>

            <div className="flex gap-2 items-center">
              <Button variant="outline" onClick={() => setViewingDoc(null)}>
                Close
              </Button>

              {!isConnected ? (
                <div className="scale-75 origin-right">
                  <WalletConnect onConnect={handleWalletConnect} onDisconnect={handleWalletDisconnect} />
                </div>
              ) : viewingDoc && (!viewingDoc.verifiedBy || viewingDoc.verifiedBy === '0x0000000000000000000000000000000000000000') ? (
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                  onClick={() => handleVerifyRequest(viewingDoc)}
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Verify Document
                </Button>
              ) : (
                <Button disabled className="bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 opacity-100">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Verified by {viewingDoc?.verifiedBy?.substring(0, 8)}...
                </Button>
              )}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Index;