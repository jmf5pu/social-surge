const { getRandomNumber } = require('../viewbot/viewer')

test('random number between two of the same number should be itself', () => {
    expect(getRandomNumber(1, 1)).toBe(1)
})
