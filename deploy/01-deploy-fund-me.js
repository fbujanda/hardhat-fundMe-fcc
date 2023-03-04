//getNamedAccounts y deployments son modulos o variables objeto de hre : hardhat runtime environment
// que básicamente es hardhat
const { network } = require("hardhat")
const { networkConfig } = require("../helper-hardhat-config")
const { verify } = require("../utils/verify")

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const chainId = network.config.chainId
    console.log(chainId)
    let ethUsdPriceFeedAdrress
    if (chainId == 31337) {
        const ethUsdAggregator = await deployments.get("MockV3Aggregator")
        ethUsdPriceFeedAdrress = ethUsdAggregator.address
    } else {
        ethUsdPriceFeedAdrress = networkConfig[chainId]["ethUsdPriceFeed"]
    }

    // Qué pasa si quiero emplearla network de default o lalocalhost o en otra red testnet? solución
    // usar mock. Lo que ocurre es que con priceConverter el original existe una dirección real dentro
    // del  código relacionada con rinkeby. Cuando se despliega local eso no tiene sentido. Hay que
    //parmetrizar esa dirección
    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: [ethUsdPriceFeedAdrress],
        log: true,
        // we need to wait if on a live network so we can verify properly
        waitConfirmations: network.config.blockConfirmations || 1
    })
    log(`FundMe deployed at ${fundMe.address}`)

    if (chainId != 31337 && process.env.ETHERSCAN_API_KEY) {
        await verify(fundMe.address, [ethUsdPriceFeedAdrress])
        log("------------------------------------")
    }
}

module.exports.tags = ["all", "fundme"]
