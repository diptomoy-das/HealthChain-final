import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Building2, Search, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { web3Service } from '@/lib/web3';

const MOCK_FACILITIES = [
  {
    id: '1',
    name: 'City General Hospital',
    address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
    type: 'Hospital',
  },
  {
    id: '2',
    name: 'Medicare Clinic',
    address: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
    type: 'Clinic',
  },
  {
    id: '3',
    name: 'HealthCare Insurance Co.',
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    type: 'Insurance',
  },
  {
    id: '4',
    name: 'Wellness Medical Center',
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    type: 'Medical Center',
  },
  {
    id: '5',
    name: 'National Lab Services',
    address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    type: 'Laboratory',
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
      
      // --- THIS IS THE FIX ---
      // We must convert the addresses to lowercase to avoid the checksum error.
      const facilityAddresses = facilities.map(f => f.address.toLowerCase());
      // --- END OF FIX ---

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
    <Card className="glass-effect border-border/50 shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">Share with Healthcare Facilities</CardTitle>
        <CardDescription>
          Grant access to your selected documents to healthcare facilities
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {selectedDocuments.length === 0 && (
          <div className="glass-effect border-yellow-500/30 rounded-xl p-4">
            <p className="text-sm text-yellow-500">
              No documents selected. Go to the Upload tab and select documents to share.
            </p>
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search facilities..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 glass-effect h-12"
          />
        </div>

        <ScrollArea className="h-[400px] rounded-xl glass-effect p-4">
          <div className="space-y-3">
            {filteredFacilities.map((facility) => (
              <div
                key={facility.id}
                className={`
                  flex items-center justify-between p-4 rounded-xl border transition-smooth cursor-pointer
                  ${
                    selectedFacilities.includes(facility.id)
                      ? 'border-primary bg-primary/10 shadow-glow'
                      : 'glass-effect border-border/50 hover:border-primary/50 hover:shadow-glow'
                  }
                `}
                onClick={() => toggleFacility(facility.id)}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
                    <Building2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{facility.name}</p>
                    <p className="text-xs text-muted-foreground">{facility.type}</p>
                  </div>
                </div>
                <Checkbox
                  checked={selectedFacilities.includes(facility.id)}
                  onCheckedChange={() => toggleFacility(facility.id)}
                />
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="glass-effect rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold">Selected:</p>
            <p className="text-sm text-primary">
              {selectedFacilities.length} facilities • {selectedDocuments.length} documents
            </p>
          </div>
        </div>

        <Button
          onClick={handleGrantAccess}
          disabled={selectedDocuments.length === 0 || selectedFacilities.length === 0 || isGranting}
          className="w-full h-12 gradient-primary text-white font-semibold shadow-glow-lg hover:shadow-glow-lg transition-smooth"
        >
          {isGranting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Granting Access...
            </>
          ) : (
            <>
              <Send className="mr-2 h-5 w-5" />
              Grant Access
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};
