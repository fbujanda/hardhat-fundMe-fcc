const { assert, expect } = require("chai")
const { network, deployments, ethers } = require("hardhat")
const chainId = network.config.chainId

//const { deployments, getNamedAccounts, ethers } = require("hardhat");
//const { assert } = require("chai");
chainId != "31337" /* No correr si es una testnet */
    ? describe.skip
    : describe("FundMe", function() {
          let fundMe
          let mockV3Aggregator
          let deployer
          const sendValue = ethers.utils.parseEther("1")
          console.log(sendValue)
          beforeEach(async function() {
              deployer = (await getNamedAccounts()).deployer
              await deployments.fixture(["all"])
              fundMe = await ethers.getContract("FundMe", deployer)
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              )
          })

          describe("constructor", function() {
              it("sets the aggregator addresses correctly", async () => {
                  const response = await fundMe.getPriceFeed()

                  assert.equal(response, mockV3Aggregator.address)
              })
          })
          describe("fund", () => {
              it("Falla por insuficientes ETH", async () => {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "You need to spend more ETH!"
                  )
              })
              it("Actualizó los datos con la contribución", async () => {
                  await fundMe.fund({ value: sendValue })
                  const response = await fundMe.getAddressToAmountFunded(
                      deployer
                  )
                  console.log(`Wallet de quien despliega: ${deployer}`)
                  assert.equal(response.toString(), sendValue.toString())
              })
              it("Incorpora un contribuy al arreglo de contribuyentes", async () => {
                  await fundMe.fund({ value: sendValue })
                  const response = await fundMe.getAddressToAmountFunded(
                      deployer
                  )
                  const funder = await fundMe.getFunder(0)
                  console.log(`Wallet de quien despliega: ${funder}`)
                  assert.equal(funder, deployer)
              })
          })

          describe("withdraw", () => {
              beforeEach(async () => {
                  await fundMe.fund({ value: sendValue })
              })

              it("withdraw ETH from a single funder", async () => {
                  const startingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const startingDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  )
                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)

                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  )

                  assert.equal(endingFundMeBalance, 0)
                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  )
              })
              it("Retiro cuando hay múltiples contribuyentes", async () => {
                  const accounts = await ethers.getSigners()
                  const startingDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  )
                  for (let i = 1; i < 2; i++) {
                      const fundMeConnectecContract = await fundMe.connect(
                          accounts[i]
                      )

                      await fundMeConnectecContract.fund({ value: sendValue })
                      //console.log(fundMeConnectecContract)
                  }
                  const startingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )

                  // mismo qu la anterior
                  const transactionResponse = await fundMe.withdraw()
                  const transactionReceipt = await transactionResponse.wait(1)

                  const { gasUsed, effectiveGasPrice } = transactionReceipt
                  const gasCost = gasUsed.mul(effectiveGasPrice)
                  // Prueba
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  )
                  const endingDeployerBalance = await fundMe.provider.getBalance(
                      deployer
                  )

                  assert.equal(endingFundMeBalance, 0)

                  assert.equal(
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString(),
                      endingDeployerBalance.add(gasCost).toString()
                  )
                  // Prueba que Cuentas de contribuyentes sean llevadas a cero
                  await expect(fundMe.getFunder(0)).to.be.reverted
                  for (i = 1; i < 6; i++) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      )
                  }
              })
              it("Solo el propietario puede retirar", async () => {
                  const accounts = await ethers.getSigners()
                  const attacker = accounts[1]
                  const attackrConnectedContract = await fundMe.connect(
                      attacker
                  )

                  await expect(
                      attackrConnectedContract.withdraw()
                  ).to.be.revertedWith("FundMe__NotOwner")
              })
          })
      })
