//test if weth balance is larger after arbitrage

require('./helpers/server')
require("dotenv").config();
const config = require("./config.json")

const { getTokenAndContract, getPairContract, calculatePrice, getEstimatedReturn, getReserves, getTokenAndContractSingle, getCurrentGasPrice, getBaseFee } = require('./helpers/helpers')
const { uFactory, uRouter, sFactory, sRouter, web3, arbitrage } = require('./helpers/initialization')

const Big = require('big.js');

const WETH_ADDRESS="0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
const SHIB_ADDRESS="0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE"
const LINK_ADDRESS="0x514910771AF9Ca656af840dff83E8264EcF986CA"
const AXS_ADDRESS="0xBB0E17EF65F82Ab018d8EDd776e8DD940327B28b"


/////////////////////////
//Main
/////////////////////////

const main = async () => {

    const arbAgainst = AXS_ADDRESS

    const sPairConcract = await getPairContract(sFactory, WETH_ADDRESS, arbAgainst)
    const uPairConcract = await getPairContract(uFactory, WETH_ADDRESS, arbAgainst)

    console.log('-----------')
    console.log('Pair contracts')
    console.log(`Uniswap contract   ${uPairConcract._address}`)
    console.log(`Sushiswap contract ${sPairConcract._address}`)
    console.log('-----------')

    const _sPair = sPairConcract
    const _uPair = uPairConcract

    let reserves, exchangeToBuy, exchangeToSell, minReserves

    reservesUNI = await getReserves(_uPair)
    reservesSUSHI = await getReserves(_sPair)

    //Calculate the minimum amount of the ARBagainst because buying more on the exchange with the minimum results in error.
    if (BigInt(reservesUNI[0]) < BigInt(reservesSUSHI[0])) {
    minReserves = reservesUNI[0];
    } else {
    minReserves = reservesSUSHI[0];
    }

    console.log('reserves')
    console.log(`Uniswap reserve   - ${reservesUNI}`)
    console.log(`Sushiswap reserve - ${reservesSUSHI}`)
    console.log(`Minimum reserve   - ${minReserves}`)

    //Correction because reqeuesting exactly 100% of tokens returns an error 
    minReserves = ((BigInt(minReserves)* 99n) / 100n)
    // minReserves = '100000000000000000000'
    console.log(`99% Minimum reserve - ${minReserves}`)
    console.log('-----------')

    console.log('price based on reserves')
    const uPrice = await calculatePrice(_uPair)
    const sPrice = await calculatePrice(_sPair)

    console.log(`Uniswap   ${uPrice}`)
    console.log(`Sushiswap ${sPrice}`)
    console.log('----------')


    console.log('amount(S)in and prices')
    let result = await uRouter.methods.getAmountsIn(minReserves, [WETH_ADDRESS, arbAgainst]).call()
    console.log(`Uniswap amountSin   - ${result}`)
    console.log(`Price - ${Big(result[1]).div(Big(result[0])).toString()}`)

    const token0In = result[0] // WETH
    const token1In = result[1] // SHIB

    
    result = await sRouter.methods.getAmountsIn(minReserves, [WETH_ADDRESS, arbAgainst]).call()
    console.log(`Sushiswap amountSin - ${result}`)
    console.log(`Price - ${Big(result[1]).div(Big(result[0])).toString()}`)

    result = await uRouter.methods.getAmountIn(minReserves, WETH_ADDRESS, arbAgainst).call()
    console.log(`Uniswap amountin    - ${result}`)
    console.log(`Price - ${Big(minReserves).div(Big(result)).toString()}`)

    result = await sRouter.methods.getAmountIn(minReserves, WETH_ADDRESS, arbAgainst).call()
    console.log(`Sushiswap amountin  - ${result}`)
    console.log(`Price - ${Big(minReserves).div(Big(result)).toString()}`)

    

    console.log('----------')

    console.log('amountsout')
    result = await uRouter.methods.getAmountsOut(token1In, [arbAgainst, WETH_ADDRESS]).call()
    console.log(`Uniswap amountSout   - ${result}`)

    result = await sRouter.methods.getAmountsOut(token1In, [arbAgainst, WETH_ADDRESS]).call()
    console.log(`Sushiswap amountSout - ${result}`)

    result = await uRouter.methods.getAmountOut(token1In, arbAgainst, WETH_ADDRESS).call()
    console.log(`Uniswap amountout    - ${result}`)

    result = await sRouter.methods.getAmountOut(token1In, arbAgainst, WETH_ADDRESS).call()
    console.log(`Sushiswap amountout  - ${result}`)
  

    // console.log(`Estimated amount of WETH needed to buy enough other token on ${exchangeToBuy}\t\t| ${web3.utils.fromWei(token0In, 'ether')}`)
    // console.log(`Estimated amount of WETH returned after swapping other token on ${exchangeToSell}\t| ${web3.utils.fromWei(result[1], 'ether')}\n`)

}

    /////////////////////////
    //Custom test requirements
    //////////////////////////

    // require('./scripts/manipulatePrice_SELLSHIB_UNI.js');


    // /////////////////////////
    // //Estimate function
    // //////////////////////////
    // let estimateGas = await web3.eth.estimateGas({
    // "data": contract.methods.executeTrade(true, token0Contract._address, token1Contract._address, 1).encodeABI(),
    // "from": account,
    // "to": contract._address
    // });

    // console.log(estimateGas)

/////////////////////////////////////////
//Test transactions
///////////////////////////////////////


 //    const block = await web3.eth.getBlock("pending");
 //    console.log(block.number)
 //    const estimatedGasCost = block.baseFeePerGas;

 //    console.log(estimatedGasCost)

 //    console.log('000000000000000')

 //    let receipt
 //    let txr 

    // receipt = await web3.eth.getTransactionReceipt("0xf88655059df11e9d072ecfe9238d2f851bf30cf756db08c67cd6b6f252f20cf7")
    // txr = parseInt(receipt.effectiveGasPrice)
    // console.log(txr);

 //    console.log('------------------')

 //    receipt = await web3.eth.getTransactionReceipt("0x4431f783a58ce577928ca404930cee75d3aaddcd7ba66c1a27fa86dfd85dfcba")
 //    txr = parseInt(receipt.effectiveGasPrice)
 //    console.log(txr);

 //    console.log('------------------')

 //    receipt = await web3.eth.getTransactionReceipt("0xc1dff89a41bc0e731862015980785bb04daa658631aa1a4e69dd9ca73a146758")
 //    txr = parseInt(receipt.effectiveGasPrice)
 //    console.log(txr);

    // // console.log('---------------')
    // // console.log(receipt)
    // console.log('!!!!!!!!!!!!!!!')
    // // const balanceAfter = await token0Contract.methods.balanceOf(account).call()
    // // console.log(balanceAfter)


// 0x5c88617bf053600e36141423808dff7db746f358b08745247c9a8324be2d3f5f
// 0x2d2fe7d089dfd148ef5f2875bbfbcaff8f02996f3bdbe9ab4e4e21cce8b4fbab
// 0xd5afdb62ac562c14c8104a00eea761a9fc8706a8c0642b6d8340f91ed1df09ed

/////////////////////////////////////////////////////

// getBaseFee(`wss://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`)
main()