// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

/**
 * @title BOTCertificates
 * @notice On-chain certificate registry on BOT Chain.
 *         Admin-approved issuers create verifiable credentials;
 *         certificates can be revoked by their issuer.
 */
contract BOTCertificates is Ownable, Pausable, ReentrancyGuard {

    // ──────────────────────────────────────────────
    //  Types
    // ──────────────────────────────────────────────

    struct Issuer {
        string name;
        bool active;
    }

    struct Certificate {
        uint256 id;
        address issuer;
        address recipient;
        string title;
        string details;
        string ipfsHash;
        uint256 issuedAt;
        bool revoked;
    }

    // ──────────────────────────────────────────────
    //  State
    // ──────────────────────────────────────────────

    uint256 private _nextId = 1;

    mapping(uint256 => Certificate) private _certificates;
    mapping(address => Issuer) private _issuers;
    mapping(address => uint256[]) private _recipientCerts;

    // ──────────────────────────────────────────────
    //  Events
    // ──────────────────────────────────────────────

    event CertificateIssued(uint256 indexed id, address indexed issuer, address indexed recipient, string title);
    event CertificateRevoked(uint256 indexed id);
    event IssuerAdded(address indexed issuerAddress, string name);
    event IssuerRemoved(address indexed issuerAddress);

    // ──────────────────────────────────────────────
    //  Modifiers
    // ──────────────────────────────────────────────

    modifier onlyIssuer() {
        require(_issuers[msg.sender].active, "Not an approved issuer");
        _;
    }

    // ──────────────────────────────────────────────
    //  Constructor
    // ──────────────────────────────────────────────

    constructor() Ownable() {}

    // ──────────────────────────────────────────────
    //  Admin functions
    // ──────────────────────────────────────────────

    function addIssuer(address issuerAddress, string calldata name) external onlyOwner {
        require(issuerAddress != address(0), "Zero address");
        require(bytes(name).length > 0, "Name required");
        require(!_issuers[issuerAddress].active, "Already an issuer");

        _issuers[issuerAddress] = Issuer(name, true);
        emit IssuerAdded(issuerAddress, name);
    }

    function removeIssuer(address issuerAddress) external onlyOwner {
        require(_issuers[issuerAddress].active, "Not an issuer");
        _issuers[issuerAddress].active = false;
        emit IssuerRemoved(issuerAddress);
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // ──────────────────────────────────────────────
    //  Issuer functions
    // ──────────────────────────────────────────────

    function issueCertificate(
        address recipient,
        string calldata title,
        string calldata details,
        string calldata ipfsHash
    ) external whenNotPaused onlyIssuer nonReentrant returns (uint256) {
        require(recipient != address(0), "Zero recipient");
        require(bytes(title).length > 0, "Title required");

        uint256 certId = _nextId++;

        _certificates[certId] = Certificate({
            id: certId,
            issuer: msg.sender,
            recipient: recipient,
            title: title,
            details: details,
            ipfsHash: ipfsHash,
            issuedAt: block.timestamp,
            revoked: false
        });

        _recipientCerts[recipient].push(certId);

        emit CertificateIssued(certId, msg.sender, recipient, title);
        return certId;
    }

    function revokeCertificate(uint256 certId) external nonReentrant {
        Certificate storage cert = _certificates[certId];
        require(cert.issuedAt != 0, "Certificate not found");
        require(cert.issuer == msg.sender, "Not the issuer");
        require(!cert.revoked, "Already revoked");

        cert.revoked = true;
        emit CertificateRevoked(certId);
    }

    // ──────────────────────────────────────────────
    //  View functions
    // ──────────────────────────────────────────────

    function verifyCertificate(uint256 certId) external view returns (
        bool exists,
        bool valid,
        address issuer,
        address recipient,
        string memory title,
        string memory details,
        string memory ipfsHash,
        uint256 issuedAt,
        bool revoked
    ) {
        Certificate storage cert = _certificates[certId];
        exists = cert.issuedAt != 0;
        if (exists) {
            valid = !cert.revoked;
            issuer = cert.issuer;
            recipient = cert.recipient;
            title = cert.title;
            details = cert.details;
            ipfsHash = cert.ipfsHash;
            issuedAt = cert.issuedAt;
            revoked = cert.revoked;
        }
    }

    function getCertificate(uint256 certId) external view returns (Certificate memory) {
        require(_certificates[certId].issuedAt != 0, "Certificate not found");
        return _certificates[certId];
    }

    function getCertificatesByRecipient(address recipient) external view returns (uint256[] memory) {
        return _recipientCerts[recipient];
    }

    function isIssuer(address addr) external view returns (bool) {
        return _issuers[addr].active;
    }

    function getIssuerName(address addr) external view returns (string memory) {
        return _issuers[addr].name;
    }

    function getCertificateCount() external view returns (uint256) {
        return _nextId - 1;
    }
}
