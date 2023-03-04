const { getNamedAccounts, ethers } = require("hardhat")
const { assert, expect } = require("chai")
const chainId = network.config.chainId

chainId == "31337" /* Correr solo si es una testnet  */
    ? describe.skip
    : describe("FundMe", async () => {
          let FundMe
          let deployer
          const sendValue = ethers.utils.parseEther("1")
          beforeEach(async () => {
              deployer = await getNamedAccounts().deployer
              fundMe = await ethers.getContract("FundMe", deployer)
          })
          it("allows people to fund and withdraw", async () => {
              await fundMe.fund({ value: sendValue })
              await fundMe.withdraw()
              const endingBalance = await fundMe.provider.getBalance(
                  fundMe.address
              )
              assert.equal(endingBalance.toString(), "0")
          })
      })
