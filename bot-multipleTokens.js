// -- HANDLE INITIAL SETUP -- //

require('./helpers/server')
require("dotenv").config();
const ethers = require('ethers');

const { WETH_ADDRESS, SHIB_ADDRESS, LINK_ADDRESS, MATIC_ADDRESS, LEO_ADDRESS, CRO_ADDRESS, APE_ADDRESS, SAND_ADDRESS, MANA_ADDRESS, AXS_ADDRESS, AAVE_ADDRESS, USDC_ADDRESS, WETH_ADDRESS_KOVAN, SHIB_ADDRESS_KOVAN, LINK_ADDRESS_KOVAN, MAXPRIORITYFEE, UNITS, PRICE_DIFFERENCE, GAS_PRICE, GAS_LIMIT } = require('./helpers/variables');

const Big = require('big.js');
const config = require('./config.json')
const { getTokenAndContract, getPairContract, calculatePrice, getEstimatedReturn, getReserves, getTokenAndContractSingle, getCurrentGasPrice, getBaseFee } = require('./helpers/helpers')
const { uFactory, uRouter, sFactory, sRouter, web3, arbitrage } = require('./helpers/initialization')

///////////////
const { performance } = require('perf_hooks');

//////////////////////
const TelegramBot = require('node-telegram-bot-api');

const botToken = process.env.BOT_TOKEN // This is the address of token we are attempting to arbitrage (WETH)
const chatID = process.env.CHATID // This is the address of token we are attempting to arbitrage (WETH)


// const BOT_TOKEN='5374386214:AAG0ow4m8EvmkDhtbE1TQfMp08wpasWOWtI'
// const CHATID=1018695738

// replace the value below with the Telegram token you receive from @BotFather
// const token = BOT_TOKEN;
// // read the doc from https://github.com/yagop/node-telegram-bot-api to know how to catch the chatId
// const chatId = CHATID;
const bot = new TelegramBot(botToken, { polling: false })
////////////////////


// -- .ENV VALUES HERE -- //

// const arbForWETH = process.env.WETH_ADDRESS // This is the address of token we are attempting to arbitrage (WETH)
// const arbAgainstSHIB = process.env.SHIB_ADDRESS // SHIB
// const arbAgainstLINK = process.env.LINK_ADDRESS // LINK
// const arbAgainstMATIC = process.env.MATIC_ADDRESS // LINK
// const arbAgainstLEO = process.env.LEO_ADDRESS // LINK
// const arbAgainstCRO = process.env.CRO_ADDRESS // LINK
// const arbAgainstAPE = process.env.APE_ADDRESS // LINK
// const arbAgainstSAND = process.env.SAND_ADDRESS // LINK
// const arbAgainstMANA = process.env.MANA_ADDRESS // LINK
// const arbAgainstAXS = process.env.AXS_ADDRESS // LINK
// const arbAgainstAAVE = process.env.AAVE_ADDRESS // LINK
// const arbAgainstUSDC = process.env.USDC_ADDRESS

// const arbForWETHKovan = process.env.WETH_ADDRESS_KOVAN // This is the address of token we are attempting to arbitrage (WETH)
// const arbAgainstSHIBKovan = process.env.SHIB_ADDRESS_KOVAN // SHIB
// const arbAgainstLINKKovan = process.env.LINK_ADDRESS_KOVAN // LINK

const arbForWETH = WETH_ADDRESS // This is the address of token we are attempting to arbitrage (WETH)
const arbAgainstSHIB = SHIB_ADDRESS // SHIB
const arbAgainstLINK = LINK_ADDRESS // LINK
const arbAgainstMATIC = MATIC_ADDRESS // LINK
const arbAgainstLEO = LEO_ADDRESS // LINK
const arbAgainstCRO = CRO_ADDRESS // LINK
const arbAgainstAPE = APE_ADDRESS // LINK
const arbAgainstSAND = SAND_ADDRESS // LINK
const arbAgainstMANA = MANA_ADDRESS // LINK
const arbAgainstAXS = AXS_ADDRESS // LINK
const arbAgainstAAVE = AAVE_ADDRESS // LINK
const arbAgainstUSDC = USDC_ADDRESS

