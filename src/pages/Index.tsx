import { web3Service } from '@/lib/web3';
import { useState } from 'react';
import { WalletConnect } from '@/components/WalletConnect';
import { DocumentUpload } from '@/components/DocumentUpload';
import { FacilitySelector } from '@/components/FacilitySelector';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Building2, History, Shield, Blocks, Key, Send, ExternalLink, AlertCircle } from 'lucide-react';

const Index = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [userAddress, setUserAddress] = useState<string>('');
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
    setUserAddress('');
    setUploadedDocuments([]);
    setSelectedDocuments([]);
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

  return (
    <div className="min-h-screen">
      <header className="glass-effect border-b border-border/50 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-glow-lg">
                <Shield className="h-7 w-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold gradient-text">HealthChain</h1>
                <p className="text-xs text-muted-foreground">Decentralized Healthcare Records</p>
              </div>
            </div>
            <WalletConnect onConnect={handleWalletConnect} onDisconnect={handleWalletDisconnect} />
          </div>
        </div>
      </header>

      {!isConnected && (
        <section className="py-24 px-4 relative">
          <div className="absolute inset-0 bg-gradient-hero opacity-10 blur-3xl"></div>
          <div className="container mx-auto max-w-5xl text-center relative z-10">
            <div className="mb-12">
              <div className="inline-flex items-center gap-2 glass-effect px-6 py-3 rounded-full text-sm font-medium mb-8 shadow-glow">
                <Blocks className="h-4 w-4 text-primary" />
                <span className="gradient-text">Powered by Celo Blockchain</span>
              </div>
              <h2 className="text-6xl md:text-7xl font-bold mb-6 leading-tight">
                <span className="gradient-text">Your Healthcare</span>
                <br />
                <span className="text-foreground">Securely on Chain</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
                Upload once, share with multiple medical facilities in a single transaction.
                End-to-end encrypted, decentralized, and patient-controlled.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <Card className="glass-effect border-border/50 shadow-lg hover:shadow-glow-lg hover:border-primary/50 transition-smooth group">
                <CardHeader>
                  <div className="w-16 h-16 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-glow-lg group-hover:shadow-glow-lg transition-smooth">
                    <Key className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">You Own Your Data</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Complete control over who accesses your healthcare documents
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="glass-effect border-border/50 shadow-lg hover:shadow-glow-lg hover:border-primary/50 transition-smooth group">
                <CardHeader>
                  <div className="w-16 h-16 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-glow-lg group-hover:shadow-glow-lg transition-smooth">
                    <Shield className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">End-to-End Encrypted</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Client-side encryption ensures maximum privacy and security
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="glass-effect border-border/50 shadow-lg hover:shadow-glow-lg hover:border-primary/50 transition-smooth group">
                <CardHeader>
                  <div className="w-16 h-16 rounded-xl gradient-primary flex items-center justify-center mx-auto mb-4 shadow-glow-lg group-hover:shadow-glow-lg transition-smooth">
                    <Blocks className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">Blockchain Verified</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    Immutable audit trail on Celo blockchain ensures authenticity
                  </CardDescription>
                </CardContent>
              </Card>
            </div>

            <div className="flex justify-center">
              <WalletConnect onConnect={handleWalletConnect} onDisconnect={handleWalletDisconnect} />
            </div>
          </div>
        </section>
      )}

      {isConnected && (
        <div className="container mx-auto px-4 py-8">
          <Tabs defaultValue="upload" className="space-y-6">
            <TabsList className="glass-effect border border-border/50 shadow-lg p-1.5 h-auto">
              <TabsTrigger value="upload" className="gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-glow">
                <FileText className="h-4 w-4" />
                Upload Documents
              </TabsTrigger>
              <TabsTrigger value="share" className="gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-glow">
                <Building2 className="h-4 w-4" />
                Share with Facilities
              </TabsTrigger>
              <TabsTrigger value="history" className="gap-2 data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-glow">
                <History className="h-4 w-4" />
                History & Access
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload" className="space-y-6">
              <div className="grid lg:grid-cols-2 gap-6">
                <DocumentUpload onUploadComplete={handleDocumentUpload} />

                <Card className="glass-effect border-border/50 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-2xl">Your Documents</CardTitle>
                    <CardDescription>Uploaded healthcare documents</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {uploadedDocuments.length === 0 ? (
                      <div className="text-center py-16">
                        <div className="w-20 h-20 rounded-2xl glass-effect flex items-center justify-center mx-auto mb-4">
                          <FileText className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">No documents uploaded yet</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {uploadedDocuments.map((doc) => (
                          <div
                            key={doc.id}
                            className={`
                              flex items-center justify-between p-4 rounded-xl border transition-smooth cursor-pointer
                              ${
                                selectedDocuments.includes(doc.id)
                                  ? 'border-primary bg-primary/10 shadow-glow'
                                  : 'glass-effect border-border/50 hover:border-primary/50 hover:shadow-glow'
                              }
                            `}
                            onClick={() => toggleDocumentSelection(doc.id)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
                                <FileText className="h-6 w-6 text-white" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold">Document #{doc.id}</p>
                                <p className="text-xs text-muted-foreground font-mono">
                                  {doc.ipfsCid.substring(0, 20)}...
                                </p>
                              </div>
                            </div>
                            {selectedDocuments.includes(doc.id) && (
                              <div className="w-3 h-3 rounded-full bg-primary shadow-glow" />
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="share">
              <FacilitySelector
                selectedDocuments={selectedDocuments}
                onAccessGranted={handleAccessGranted}
              />
            </TabsContent>

            <TabsContent value="history">
              <Card className="glass-effect border-border/50 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-2xl">Transaction History</CardTitle>
                  <CardDescription>View your document sharing history</CardDescription>
                </CardHeader>
                <CardContent>
                  {transactionHistory.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-20 h-20 rounded-2xl glass-effect flex items-center justify-center mx-auto mb-4">
                        <History className="h-10 w-10 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground">No transactions yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {transactionHistory.map((tx) => (
                        <div
                          key={tx.id}
                          className="glass-effect border-border/50 rounded-xl p-5 hover:border-primary/50 hover:shadow-glow transition-smooth"
                        >
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
                                <Send className="h-5 w-5 text-white" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold">Access Granted</p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(tx.timestamp).toLocaleString()}
                                </p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-xs gap-1 glass-effect hover:border-primary/50"
                              onClick={() => window.open(`https://alfajores.celoscan.io/tx/${tx.txHash}`, '_blank')}
                            >
                              View on Explorer
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="space-y-2.5 text-sm">
                            <div className="flex gap-2">
                              <span className="text-muted-foreground min-w-24">Documents:</span>
                              <span className="font-mono text-foreground">
                                {tx.documentIds.join(', ')}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <span className="text-muted-foreground min-w-24">Facilities:</span>
                              <span className="text-foreground">
                                {tx.facilityNames.join(', ')}
                              </span>
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

      <footer className="glass-effect border-t border-border/50 mt-20">
        <div className="container mx-auto px-4 py-10 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shadow-glow">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">HealthChain</span>
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            Built on Celo Blockchain • IPFS Decentralized Storage • End-to-End Encrypted
          </p>
          <p className="text-xs text-muted-foreground">
            Your data, your control. Patient sovereignty guaranteed by smart contracts.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
