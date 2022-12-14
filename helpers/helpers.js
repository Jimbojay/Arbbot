require("dotenv").config();
const config = require("../config.json")

const Big = require('big.js');
const Web3 = require('web3');
let web3, chain

// if (!config.PROJECT_SETTINGS.isLocal) {
//     web3 = new Web3(`wss://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`)
// } else {
//     web3 = new Web3('ws://127.0.0.1:7545')
// }


if (config.PROJECT_SETTINGS.networkConfig === "main") {
    web3 = new Web3(`wss://eth-mainnet.alchemyapi.io/v2/${process.env.ALCHEMY_API_KEY}`)
    chain = "MAINNET"
} else if (config.PROJECT_SETTINGS.networkConfig === "test") {
    web3 = new Web3('ws://127.0.0.1:7545')
    chain = "MAINNET"
} else if  (config.PROJECT_SETTINGS.networkConfig === "kovan") {
    web3 = new Web3(`wss://kovan.infura.io/ws/v3/${process.env.INFURA_API_KEY}`)
    chain = "KOVAN"
}

const { ChainId, Token } = require("@uniswap/sdk")
const IUniswapV2Pair = require("@uniswap/v2-core/build/IUniswapV2Pair.json")
const IERC20 = require('@openzeppelin/contracts/build/contracts/ERC20.json')

async function getTokenAndContract(_token0Address, _token1Address) {
    const token0Contract = new web3.eth.Contract(IERC20.abi, _token0Address)
    const token1Contract = new web3.eth.Contract(IERC20.abi, _token1Address)


    const token0 = new Token(
        ChainId.chain,
        _token0Address,
        18,
        await token0Contract.methods.symbol().call(),
        await token0Contract.methods.name().call()
    )

    const token1 = new Token(
        ChainId.chain,
        _token1Address,
        18,
        await token1Contract.methods.symbol().call(),
        await token1Contract.methods.name().call()
    )

    return { token0Contract, token1Contract, token0, token1 }
}

async function getPairAddress(_V2Factory, _token0, _token1) {
    const pairAddress = await _V2Factory.methods.getPair(_token0, _token1).call()
    // console.log('TTTTTTTTTTTTTTTTTT')
    // console.log(_V2Factory._address)
    // console.log(_token0)
    // console.log(_token1)
    // console.log('****************')
    // console.log(pairAddress)
    // console.log('****************')
    return pairAddress
}

async function getPairContract(_V2Factory, _token0, _token1) {
    // console.log('TTTTTTTTTTTTTTTTTT')
    // console.log('88888888888888888888')
    // console.log(_V2Factory._address)
    // console.log(_token0)
    // console.log(_token1)
    // // console.log('???????????????????')
    // console.log('88888888888888888888')
    const pairAddress = await getPairAddress(_V2Factory, _token0, _token1)
    // console.log('LLLLLLLLLLLLL')
    // console.log(pairAddress)
    // console.log('LLLLLLLLLLLLL')
    const pairContract = new web3.eth.Contract(IUniswapV2Pair.abi, pairAddress)
    // console.log('KKKKKKKKKK')
    // console.log(pairContract)
    // console.log('KKKKKKKKKK')
    return pairContract
}

async function getReserves(_pairContract) {
    const reserves = await _pairContract.methods.getReserves().call()
    // console.log('!?!?!?!?!?!?!?!')
    // console.log(reserves)
    // console.log('!?!?!?!?!?!?!?!')
    // console.log(reserves.reserve0)
    // console.log('!?!?!?!?!?!?!?!')
    // console.log(reserves.reserve1)
    // console.log('!?!?!?!?!?!?!?!')
    return [reserves.reserve0, reserves.reserve1]
}

async function calculatePrice(_pairContract) {
    const [reserve0, reserve1] = await getReserves(_pairContract)
    return Big(reserve0).div(Big(reserve1)).toString()
}

function calculateDifference(uPrice, sPrice) {
    return (((uPrice - sPrice) / sPrice) * 100).toFixed(2)
}

async function getEstimatedReturn(amount, _routerPath, _token0, _token1) {
    const trade1 = await _routerPath[0].methods.getAmountsOut(amount, [_token0.address, _token1.address]).call()
    const trade2 = await _routerPath[1].methods.getAmountsOut(trade1[1], [_token1.address, _token0.address]).call()

    const amountIn = Number(web3.utils.fromWei(trade1[0], 'ether'))
    const amountOut = Number(web3.utils.fromWei(trade2[1], 'ether'))
    // const amountIn = trade1[0]
    // const amountOut = trade2[1]

    return { amountIn, amountOut }
}

async function getTokenAndContractSingle(_tokenAddress, chainId) {
    const tokenContract = new web3.eth.Contract(IERC20.abi, _tokenAddress)

    const token = new Token(
        ChainId.chain,
        _tokenAddress,
        18,
        await tokenContract.methods.symbol().call(),
        await tokenContract.methods.name().call()
    )

    return { tokenContract, token }
}

async function getBaseFee(URL = 'ws://127.0.0.1:7545') {

    // var _web3 = new Web3(URL)    

    // NOTE: Property 'baseFeePerGas' does not exist on type 'BlockTransactionString'
    const block = await web3.eth.getBlock("pending");
    console.log('**************')
    console.log(block.number)
    console.log('**************')
    const estimatedGasCost = block.baseFeePerGas;

    return estimatedGasCost
}

module.exports = {
    getTokenAndContract,
    getPairAddress,
    getPairContract,
    getReserves,
    calculatePrice,
    calculateDifference,
    getEstimatedReturn,
    getTokenAndContractSingle,
    getBaseFee
}