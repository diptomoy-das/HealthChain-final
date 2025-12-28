import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Building2, Search, Send, Loader2, Globe, Radio, Share2, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { web3Service } from '@/lib/web3';

const MOCK_FACILITIES = [
  {
    id: '1',
    name: 'City General Hospital',
    address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
    type: 'Hospital',
    status: 'Online',
    latency: '12ms'
  },
  {
    id: '2',
    name: 'Medicare Clinic',
    address: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
    type: 'Clinic',
    status: 'Online',
    latency: '24ms'
  },
  {
    id: '3',
    name: 'HealthCare Insurance Co.',
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    type: 'Insurance',
    status: 'Active',
    latency: '45ms'
  },
  {
    id: '4',
    name: 'Wellness Medical Center',
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    type: 'Medical Center',
    status: 'Online',
    latency: '18ms'
  },
  {
    id: '5',
    name: 'National Lab Services',
    address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    type: 'Laboratory',
    status: 'Busy',
    latency: '89ms'
  },
];

interface FacilitySelectorProps {
  selectedDocuments: number[];
  onAccessGranted?: (data: {
    documentIds: number[];
    facilityNames: string[];
    txHash: string;
  }) => void;
}

export const FacilitySelector = ({ selectedDocuments, onAccessGranted }: FacilitySelectorProps) => {
  const [selectedFacilities, setSelectedFacilities] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isGranting, setIsGranting] = useState(false);

  const filteredFacilities = MOCK_FACILITIES.filter(facility =>
    facility.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    facility.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleFacility = (facilityId: string) => {
    setSelectedFacilities(prev =>
      prev.includes(facilityId)
        ? prev.filter(id => id !== facilityId)
        : [...prev, facilityId]
    );
  };

  const handleGrantAccess = async () => {
    if (selectedDocuments.length === 0) {
      toast.error('No documents selected', {
        description: 'Please select documents from the Upload tab first',
      });
      return;
    }

    if (selectedFacilities.length === 0) {
      toast.error('No facilities selected', {
        description: 'Please select at least one healthcare facility',
      });
      return;
    }

    setIsGranting(true);
    try {
      const facilities = MOCK_FACILITIES.filter(f => selectedFacilities.includes(f.id));

      // We must convert the addresses to lowercase to avoid the checksum error.
      const facilityAddresses = facilities.map(f => f.address.toLowerCase());

      const txHash = await web3Service.batchGrantAccess(selectedDocuments, facilityAddresses);

      toast.success('Access granted successfully', {
        description: `Shared with ${facilities.length} facilities`,
      });

      onAccessGranted?.({
        documentIds: selectedDocuments,
        facilityNames: facilities.map(f => f.name),
        txHash,
      });

      setSelectedFacilities([]);
    } catch (error: any) {
      toast.error('Failed to grant access', {
        description: error.message || 'Transaction failed',
      });
    } finally {
      setIsGranting(false);
    }
  };
  return (
    <Card className="bg-black/20 backdrop-blur-md border-2 border-black shadow-[0_0_50px_-12px_rgba(168,85,247,0.2)] overflow-hidden relative">
      {/* Network Background Elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,85,247,0.1),transparent_40%)]" />

      <CardHeader className="relative z-10 border-b border-purple-500/10 pb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center relative">
              <Globe className="h-6 w-6 text-purple-400" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-black animate-pulse" />
            </div>
            <div>
              <CardTitle className="text-2xl text-purple-50">Provider Network</CardTitle>
              <CardDescription className="text-purple-200/60">Select recipients for data access</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/30 border border-purple-500/20">
            <Activity className="h-3 w-3 text-purple-400" />
            <span className="text-xs font-mono text-purple-400">NETWORK ACTIVE</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-6 relative z-10">
        {/* Warning banner removed to allow viewing facilities freely */}

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-purple-300/50 group-focus-within:text-purple-400 transition-colors" />
          <Input
            placeholder="Search network nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-14 bg-black/20 border-purple-500/20 focus:ring-purple-500/50 text-base rounded-xl transition-all duration-300 placeholder:text-purple-300/30"
          />
        </div>

        <ScrollArea className="h-[400px] rounded-2xl bg-black/20 border border-purple-500/10 p-4">
          <div className="space-y-3">
            {filteredFacilities.map((facility) => (
              <div
                key={facility.id}
                className={`
                  flex items-center justify-between p-4 rounded-xl border transition-all duration-300 cursor-pointer group relative overflow-hidden
                  ${selectedFacilities.includes(facility.id)
                    ? 'border-purple-500 bg-purple-500/10 shadow-[0_0_20px_rgba(168,85,247,0.2)]'
                    : 'border-white/5 hover:bg-purple-500/5 hover:border-purple-500/30'
                  }
                `}
                onClick={() => toggleFacility(facility.id)}
              >
                {/* Connection Line Animation */}
                {selectedFacilities.includes(facility.id) && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-purple-500 shadow-[0_0_10px_#a855f7]" />
                )}

                <div className="flex items-center gap-4">
                  <div className={`
                    w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 relative
                    ${selectedFacilities.includes(facility.id) ? 'bg-purple-500 text-white' : 'bg-white/5 text-muted-foreground group-hover:text-purple-400'}
                  `}>
                    <Building2 className="h-6 w-6" />
                    {selectedFacilities.includes(facility.id) && (
                      <span className="absolute inset-0 rounded-xl ring-2 ring-purple-500 ring-offset-2 ring-offset-black animate-pulse" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-base font-semibold text-foreground">{facility.name}</p>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20 font-mono">
                        {facility.latency}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground group-hover:text-purple-200/70 transition-colors">{facility.type} • {facility.address.substring(0, 10)}...</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-mono text-green-400 flex items-center gap-1 justify-end">
                      <Radio className="h-3 w-3" /> {facility.status}
                    </p>
                  </div>
                  <Checkbox
                    checked={selectedFacilities.includes(facility.id)}
                    onCheckedChange={() => toggleFacility(facility.id)}
                    className="data-[state=checked]:bg-purple-500 data-[state=checked]:border-purple-500 border-white/20 h-6 w-6 rounded-lg"
                  />
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="bg-purple-900/20 rounded-xl p-4 border border-purple-500/20 flex items-center justify-between backdrop-blur-sm">
          <div className="flex items-center gap-2 text-purple-200">
            <Share2 className="h-4 w-4" />
            <span className="text-sm font-medium">Transmission Summary</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-white bg-white/10 px-3 py-1 rounded-lg border border-white/10">
              {selectedFacilities.length} Nodes
            </span>
            <span className="text-sm font-bold text-cyan-400 bg-cyan-950/50 px-3 py-1 rounded-lg border border-cyan-500/20">
              {selectedDocuments.length} Packets
            </span>
          </div>
        </div>

        <Button
          onClick={handleGrantAccess}
          disabled={selectedDocuments.length === 0 || selectedFacilities.length === 0 || isGranting}
          className={`
            w-full h-14 text-lg font-bold transition-all duration-300 rounded-xl
            ${selectedDocuments.length > 0 && selectedFacilities.length > 0
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-[0_0_30px_-5px_rgba(168,85,247,0.5)]'
              : 'bg-white/5 text-muted-foreground'
            }
          `}
        >
          {isGranting ? (
            <>
              <Loader2 className="mr-3 h-6 w-6 animate-spin" />
              Broadcasting to Network...
            </>
          ) : (
            <>
              <Send className="mr-3 h-6 w-6" />
              Broadcast Access Rights
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
