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
      <div className="flex flex-col items-center gap-4 animate-fade-in">
        <Button
          onClick={handleConnect}
          disabled={isConnecting}
          className="relative group overflow-hidden rounded-full px-8 py-6 transition-all duration-300 hover:shadow-glow"
        >
          <div className="absolute inset-0 gradient-primary opacity-90 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex items-center gap-2 text-white font-semibold text-lg">
            <Wallet className="h-5 w-5" />
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </div>
        </Button>

        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-white/5 px-4 py-2 rounded-full border border-white/10 backdrop-blur-sm">
          <AlertCircle className="h-4 w-4 text-primary" />
          <span>MetaMask or compatible wallet required</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 glass-card px-5 py-3 rounded-full animate-fade-in">
      <div className="flex flex-col items-end mr-2">
        <p className="text-sm font-bold text-foreground tracking-wide">{formatAddress(account)}</p>
        <p className="text-xs text-primary font-medium">{balance} CELO</p>
      </div>

      <div className="h-8 w-[1px] bg-white/10 mx-1" />

      <Button
        onClick={handleDisconnect}
        variant="ghost"
        size="icon"
        className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors"
      >
        <LogOut className="h-5 w-5" />
      </Button>
    </div>
  );
};
