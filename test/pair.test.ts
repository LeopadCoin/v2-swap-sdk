import { ChainId, Token, Pair, TokenAmount, WETH, Price } from '../src'
import JSBI from 'jsbi'

const BasicPair = (a: TokenAmount, b: TokenAmount): Pair => {
  return new Pair(a, b, false, 30, 1, 1)
}

describe('Pair', () => {
  const USDC = new Token(ChainId.MAINNET, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', 18, 'USDC', 'USD Coin')
  const DAI = new Token(ChainId.MAINNET, '0x6B175474E89094C44Da98b954EedeAC495271d0F', 18, 'DAI', 'DAI Stablecoin')

  describe('constructor', () => {
    it('cannot be used for tokens on different chains', () => {
      expect(() => BasicPair(new TokenAmount(USDC, '100'), new TokenAmount(WETH[ChainId.BSCTESTNET], '100'))).toThrow(
        'CHAIN_IDS'
      )
    })
  })

  describe('#getAddress', () => {
    it('returns the correct address', () => {
      expect(Pair.getAddress(USDC, DAI)).toEqual('0xcA069B7AC1B9759D5f0547aa550c9c51d71D36d1')
    })
  })

  describe('#token0', () => {
    it('always is the token that sorts before', () => {
      expect(BasicPair(new TokenAmount(USDC, '100'), new TokenAmount(DAI, '100')).token0).toEqual(DAI)
      expect(BasicPair(new TokenAmount(DAI, '100'), new TokenAmount(USDC, '100')).token0).toEqual(DAI)
    })
  })
  describe('#token1', () => {
    it('always is the token that sorts after', () => {
      expect(BasicPair(new TokenAmount(USDC, '100'), new TokenAmount(DAI, '100')).token1).toEqual(USDC)
      expect(BasicPair(new TokenAmount(DAI, '100'), new TokenAmount(USDC, '100')).token1).toEqual(USDC)
    })
  })
  describe('#reserve0', () => {
    it('always comes from the token that sorts before', () => {
      expect(BasicPair(new TokenAmount(USDC, '100'), new TokenAmount(DAI, '101')).reserve0).toEqual(
        new TokenAmount(DAI, '101')
      )
      expect(BasicPair(new TokenAmount(DAI, '101'), new TokenAmount(USDC, '100')).reserve0).toEqual(
        new TokenAmount(DAI, '101')
      )
    })
  })
  describe('#reserve1', () => {
    it('always comes from the token that sorts after', () => {
      expect(BasicPair(new TokenAmount(USDC, '100'), new TokenAmount(DAI, '101')).reserve1).toEqual(
        new TokenAmount(USDC, '100')
      )
      expect(BasicPair(new TokenAmount(DAI, '101'), new TokenAmount(USDC, '100')).reserve1).toEqual(
        new TokenAmount(USDC, '100')
      )
    })
  })

  describe('uniswap #token0Price', () => {
    it('returns price of token0 in terms of token1', () => {
      expect(BasicPair(new TokenAmount(USDC, '101'), new TokenAmount(DAI, '100')).token0Price).toEqual(
        new Price(DAI, USDC, '100', '101')
      )
      expect(BasicPair(new TokenAmount(DAI, '100'), new TokenAmount(USDC, '101')).token0Price).toEqual(
        new Price(DAI, USDC, '100', '101')
      )
    })
  })

  describe('uniswap #token1Price', () => {
    it('returns price of token1 in terms of token0', () => {
      expect(BasicPair(new TokenAmount(USDC, '101'), new TokenAmount(DAI, '100')).token1Price).toEqual(
        new Price(USDC, DAI, '101', '100')
      )
      expect(BasicPair(new TokenAmount(DAI, '100'), new TokenAmount(USDC, '101')).token1Price).toEqual(
        new Price(USDC, DAI, '101', '100')
      )
    })
  })

  describe('uniswap #priceOf', () => {
    const pair = BasicPair(new TokenAmount(USDC, '101'), new TokenAmount(DAI, '100'))
    it('returns price of token in terms of other token', () => {
      expect(pair.priceOf(DAI)).toEqual(pair.token0Price)
      expect(pair.priceOf(USDC)).toEqual(pair.token1Price)
    })

    it('throws if invalid token', () => {
      expect(() => pair.priceOf(WETH[ChainId.MAINNET])).toThrow('TOKEN')
    })
  })

  describe('#reserveOf', () => {
    it('returns reserves of the given token', () => {
      expect(BasicPair(new TokenAmount(USDC, '100'), new TokenAmount(DAI, '101')).reserveOf(USDC)).toEqual(
        new TokenAmount(USDC, '100')
      )
      expect(BasicPair(new TokenAmount(DAI, '101'), new TokenAmount(USDC, '100')).reserveOf(USDC)).toEqual(
        new TokenAmount(USDC, '100')
      )
    })

    it('throws if not in the pair', () => {
      expect(() =>
        BasicPair(new TokenAmount(DAI, '101'), new TokenAmount(USDC, '100')).reserveOf(WETH[ChainId.MAINNET])
      ).toThrow('TOKEN')
    })
  })

  describe('#chainId', () => {
    it('returns the token0 chainId', () => {
      expect(BasicPair(new TokenAmount(USDC, '100'), new TokenAmount(DAI, '100')).chainId).toEqual(ChainId.MAINNET)
      expect(BasicPair(new TokenAmount(DAI, '100'), new TokenAmount(USDC, '100')).chainId).toEqual(ChainId.MAINNET)
    })
  })
  describe('#involvesToken', () => {
    expect(BasicPair(new TokenAmount(USDC, '100'), new TokenAmount(DAI, '100')).involvesToken(USDC)).toEqual(true)
    expect(BasicPair(new TokenAmount(USDC, '100'), new TokenAmount(DAI, '100')).involvesToken(DAI)).toEqual(true)
    expect(
      BasicPair(new TokenAmount(USDC, '100'), new TokenAmount(DAI, '100')).involvesToken(WETH[ChainId.MAINNET])
    ).toEqual(false)
  })

  describe('uniswap amounts', () => {
    const inputAmount: TokenAmount = new TokenAmount(USDC, '1000000000000000000') // 1
    const outputAmount: TokenAmount = new TokenAmount(DAI, '987158034397061298') // 0.987
    expect(
      BasicPair(
        new TokenAmount(USDC, '100000000000000000000'), // 100
        new TokenAmount(DAI, '100000000000000000000')
      ) // 100
        .getOutputAmount(inputAmount)[0]
    ).toEqual(outputAmount)
  })

  const lowerBound15 = (n: JSBI): JSBI => {
    return JSBI.divide(JSBI.multiply(n, JSBI.BigInt(99999999999999)), JSBI.BigInt(100000000000000))
  }

  const upperBound15 = (n: JSBI): JSBI => {
    return JSBI.divide(JSBI.multiply(n, JSBI.BigInt(100000000000001)), JSBI.BigInt(100000000000000))
  }

  describe('sqrt calculations', () => {
    const amounts = [
      { k: '10000000000000000000000000000', sqrtK: '100000000000000' }, // At least 10^15
      { k: '602311237141614639250714307746962364969', sqrtK: '24542030012645951437' },
      { k: '1051862615112527981932275442917763963209', sqrtK: '32432431532534343453' },
      { k: '23562247653695456410649294596', sqrtK: '153499992357314' },
      { k: '72911332743072652158956264288752431169', sqrtK: '8538813310002312737' }
    ]

    amounts.forEach(elem => {
      const result: JSBI = BasicPair(new TokenAmount(USDC, '1000'), new TokenAmount(DAI, '1000')).sqrt(
        JSBI.BigInt(elem.k)
      )

      expect(JSBI.lessThan(result, upperBound15(JSBI.BigInt(elem.sqrtK)))).toBe(true) // Shoot for 10^-15 precision
      expect(JSBI.greaterThan(result, lowerBound15(JSBI.BigInt(elem.sqrtK)))).toBe(true)
    })
  })

  // Parseint back to js int creates lower sensitivity (truncates ending 2-4 digits)
  describe('simple xybk K calculations', () => {
    const amounts = ['712372217218233337', '20000000000000000000', '12323242882232920249', '23929449492939909691']
    const boosts = [2, 10, 22, 42, 64, 129]

    amounts.forEach(a => {
      boosts.forEach(b => {
        const result: JSBI = new Pair(new TokenAmount(USDC, a), new TokenAmount(DAI, a), true, 30, b, b).SqrtK
        expect(JSBI.lessThan(result, upperBound15(JSBI.BigInt(a)))).toBe(true) // Shoot for 10^-15 precision
        expect(JSBI.greaterThan(result, lowerBound15(JSBI.BigInt(a)))).toBe(true)
      })
    })
  })

  describe('complex xybk K calculations', () => {
    // doublecheck with wolframalpha: sqrt[(a+9sqrtK)(b+9sqrtK)] = 10*sqrtK
    const amounts = [
      { a: '40000000000000000000', b: '10000000000000000000', sqrtK: '24542030012645951437' },
      { a: '712372217218233337', b: '12323242882232920249', sqrtK: '6248706546171356461' },
      { a: '23929449492939909691', b: '59583691923485939593', sqrtK: '41372671310355025387' },
      { a: '593851823945304530422', b: '110231230506929991235', sqrtK: '343541838342506044137' },
      { a: '2388425885349239233', b: '12323242882232920249', sqrtK: '7184309717907350868' }
    ]

    amounts.forEach(elem => {
      let result: JSBI = new Pair(new TokenAmount(USDC, elem.a), new TokenAmount(DAI, elem.b), true, 30, 10, 10).SqrtK
      expect(JSBI.lessThan(result, upperBound15(JSBI.BigInt(elem.sqrtK)))).toBe(true) // Shoot for 10^-15 precision
      expect(JSBI.greaterThan(result, lowerBound15(JSBI.BigInt(elem.sqrtK)))).toBe(true)
    })
  })
})
