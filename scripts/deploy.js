const hre = require("hardhat");

async function main() {
  const network = hre.network.name;
  console.log(`\nDeploying BOTCertificates to ${network}...\n`);

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer:", deployer.address);

  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Balance:", hre.ethers.formatEther(balance), "BOT\n");

  const BOTCertificates = await hre.ethers.getContractFactory("BOTCertificates");
  const contract = await BOTCertificates.deploy();
  await contract.waitForDeployment();

  const address = await contract.getAddress();
  const explorer =
    network === "botchain"
      ? "https://scan.botchain.ai"
      : "https://scan.bohr.life";

  console.log("-------------------------------------------");
  console.log("BOTCertificates deployed!");
  console.log("Address:", address);
  console.log("Explorer:", `${explorer}/address/${address}`);
  console.log("-------------------------------------------");
  console.log("\nUpdate CONTRACT_ADDRESS in frontend/index.html with the address above.\n");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
