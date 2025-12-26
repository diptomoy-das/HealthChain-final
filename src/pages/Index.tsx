import { web3Service } from '@/lib/web3';
import { useState, useEffect } from 'react';
import { WalletConnect } from '@/components/WalletConnect';
import { DocumentUpload } from '@/components/DocumentUpload';
import { FacilitySelector } from '@/components/FacilitySelector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, FileText, Building2, History, Send, ExternalLink, Key, Blocks, Lock, CheckCircle2, Clock, Hash, FileCheck } from 'lucide-react';
import { toast } from 'sonner';

const Index = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [hasEnteredApp, setHasEnteredApp] = useState(false);
  const [userAddress, setUserAddress] = useState<string>('');
  const [activeTab, setActiveTab] = useState('upload');
  const [uploadedDocuments, setUploadedDocuments] = useState<
    Array<{ id: number; ipfsCid: string; type: string; timestamp: number }>
  >([]);
  const [selectedDocuments, setSelectedDocuments] = useState<number[]>([]);
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
    setUploadedDocuments([]);
    setSelectedDocuments([]);
  };

  const handleEnterApp = () => {
    setHasEnteredApp(true);
  };

  const handleDocumentUpload = (documentId: number, ipfsCid: string) => {
    setUploadedDocuments((prev) => [
      ...prev,
      {
        id: documentId,
        ipfsCid,
        type: 'insurance_card',
        timestamp: Date.now(),
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
    setSelectedDocuments((prev) =>
      prev.includes(documentId)
        ? prev.filter((id) => id !== documentId)
        : [...prev, documentId]
    );
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
                { value: "history", icon: History, label: "History & Access" }
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
                              </div>
                            </div>
                            {selectedDocuments.includes(doc.id) && (
                              <div className="w-4 h-4 rounded-full bg-cyan-500 shadow-glow animate-pulse" />
                            )}
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
                                  {tx.documentIds.join(', ')}
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
                                <span className="font-mono text-emerald-400/80 truncate bg-emerald-950/30 px-2 py-1 rounded border border-emerald-500/20">
                                  {tx.txHash}
                                </span>
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
    </div>
  );
};

export default Index;