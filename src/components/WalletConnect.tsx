import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { buttonVariants } from '@/components/ui/button-variants';
import { Wallet, LogOut, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { web3Service } from '@/lib/web3';

interface WalletConnectProps {
  onConnect?: (address: string) => void;
  onDisconnect?: () => void;
}

export const WalletConnect = ({ onConnect, onDisconnect }: WalletConnectProps) => {
  const [account, setAccount] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    checkConnection();

    web3Service.onAccountChanged((newAccount) => {
      setAccount(newAccount);
      loadBalance();
      toast.info('Account changed', {
        description: `Now using: ${formatAddress(newAccount)}`,
      });
    });

    web3Service.onNetworkChanged(() => {
      toast.info('Network changed', {
        description: 'Please ensure you are on Celo Alfajores testnet',
      });
      checkConnection();
    });
  }, []);

  const checkConnection = async () => {
    try {
      const existingAccount = await web3Service.getAccount();
      if (existingAccount) {
        const address = await web3Service.connect();
        setAccount(address);
        await loadBalance();
        onConnect?.(address);
      }
    } catch (error) {
      console.error('Failed to check connection:', error);
    }
  };

  const loadBalance = async () => {
    try {
      const bal = await web3Service.getBalance();
      setBalance(parseFloat(bal).toFixed(4));
    } catch (error) {
      console.error('Failed to load balance:', error);
    }
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const address = await web3Service.connect();
      setAccount(address);
      await loadBalance();
      onConnect?.(address);

      toast.success('Wallet connected', {
        description: `Connected to ${formatAddress(address)}`,
      });
    } catch (error: any) {
      console.error('Connection error:', error);
      toast.error('Connection failed', {
        description: error.message || 'Failed to connect wallet',
      });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    web3Service.disconnect();
    setAccount(null);
    setBalance('0');
    onDisconnect?.();

    toast.info('Wallet disconnected', {
      description: 'You have been disconnected from your wallet',
    });
  };

  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
  };

  if (!account) {
    return (
      <div className="flex flex-col items-center gap-4">
        <Button
          onClick={handleConnect}
          disabled={isConnecting}
          className={buttonVariants({ variant: 'hero', size: 'lg' })}
        >
          <Wallet className="mr-2 h-5 w-5" />
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </Button>

        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-lg">
          <AlertCircle className="h-4 w-4" />
          <span>MetaMask or compatible wallet required</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 bg-gradient-card px-4 py-3 rounded-xl border border-primary/10 shadow-md">
      <div className="flex-1">
        <p className="text-sm font-medium text-foreground">{formatAddress(account)}</p>
        <p className="text-xs text-muted-foreground">{balance} CELO</p>
      </div>

      <Button
        onClick={handleDisconnect}
        variant="ghost"
        size="sm"
        className="text-muted-foreground hover:text-destructive"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
};
