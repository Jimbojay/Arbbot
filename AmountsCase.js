//test if weth balance is larger after arbitrage

require('./helpers/server')
require("dotenv").config();
const config = require("./config.json")

const { getTokenAndContract, getPairContract, calculatePrice, getEstimatedReturn, getReserves } = require('./helpers/helpers')
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

}

main()