const arbForWETHKovan = WETH_ADDRESS_KOVAN // This is the address of token we are attempting to arbitrage (WETH)
const arbAgainstSHIBKovan = SHIB_ADDRESS_KOVAN // SHIB
const arbAgainstLINKKovan = LINK_ADDRESS_KOVAN // LINK

const infuraApiKey = process.env.INFURA_API_KEY
const account = process.env.ACCOUNT // Account to recieve profit

const maxPriorityFee= MAXPRIORITYFEE
const units = UNITS // Used for price display/reporting
const difference = PRICE_DIFFERENCE
const gas = GAS_LIMIT
const estimatedGasCost = GAS_PRICE // Estimated Gas: 0.008453220000006144 ETH + ~10%

let uPair, sPair, amount
let isExecuting = false

let outputTelegram
let startTime
let arbFor

const main = async () => {

    //Create array of arbAgainst
    const arbAgainstTokens = []

    if (config.PROJECT_SETTINGS.networkConfig === "main" || config.PROJECT_SETTINGS.networkConfig === "test") {
        arbFor = arbForWETH

        arbAgainstTokens.push(arbAgainstSHIB)
        arbAgainstTokens.push(arbAgainstLINK)
        arbAgainstTokens.push(arbAgainstMATIC)
        arbAgainstTokens.push(arbAgainstLEO)
        arbAgainstTokens.push(arbAgainstCRO)
        arbAgainstTokens.push(arbAgainstAPE)
        arbAgainstTokens.push(arbAgainstSAND)
        arbAgainstTokens.push(arbAgainstMANA)
        arbAgainstTokens.push(arbAgainstAXS)
        arbAgainstTokens.push(arbAgainstAAVE)
        arbAgainstTokens.push(arbAgainstUSDC)

    } else if  (config.PROJECT_SETTINGS.networkConfig === "kovan") {
        arbFor = arbForWETHKovan

        arbAgainstTokens.push(arbAgainstSHIBKovan)
        arbAgainstTokens.push(arbAgainstLINKKovan)
    }

    //Create array of arbAgainst names
    // const arbAgainstTokenNames = []
    // arbAgainstTokenNames.push('SHIB')
    // arbAgainstTokenNames.push('LINK')

    const _arbAgainstTokens = []
    // const _arbAgainstTokenNames = []
    const _token0Contracts = []
    const _token1Contracts = []     
    const _token0s = []
    const _token1s = []

    const _uPairConcracts = []
    const _sPairConcracts = []

    console.log('?!?!?!?!?')

    const { tokenContract, token } = await getTokenAndContractSingle(arbFor)

    console.log('?!?!?!?!?')

    const token0 = token
    const token0Contract = tokenContract


    for (let i=0; i < arbAgainstTokens.length; i++) {
        const arbAgainst = arbAgainstTokens[i]
        // const { token0Contract, token1Contract, token0, token1 } = await getTokenAndContract(arbFor, arbAgainst)
        const { tokenContract, token } = await getTokenAndContractSingle(arbAgainst)

        const token1 = token
        const token1Contract = tokenContract
   
        uPairConcract = await getPairContract(uFactory, token0.address, token1.address)
        sPairConcract = await getPairContract(sFactory, token0.address, token1.address)

        // console.log(uFactory._address)
        // console.log(sFactory._address)
        // console.log(token0.address)
        // console.log(token1.address)
        // console.log('********************8')
        // console.log(uPairConcract._address)
        // console.log('********************8')
        // console.log(sPairConcract._address)
        // console.log('********************8')

        // _token0Contracts.push(token0Contract)
        _token1Contracts.push(token1Contract)
        // _token0s.push(token0)
        _token1s.push(token1)

        _uPairConcracts.push(uPairConcract)
        _sPairConcracts.push(sPairConcract)


        _arbAgainstTokens.push(arbAgainstTokens[i])
        // _arbAgainstTokenNames.push(arbAgainstTokenNames[i])
        
        // console.log(arbAgainstTokens[i])
        console.log(token1.symbol)
    }

    bot.sendMessage(chatID, 'Script started...')

    for (let i=0; i < _uPairConcracts.length; i++) {

        _uPairConcracts[i].events.Swap({}, async () => {
            if (!isExecuting) {
                isExecuting = true

                const priceDifference = await checkPrice('Uniswap', token0, _token1s[i], _uPairConcracts[i], _sPairConcracts[i])
                const routerPath = await determineDirection(priceDifference)

                if (!routerPath) {
                    console.log(`No Arbitrage Currently Available\n`)
                    console.log(`-----------------------------------------\n`)
                    isExecuting = false
                    return
                }

                const isProfitable = await determineProfitability(routerPath, token0Contract, token0, _token1s[i], _uPairConcracts[i], _sPairConcracts[i])

                if (!isProfitable) {
                    console.log(`No Arbitrage Currently Available\n`)
                    console.log(`-----------------------------------------\n`)
                    isExecuting = false
                    return
                }

                const receipt = await executeTrade(routerPath, token0Contract, _token1Contracts[i])

                isExecuting = false
            }
        })

        _sPairConcracts[i].events.Swap({}, async () => {
            if (!isExecuting) {
                isExecuting = true

                const priceDifference = await checkPrice('Sushiswap', token0, _token1s[i], _uPairConcracts[i], _sPairConcracts[i])
                const routerPath = await determineDirection(priceDifference)

                if (!routerPath) {
                    console.log(`No Arbitrage Currently Available\n`)
                    console.log(`-----------------------------------------\n`)
                    outputTelegram = 'No Arbitrage Currently Available - Pricedifference'
                    bot.sendMessage(chatID, outputTelegram)
                    
                    isExecuting = false
                    return
                }

                const isProfitable = await determineProfitability(routerPath, token0Contract, token0, _token1s[i], _uPairConcracts[i], _sPairConcracts[i])

                if (!isProfitable) {
                    console.log(`No Arbitrage Currently Available\n`)
                    console.log(`-----------------------------------------\n`)
                    outputTelegram = 'No Arbitrage Currently Available - Profitability'
                    bot.sendMessage(chatID, outputTelegram)

                    isExecuting = false
                    return
                }

                const receipt = await executeTrade(routerPath, token0Contract, _token1Contracts[i])

                isExecuting = false
            }
        })
    }

    console.log("Waiting for swap event...")

    // require('./scripts/manipulatePrice_SELLSHIB_UNI.js');
    // startTime = performance.now();

}

