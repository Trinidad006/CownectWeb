// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title AnimalCertificates
 * @notice Certificados on‑chain para animales registrados en Cownect.
 *
 * La idea es muy simple:
 * - Cada certificado referencia un animal off‑chain (ID de Firestore u otro backend).
 * - Guarda también la wallet propietaria y un metadataUri (JSON en IPFS, Arweave, etc.)
 *   donde se describen los detalles del certificado (sanidad, raza, programa, etc.).
 * - Los certificados son inmutables: una vez emitidos no se modifican ni se borran.
 *
 * NOTA: este contrato es intencionalmente minimalista. La lógica de
 *       "solo usuarios premium pueden emitir certificados" se aplica
 *       en la capa de aplicación (backend / frontend), no aquí.
 */
contract AnimalCertificates {
    struct Certificate {
        address owner;          // Wallet del ganadero/ranchero
        string animalIdOffchain; // ID del animal en Firestore/BD
        string metadataUri;     // URI al JSON con información del certificado
        uint64 issuedAt;        // Marca de tiempo de emisión (block.timestamp)
    }

    /// @dev Contador incremental de certificados
    uint256 public nextCertificateId;

    /// @dev certificateId => Certificate
    mapping(uint256 => Certificate) public certificates;

    event CertificateIssued(
        uint256 indexed certificateId,
        address indexed owner,
        string animalIdOffchain,
        string metadataUri
    );

    /**
     * @notice Emite un nuevo certificado para un animal off‑chain.
     * @param animalIdOffchain ID del animal en el sistema off‑chain (por ejemplo, Firestore).
     * @param metadataUri URI al JSON con los datos del certificado (IPFS u otro).
     *
     * El owner será msg.sender.
     */
    function issueCertificate(
        string calldata animalIdOffchain,
        string calldata metadataUri
    ) external returns (uint256 certificateId) {
        require(bytes(animalIdOffchain).length > 0, "animalId required");
        require(bytes(metadataUri).length > 0, "metadataUri required");

        certificateId = nextCertificateId++;

        certificates[certificateId] = Certificate({
            owner: msg.sender,
            animalIdOffchain: animalIdOffchain,
            metadataUri: metadataUri,
            issuedAt: uint64(block.timestamp)
        });

        emit CertificateIssued(certificateId, msg.sender, animalIdOffchain, metadataUri);
    }
}

