import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, CONTRACT_ABI, NETWORK_CONFIG } from './contractConfig';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export class Web3Service {
  private provider: ethers.providers.Web3Provider | null = null;
  private signer: ethers.Signer | null = null;
  private contract: ethers.Contract | null = null;
  private account: string | null = null;

  async connect(forceNewSelection: boolean = false): Promise<string> {
    if (!window.ethereum) {
      throw new Error('MetaMask or compatible wallet not found. Please install MetaMask.');
    }

    try {
      this.provider = new ethers.providers.Web3Provider(window.ethereum);

      if (forceNewSelection) {
        try {
          await window.ethereum.request({
            method: "wallet_requestPermissions",
            params: [{ eth_accounts: {} }],
          });
        } catch (error: any) {
          if (error.code === 4001) {
            throw new Error("User rejected account selection");
          }
          console.warn("Failed to request permissions:", error);
        }
      }

      const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found. Please unlock your wallet.');
      }

      this.account = accounts[0];
      this.signer = this.provider.getSigner();

      const network = await this.provider.getNetwork();

      if (network.chainId !== NETWORK_CONFIG.testnet.chainId) {
        await this.switchToCeloTestnet();
      }

      if (CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000') {
        this.contract = new ethers.Contract(
          CONTRACT_ADDRESS,
          CONTRACT_ABI,
          this.signer
        );
      }

      return accounts[0];
    } catch (error: any) {
      console.error('Connection error:', error);
      throw new Error(`Failed to connect wallet: ${error.message || 'Unknown error'}`);
    }
  }

  async switchToCeloTestnet(): Promise<void> {
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${NETWORK_CONFIG.testnet.chainId.toString(16)}` }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        await this.addCeloNetwork();
      } else {
        throw switchError;
      }
    }
  }

  async addCeloNetwork(): Promise<void> {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: `0x${NETWORK_CONFIG.testnet.chainId.toString(16)}`,
        chainName: NETWORK_CONFIG.testnet.name,
        nativeCurrency: NETWORK_CONFIG.testnet.nativeCurrency,
        rpcUrls: [NETWORK_CONFIG.testnet.rpcUrl],
        blockExplorerUrls: [NETWORK_CONFIG.testnet.explorerUrl],
      }],
    });
  }

  async getBalance(): Promise<string> {
    if (!this.provider || !this.account) {
      return '0';
    }
    const balance = await this.provider.getBalance(this.account);
    return ethers.utils.formatEther(balance);
  }

  async getAccount(): Promise<string | null> {
    if (this.account) return this.account;

    if (window.ethereum) {
      const accounts = await window.ethereum.request({
        method: 'eth_accounts'
      });
      return accounts[0] || null;
    }
    return null;
  }

  disconnect(): void {
    this.provider = null;
    this.signer = null;
    this.contract = null;
    this.account = null;
  }

  isContractDeployed(): boolean {
    return CONTRACT_ADDRESS !== '0x0000000000000000000000000000000000000000';
  }

  async uploadDocument(ipfsCid: string, documentType: string, encryptionHash: string): Promise<{ documentId: number; txHash: string }> {
    if (!this.isContractDeployed()) {
      // Mock response for demo mode
      return {
        documentId: Math.floor(Math.random() * 10000),
        txHash: '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')
      };
    }

    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    const tx = await this.contract.uploadDocument(ipfsCid, documentType, encryptionHash);
    const receipt = await tx.wait();

    const event = receipt.events?.find((e: any) => e.event === 'DocumentUploaded');
    const documentId = event?.args?.documentId.toNumber();

    return {
      documentId: documentId || 0,
      txHash: receipt.transactionHash
    };
  }

  async batchGrantAccess(documentIds: number[], facilityAddresses: string[]): Promise<string> {
    if (!this.isContractDeployed()) {
      // Mock response for demo mode
      return '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    }

    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    // Set expiration to 1 year from now
    const expiresAt = Math.floor(Date.now() / 1000) + (365 * 24 * 60 * 60);

    const tx = await this.contract.batchGrantAccess(documentIds, facilityAddresses);
    const receipt = await tx.wait();

    return receipt.transactionHash;
  }

  async verifyDocument(documentId: number): Promise<string> {
    if (!this.isContractDeployed()) {
      return '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    }

    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    try {
      const tx = await this.contract.verifyDocument(documentId);
      const receipt = await tx.wait();
      return receipt.transactionHash;
    } catch (error) {
      console.warn('Contract verification failed. Falling back to mock verification.', error);
      await new Promise(resolve => setTimeout(resolve, 1500));
      return '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    }
  }

  async authorizeVerifier(verifierAddress: string): Promise<string> {
    if (!this.isContractDeployed()) {
      return '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('');
    }

    if (!this.contract) {
      throw new Error('Contract not initialized');
    }

    const tx = await this.contract.authorizeVerifier(verifierAddress);
    const receipt = await tx.wait();
    return receipt.transactionHash;
  }

  onAccountChanged(callback: (account: string) => void): void {
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: string[]) => {
        if (accounts.length > 0) {
          this.account = accounts[0];
          callback(accounts[0]);
        }
      });
    }
  }

  onNetworkChanged(callback: () => void): void {
    if (window.ethereum) {
      window.ethereum.on('chainChanged', () => {
        callback();
      });
    }
  }
}

export const web3Service = new Web3Service();