const checkPrice = async (exchange, token0, token1, _uPair, _sPair) => {

    isExecuting = true

    console.log(`Swap Initiated for ${token1.symbol}/${token0.symbol} on ${exchange}, Checking Price...\n`)

    let exchange2 

    if (exchange = 'Uniswap') {
    exchange2 = 'Sushiswap' 
    } else {
    exchange2 = 'Uniswap' 
    }

    const currentBlock = await web3.eth.getBlockNumber()

    const uPrice = await calculatePrice(_uPair)
    const sPrice = await calculatePrice(_sPair)

    const uFPrice = Number(uPrice).toFixed(units)
    const sFPrice = Number(sPrice).toFixed(units)
    const priceDifference = (((uFPrice - sFPrice) / sFPrice) * 100).toFixed(2)

    console.log(`Current Block: ${currentBlock}`)
    console.log(`-----------------------------------------`)
    console.log(`UNISWAP   | ${token1.symbol}/${token0.symbol}\t | ${uFPrice}`)
    console.log(`SUSHISWAP | ${token1.symbol}/${token0.symbol}\t | ${sFPrice}\n`)
    console.log(`Percentage Difference: ${priceDifference}%\n`)

    return priceDifference
}

const determineDirection = async (priceDifference) => {
    console.log(`Determining Direction...\n`)

    if (priceDifference >= difference) {

        console.log(`Potential Arbitrage Direction:\n`)
        console.log(`Buy\t -->\t Uniswap`)
        console.log(`Sell\t -->\t Sushiswap\n`)
        return [uRouter, sRouter]

    } else if (priceDifference <= -(difference)) {

        console.log(`Potential Arbitrage Direction:\n`)
        console.log(`Buy\t -->\t Sushiswap`)
        console.log(`Sell\t -->\t Uniswap\n`)
        return [sRouter, uRouter]

    } else {

        return null
    }
}

