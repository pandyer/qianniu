import fs from 'fs'
import path from 'path'
import {Customer} from '../src/server/src/customer'


const loadTestData = (...testDataPath) => {
  const encoding = 'utf-8'
  const fp = path.join(__dirname, 'fixtures', ...testDataPath)
  const content = fs.readFileSync(fp, {encoding})
  return JSON.parse(content)
}

const fakeDate = () => {
  const originDate = Date
  let ms = null
  class FakeDate extends Date {
    constructor() {
      super(ms)
    }
  }
  return {
    use: (ts) => {
      ms = ts
      global.Date = FakeDate
    },
    restore: () => {
      global.Date = originDate
    }
  }
}
const fD = fakeDate()
const getMs = (data) => Number(data.messages.slice(-1)[0].svrtime)


describe('mock time', () => {
  afterEach(() => {
    fD.restore()
  })

  // test('mock time -2s', () => {
  //   const data = loadTestData('dedup', 'mengmeng-01.json')
  //   const then = getMs(data)
  //   fD.use(then - 2000)
  //   const customer = new Customer('cntaobao', data.uid, {emit: jest.fn()}, 0)
  //   const newMsgs = customer.sync(data.messages).filter(m => m.incoming)
  //   expect(newMsgs.length).toEqual(1)
  // })

  // test('mock time 0s', () => {
  //   const data = loadTestData('dedup', 'mengmeng-01.json')
  //   const then = getMs(data)
  //   fD.use(then)
  //   const customer = new Customer('cntaobao', data.uid, {emit: jest.fn()}, 0)
  //   const newMsgs = customer.sync(data.messages).filter(m => m.incoming)
  //   expect(newMsgs.length).toEqual(1)
  // })

  // test('mock time +2s', () => {
  //   const data = loadTestData('dedup', 'mengmeng-01.json')
  //   const then = getMs(data)
  //   fD.use(then + 2000)
  //   const customer = new Customer('cntaobao', data.uid, {emit: jest.fn()}, 0)
  //   const newMsgs = customer.sync(data.messages).filter(m => m.incoming)
  //   expect(newMsgs.length).toEqual(1)
  // })

  // test('mock time -2s', () => {
  //   const data = loadTestData('dedup', 'mengmeng-02.json')
  //   const then = getMs(data)
  //   fD.use(then - 2000)
  //   const customer = new Customer('cntaobao', data.uid, {emit: jest.fn()}, 0)
  //   const newMsgs = customer.sync(data.messages).filter(m => m.incoming)
  //   expect(newMsgs.length).toEqual(3)
  // })

  // test('mock time 0s', () => {
  //   const data = loadTestData('dedup', 'mengmeng-02.json')
  //   const then = getMs(data)
  //   fD.use(then)
  //   const customer = new Customer('cntaobao', data.uid, {emit: jest.fn()}, 0)
  //   const newMsgs = customer.sync(data.messages).filter(m => m.incoming)
  //   expect(newMsgs.length).toEqual(3)
  // })

  test('mock time +2s', () => {
    const data = loadTestData('dedup', 'mengmeng-02.json')
    const then = getMs(data)
    fD.use(then + 2000)
    const customer = new Customer('cntaobao', data.uid, {emit: jest.fn()}, 60 * 1000)
    const newMsgs = customer.sync(data.messages).filter(m => m.incoming)
    expect(newMsgs.length).toEqual(2)
  })

})