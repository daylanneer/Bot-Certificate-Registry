const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("BOTCertificates", function () {
  let contract, owner, issuer, recipient, other;

  beforeEach(async () => {
    [owner, issuer, recipient, other] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("BOTCertificates");
    contract = await Factory.deploy();
    await contract.waitForDeployment();
  });

  // ── Issuer management ──

  it("should allow owner to add an issuer", async () => {
    await expect(contract.addIssuer(issuer.address, "University A"))
      .to.emit(contract, "IssuerAdded")
      .withArgs(issuer.address, "University A");
    expect(await contract.isIssuer(issuer.address)).to.be.true;
    expect(await contract.getIssuerName(issuer.address)).to.equal("University A");
  });

  it("should reject adding issuer from non-owner", async () => {
    await expect(
      contract.connect(other).addIssuer(issuer.address, "X")
    ).to.be.revertedWith("Ownable: caller is not the owner");
  });

  it("should allow owner to remove an issuer", async () => {
    await contract.addIssuer(issuer.address, "Uni");
    await expect(contract.removeIssuer(issuer.address))
      .to.emit(contract, "IssuerRemoved")
      .withArgs(issuer.address);
    expect(await contract.isIssuer(issuer.address)).to.be.false;
  });

  // ── Certificate issuance ──

  it("should let approved issuer issue a certificate", async () => {
    await contract.addIssuer(issuer.address, "Uni");
    const tx = await contract
      .connect(issuer)
      .issueCertificate(recipient.address, "Blockchain 101", "Completed course", "QmHash123");

    await expect(tx)
      .to.emit(contract, "CertificateIssued")
      .withArgs(1, issuer.address, recipient.address, "Blockchain 101");

    expect(await contract.getCertificateCount()).to.equal(1);
  });

  it("should reject certificate issuance from non-issuer", async () => {
    await expect(
      contract.connect(other).issueCertificate(recipient.address, "T", "D", "H")
    ).to.be.revertedWith("Not an approved issuer");
  });

  // ── Verification ──

  it("should verify a valid certificate", async () => {
    await contract.addIssuer(issuer.address, "Uni");
    await contract.connect(issuer).issueCertificate(recipient.address, "Title", "Details", "Hash");

    const v = await contract.verifyCertificate(1);
    expect(v.exists).to.be.true;
    expect(v.valid).to.be.true;
    expect(v.title).to.equal("Title");
    expect(v.recipient).to.equal(recipient.address);
  });

  // ── Revocation ──

  it("should allow issuer to revoke their certificate", async () => {
    await contract.addIssuer(issuer.address, "Uni");
    await contract.connect(issuer).issueCertificate(recipient.address, "T", "D", "H");
    await expect(contract.connect(issuer).revokeCertificate(1))
      .to.emit(contract, "CertificateRevoked")
      .withArgs(1);

    const v = await contract.verifyCertificate(1);
    expect(v.valid).to.be.false;
    expect(v.revoked).to.be.true;
  });

  it("should reject revocation from non-issuer", async () => {
    await contract.addIssuer(issuer.address, "Uni");
    await contract.connect(issuer).issueCertificate(recipient.address, "T", "D", "H");
    await expect(
      contract.connect(other).revokeCertificate(1)
    ).to.be.revertedWith("Not the issuer");
  });

  // ── Recipient lookup ──

  it("should track certificates by recipient", async () => {
    await contract.addIssuer(issuer.address, "Uni");
    await contract.connect(issuer).issueCertificate(recipient.address, "A", "D", "H1");
    await contract.connect(issuer).issueCertificate(recipient.address, "B", "D", "H2");
    await contract.connect(issuer).issueCertificate(other.address, "C", "D", "H3");

    const ids = await contract.getCertificatesByRecipient(recipient.address);
    expect(ids.length).to.equal(2);
    expect(ids[0]).to.equal(1);
    expect(ids[1]).to.equal(2);
  });

  // ── Pause ──

  it("should prevent issuance when paused", async () => {
    await contract.addIssuer(issuer.address, "Uni");
    await contract.pause();
    await expect(
      contract.connect(issuer).issueCertificate(recipient.address, "T", "D", "H")
    ).to.be.revertedWith("Pausable: paused");
  });

  // ── Edge cases ──

  it("should return exists=false for non-existent certificate", async () => {
    const v = await contract.verifyCertificate(999);
    expect(v.exists).to.be.false;
    expect(v.valid).to.be.false;
  });

  it("should reject zero address recipient", async () => {
    await contract.addIssuer(issuer.address, "Uni");
    await expect(
      contract.connect(issuer).issueCertificate(ethers.ZeroAddress, "T", "D", "H")
    ).to.be.revertedWith("Zero recipient");
  });
});