const determineProfitability = async (_routerPath, _token0Contract, _token0, _token1, _uPair, _sPair) => {
    console.log(`Determining Profitability...\n`)

    // This is where you can customize your conditions on whether a profitable trade is possible.
    // This is a basic example of trading WETH/SHIB...

    let reserves, exchangeToBuy, exchangeToSell, reservesBuy

    if (_routerPath[0]._address == uRouter._address) {
        reserves = await getReserves(_sPair)
        reservesBuy = await getReserves(_uPair)
        exchangeToBuy = 'Uniswap'
        exchangeToSell = 'Sushiswap'
    } else {
        reserves = await getReserves(_uPair)
        reservesBuy = await getReserves(_sPair)
        exchangeToBuy = 'Sushiswap'
        exchangeToSell = 'Uniswap'
    }

    console.log(`Reserves on ${exchangeToBuy}`)
    console.log(`${_token1.symbol}: ${web3.utils.fromWei(reservesBuy[0].toString(), 'ether')}`)
    console.log(`${_token0.symbol}: ${web3.utils.fromWei(reservesBuy[1].toString(), 'ether')}\n`)

    console.log(`Reserves on ${exchangeToSell}`)
    console.log(`${_token1.symbol}: ${web3.utils.fromWei(reserves[0].toString(), 'ether')}`)
    console.log(`${_token0.symbol}: ${web3.utils.fromWei(reserves[1].toString(), 'ether')}\n`)

    try {

        let minReserves
        // This returns the amount of WETH needed

        // const minReserves = ethers.utils.parseUnits(Math.min(reservesBuy[0], reserves[0]).toString(),18).toString()
        // console.log(minReserves)

        if (reserves[0] < reservesBuy[0]) {
        minReserves = reserves[0];
        } else {
        minReserves = reservesBuy[0];
        }

        // ethers.utils.parseUnits("1.0", 8).toString()

        let result = await _routerPath[0].methods.getAmountsIn(minReserves, [_token0.address, _token1.address]).call()

        console.log('1111111111111111111111')
        const token0In = result[0] // WETH
        const token1In = result[1] // SHIB
        console.log('22222222222222')

        result = await _routerPath[1].methods.getAmountsOut(token1In, [_token1.address, _token0.address]).call()

        console.log('333333333333')

        console.log(`Estimated amount of WETH needed to buy enough ${_token1.symbol} on ${exchangeToBuy}\t\t| ${web3.utils.fromWei(token0In, 'ether')}`)
        console.log(`Estimated amount of WETH returned after swapping ${_token1.symbol} on ${exchangeToSell}\t| ${web3.utils.fromWei(result[1], 'ether')}\n`)

        const { amountIn, amountOut } = await getEstimatedReturn(token0In, _routerPath, _token0, _token1)


        let ethBalanceBefore = await web3.eth.getBalance(account)
        ethBalanceBefore = web3.utils.fromWei(ethBalanceBefore, 'ether')


        const gasPriceEstimation = await getBaseFee()
        const maxGasFee = ((2 * Number(gasPriceEstimation)) + Number(maxPriorityFee)) //gasprice fluctuates heavily and therefor markup of 100%
        const totalGasFees = web3.utils.fromWei(( maxGasFee * gas).toString(), 'ether') // get total gas fee by multiplying the price per gas with the amount of gas

        console.log(gasPriceEstimation)
        console.log(maxPriorityFee)
        console.log(maxGasFee)

        const ethBalanceAfter = ethBalanceBefore - totalGasFees

        const amountDifference = amountOut - amountIn
        let wethBalanceBefore = await _token0Contract.methods.balanceOf(account).call()
        wethBalanceBefore = web3.utils.fromWei(wethBalanceBefore, 'ether')

        const wethBalanceAfter = amountDifference + Number(wethBalanceBefore)
        const wethBalanceDifference = wethBalanceAfter - Number(wethBalanceBefore)

        const totalGained = wethBalanceDifference - Number(totalGasFees)


        const data = {
            'ETH Balance Before': ethBalanceBefore,
            'ETH Balance After': ethBalanceAfter,
            'ETH Spent (gas no fees)': totalGasFees,
            '-': {},
            'WETH Balance BEFORE': wethBalanceBefore,
            'WETH Balance AFTER': wethBalanceAfter,
            'WETH Gained/Lost': wethBalanceDifference,
            '-': {},
            'Total Gained/Lost': totalGained
        }

        console.table(data)
        console.log()

        if (amountOut < (amountIn - totalGained)) {
            return false
        }

        amount = token0In
        return true

    } catch (error) {
        console.log(error)
        console.log(`\nError occured while trying to determine profitability...\n`)
        console.log(`This can typically happen because an issue with reserves, see README for more information.\n`)
        return false
    }
}

