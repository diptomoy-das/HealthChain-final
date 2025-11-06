// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title HealthDocumentManager
 * @dev Manages healthcare document metadata and access control on Celo blockchain
 * @notice Deploy this contract to Celo testnet (Alfajores) or mainnet
 */
contract HealthDocumentManager {
    struct Document {
        string ipfsCid;          // IPFS Content Identifier
        string documentType;     // e.g., "insurance_card", "medical_record", "id_proof"
        uint256 timestamp;
        address owner;
        string encryptionHash;   // Hash of encryption key for verification
        bool isActive;
    }

    struct FacilityAccess {
        bool hasAccess;
        uint256 grantedAt;
        uint256 expiresAt;      // 0 means no expiration
    }

    // State variables
    mapping(uint256 => Document) public documents;
    mapping(uint256 => mapping(address => FacilityAccess)) public documentAccess;
    mapping(address => uint256[]) public userDocuments;
    
    uint256 public documentCounter;
    
    // Events
    event DocumentUploaded(
        uint256 indexed documentId,
        address indexed owner,
        string ipfsCid,
        string documentType,
        uint256 timestamp
    );
    
    event AccessGranted(
        uint256 indexed documentId,
        address indexed owner,
        address indexed facility,
        uint256 expiresAt
    );
    
    event AccessRevoked(
        uint256 indexed documentId,
        address indexed owner,
        address indexed facility
    );
    
    event BatchAccessGranted(
        uint256[] documentIds,
        address indexed owner,
        address[] facilities
    );

    // Modifiers
    modifier onlyDocumentOwner(uint256 documentId) {
        require(documents[documentId].owner == msg.sender, "Not document owner");
        require(documents[documentId].isActive, "Document is not active");
        _;
    }

    /**
     * @dev Upload a new healthcare document
     * @param ipfsCid IPFS content identifier for the encrypted document
     * @param documentType Type of document (e.g., "insurance_card")
     * @param encryptionHash Hash of the encryption key for verification
     */
    function uploadDocument(
        string memory ipfsCid,
        string memory documentType,
        string memory encryptionHash
    ) external returns (uint256) {
        require(bytes(ipfsCid).length > 0, "Invalid IPFS CID");
        require(bytes(documentType).length > 0, "Invalid document type");
        
        documentCounter++;
        uint256 newDocumentId = documentCounter;
        
        documents[newDocumentId] = Document({
            ipfsCid: ipfsCid,
            documentType: documentType,
            timestamp: block.timestamp,
            owner: msg.sender,
            encryptionHash: encryptionHash,
            isActive: true
        });
        
        userDocuments[msg.sender].push(newDocumentId);
        
        emit DocumentUploaded(
            newDocumentId,
            msg.sender,
            ipfsCid,
            documentType,
            block.timestamp
        );
        
        return newDocumentId;
    }

    /**
     * @dev Grant access to a single facility for a document
     * @param documentId The ID of the document
     * @param facility Address of the healthcare facility
     * @param expiresAt Expiration timestamp (0 for no expiration)
     */
    function grantAccess(
        uint256 documentId,
        address facility,
        uint256 expiresAt
    ) public onlyDocumentOwner(documentId) {
        require(facility != address(0), "Invalid facility address");
        
        documentAccess[documentId][facility] = FacilityAccess({
            hasAccess: true,
            grantedAt: block.timestamp,
            expiresAt: expiresAt
        });
        
        emit AccessGranted(documentId, msg.sender, facility, expiresAt);
    }

    /**
     * @dev Batch grant access to multiple facilities for multiple documents in a single transaction
     * @param documentIds Array of document IDs
     * @param facilities Array of facility addresses
     * @notice This is the key function for single-transaction multi-facility submission
     */
    function batchGrantAccess(
        uint256[] memory documentIds,
        address[] memory facilities
    ) external {
        require(documentIds.length > 0, "No documents provided");
        require(facilities.length > 0, "No facilities provided");
        
        for (uint256 i = 0; i < documentIds.length; i++) {
            require(
                documents[documentIds[i]].owner == msg.sender,
                "Not owner of all documents"
            );
            require(
                documents[documentIds[i]].isActive,
                "One or more documents inactive"
            );
            
            for (uint256 j = 0; j < facilities.length; j++) {
                require(facilities[j] != address(0), "Invalid facility address");
                
                documentAccess[documentIds[i]][facilities[j]] = FacilityAccess({
                    hasAccess: true,
                    grantedAt: block.timestamp,
                    expiresAt: 0 // No expiration by default in batch
                });
                
                emit AccessGranted(documentIds[i], msg.sender, facilities[j], 0);
            }
        }
        
        emit BatchAccessGranted(documentIds, msg.sender, facilities);
    }

    /**
     * @dev Revoke access from a facility
     * @param documentId The ID of the document
     * @param facility Address of the healthcare facility
     */
    function revokeAccess(
        uint256 documentId,
        address facility
    ) external onlyDocumentOwner(documentId) {
        require(documentAccess[documentId][facility].hasAccess, "Access not granted");
        
        documentAccess[documentId][facility].hasAccess = false;
        
        emit AccessRevoked(documentId, msg.sender, facility);
    }

    /**
     * @dev Check if a facility has valid access to a document
     * @param documentId The ID of the document
     * @param facility Address of the healthcare facility
     */
    function hasValidAccess(
        uint256 documentId,
        address facility
    ) external view returns (bool) {
        FacilityAccess memory access = documentAccess[documentId][facility];
        
        if (!access.hasAccess) return false;
        if (access.expiresAt == 0) return true;
        if (block.timestamp <= access.expiresAt) return true;
        
        return false;
    }

    /**
     * @dev Get all document IDs for a user
     * @param user Address of the user
     */
    function getUserDocuments(address user) external view returns (uint256[] memory) {
        return userDocuments[user];
    }

    /**
     * @dev Get document details
     * @param documentId The ID of the document
     */
    function getDocument(uint256 documentId) external view returns (
        string memory ipfsCid,
        string memory documentType,
        uint256 timestamp,
        address owner,
        string memory encryptionHash,
        bool isActive
    ) {
        Document memory doc = documents[documentId];
        return (
            doc.ipfsCid,
            doc.documentType,
            doc.timestamp,
            doc.owner,
            doc.encryptionHash,
            doc.isActive
        );
    }

    /**
     * @dev Deactivate a document (soft delete)
     * @param documentId The ID of the document
     */
    function deactivateDocument(uint256 documentId) external onlyDocumentOwner(documentId) {
        documents[documentId].isActive = false;
    }
}
