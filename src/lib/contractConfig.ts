// Celo Network Configuration
export const NETWORK_CONFIG = {
  testnet: {
    name: 'Celo Sepolia Testnet',
    chainId: 44787, // Alfajores testnet
    rpcUrl: 'https://alfajores-forno.celo-testnet.org',
    explorerUrl: 'https://alfajores.celoscan.io',
    nativeCurrency: {
      name: 'CELO',
      symbol: 'CELO',
      decimals: 18,
    },
  },
  mainnet: {
    name: 'Celo Mainnet',
    chainId: 42220,
    rpcUrl: 'https://forno.celo.org',
    explorerUrl: 'https://celoscan.io',
    nativeCurrency: {
      name: 'CELO',
      symbol: 'CELO',
      decimals: 18,
    },
  },
};

// Smart Contract Configuration
// Replace with your actual deployed contract address
export const CONTRACT_ADDRESS = '0x0000000000000000000000000000000000000000';

// Contract ABI - Simplified version for demo
export const CONTRACT_ABI = [
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "ipfsCid",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "documentType",
        "type": "string"
      },
      {
        "internalType": "string",
        "name": "encryptionHash",
        "type": "string"
      }
    ],
    "name": "uploadDocument",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256[]",
        "name": "documentIds",
        "type": "uint256[]"
      },
      {
        "internalType": "address[]",
        "name": "facilities",
        "type": "address[]"
      },
      {
        "internalType": "uint256",
        "name": "expiresAt",
        "type": "uint256"
      }
    ],
    "name": "batchGrantAccess",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];

// Document Types
export const DOCUMENT_TYPES = [
  { value: 'insurance_card', label: 'Insurance Card' },
  { value: 'medical_record', label: 'Medical Record' },
  { value: 'prescription', label: 'Prescription' },
  { value: 'lab_result', label: 'Lab Result' },
  { value: 'vaccination_record', label: 'Vaccination Record' },
  { value: 'id_document', label: 'ID Document' },
  { value: 'other', label: 'Other' },
];