const executeTrade = async (_routerPath, _token0Contract, _token1Contract) => {

    console.log(`Attempting Arbitrage...\n`)

    let startOnUniswap

    if (_routerPath[0]._address == uRouter._address) {
        startOnUniswap = true
    } else {
        startOnUniswap = false
    }

    // Fetch token balance before
    const balanceBefore = await _token0Contract.methods.balanceOf(account).call()
    const ethBalanceBefore = await web3.eth.getBalance(account)



    console.log('!?!?!?!!?!?!?!?')
    console.log(amount)
    console.log('!?!?!?!!?!?!?!?')

    if (config.PROJECT_SETTINGS.isDeployed) {
        await arbitrage.methods.executeTrade(startOnUniswap, _token0Contract._address, _token1Contract._address, amount).send({ from: account, gas: gas})
    }


    // const block33 = await web3.eth.getBlock("pending");
    // const estimatedGasCost3 = block33.baseFeePerGas;

    // console.log(estimatedGasCost3)
    // console.log('@@@@@@@@@@@@@@@@')

    console.log(`Trade Complete:\n`)

    // const duration = performance.now() - startTime;
    // console.log(`Call to doSomething took ${duration} milliseconds`)

    // Fetch token balance after
    const balanceAfter = await _token0Contract.methods.balanceOf(account).call()
    const ethBalanceAfter = await web3.eth.getBalance(account)

    const balanceDifference = balanceAfter - balanceBefore
    const totalSpent = ethBalanceBefore - ethBalanceAfter

    const gasSpent = (ethBalanceBefore - ethBalanceAfter)
    // console.log(gasSpent)

    const data = {
        'ETH Balance Before': web3.utils.fromWei(ethBalanceBefore, 'ether'),
        'ETH Balance After': web3.utils.fromWei(ethBalanceAfter, 'ether'),
        'ETH Spent (gas)': web3.utils.fromWei(gasSpent.toString(), 'ether'),
        '-': {},
        'WETH Balance BEFORE': web3.utils.fromWei(balanceBefore.toString(), 'ether'),
        'WETH Balance AFTER': web3.utils.fromWei(balanceAfter.toString(), 'ether'),
        'WETH Gained/Lost': web3.utils.fromWei(balanceDifference.toString(), 'ether'),
        '-': {},
        'Total Gained/Lost': `${web3.utils.fromWei((balanceDifference - totalSpent).toString(), 'ether')} ETH`
    }

    console.table(data)




    outputTelegram = 'Total Gained/Lost ' + `${web3.utils.fromWei((balanceDifference - totalSpent).toString(), 'ether')} ETH`

    bot.sendMessage(chatID, outputTelegram)

}

main()
