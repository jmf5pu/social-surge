// helper functions used in main

// converts string of proxies into an array
function parseProxies(proxyString) {
    let proxyArray = []

    if (proxyString.indexOf(',') > -1) {
        // comma separated
        proxyArray = proxyString.split(',')
    } else if (proxyString.indexOf('\n') > -1) {
        // newline separated
        proxyArray = proxyString.split('\n')
    } else {
        throw new Error(
            'Proxy list was formatted incorrectly! Must be comma or newline separated'
        )
    }

    // TODO: remove whitespace

    return proxyArray
}

module.exports = {
    parseProxies,
}
