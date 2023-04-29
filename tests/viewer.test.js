const viewer = require('../viewbot/viewer.js')
const { Page } = require('puppeteer')
// getRandomNumber tests
test('random number between two of the same number should be itself', () => {
    jest.clearAllMocks()
    const min = 1
    const max = 1
    expect(viewer.getRandomNumber(1, 1)).toBe(1)
})

test('random number should be between max and min parameters', () => {
    jest.clearAllMocks()
    const min = 1
    const max = 10
    const value = viewer.getRandomNumber(min, max)
    expect(value).toBeGreaterThanOrEqual(min)
    expect(value).toBeLessThanOrEqual(max)
})

// sleep tests
test('sleep should set a timeout for the correct amount of milliseconds', () => {
    jest.clearAllMocks()
    const mockMs = 50
    mockSetTimeout = jest.spyOn(global, 'setTimeout')
    viewer.sleep(mockMs)
    expect(mockSetTimeout).toHaveBeenCalledTimes(1)
    expect(mockSetTimeout).toHaveBeenCalledWith(
        expect.any(Function),
        mockMs
    )
})

// clickAndWait tests
test('clickAndWait calls page.click()', () => {
    jest.clearAllMocks()
    const mockClickCount = 2
    const mockSelector = '#mockselector'
    const mockMs = 50
    const mockPage = new Page()
    const mockPageClick = jest
        .spyOn(mockPage, 'click')
        .mockReturnValue(Promise.resolve(true))
    viewer.clickAndWait(
        (page = mockPage),
        (targetSelector = mockSelector),
        (waitMs = mockMs),
        (clickCount = mockClickCount)
    )

    expect(mockPageClick).toHaveBeenCalledTimes(1)
    expect(mockPageClick).toHaveBeenCalledWith('#mockselector', {
        clickCount: mockClickCount,
    })
    //TODO: figure out what is going on with sleep
})

// clickAndWaitIfPresent tests
test('clickAndWaitIfPresent catches click exceptions', () => {
    jest.clearAllMocks()
    const mockClickCount = 2
    const mockSelector = '#mockselector'
    const mockMs = 50
    const mockPage = new Page()
    const mockPageClick = jest
        .spyOn(mockPage, 'click')
        .mockImplementation(() => {
            throw new Error('clicked incorrectly!')
        })
    const result = viewer.clickAndWaitIfPresent(
        (page = mockPage),
        (targetSelector = mockSelector),
        (waitMs = mockMs),
        (clickCount = mockClickCount)
    )
    expect(result).toEqual(Promise.resolve({}))
})
