/**
 * Compute the Shannon entropy of a weight collection.
 *
 * @param {Array<number>|Object<string, number>} weights Input weights.
 * @returns {number} The Shannon entropy of the normalized weights.
 */
function shannonEntropy(weights) {
    const values = Array.isArray(weights) ? [...weights] : Object.values(weights);
    let sum = 0;
    for (const value of values) {
        sum += value;
    }
    if (sum != 0) {
        for (let i = 0; i < values.length; i++) {
            values[i] /= sum;
        }
    }
    return -values.reduce((acc, p) => {
        if (p > 0) {
            return acc + p * Math.log(p);
        }
        return acc;
    }, 0);
}

/**
 * Compute the maximum weight in a weight collection.
 *
 * @param {Array<number>|Object<string, number>} weights Input weights.
 * @returns {number} The largest weight value.
 */
function maximumHeuristics(weights) {
    const values = Array.isArray(weights) ? weights : Object.values(weights);
    return values.reduce((acc, p) => {
        return p > acc ? p : acc;
    }, 0);
}

/**
 * Select the next cell to collapse using an entropy metric.
 *
 * @param {Function} entropy Entropy function to evaluate a candidate cell.
 * @param {WFC} wfc The WFC instance being evaluated.
 * @param {Array} normalizedWeights Precomputed normalized weights.
 * @returns {Array<number>|null} The selected cell coordinates or null if no cell is available.
 */
function customHeuristic(entropy, wfc, normalizedWeights) {
    let bestX = -1;
    let bestY = -1;
    let bestHeuristic = -Infinity;
    for (let x = 0; x < wfc.width; x++) {
        for (let y = 0; y < wfc.height; y++) {
            if (wfc.map[y][x].tile != null) {
                continue;
            }
            const possibleTiles = wfc.map[y][x].possibleTiles;
            let p = {};
            for (const tile of possibleTiles) {
                p[tile] = normalizedWeights[wfc.id][x][y][tile];
            }
            const h = entropy(Object.values(p));
            if (h > bestHeuristic) {
                bestHeuristic = h;
                bestX = x;
                bestY = y;
            }
        }
    }
    if (bestX == -1 || bestY == -1) {
        return null;
    }
    return [bestX, bestY];
}

/**
 * Select a tile using the argmax layout weights.
 *
 * @param {number} x Cell x-coordinate.
 * @param {number} y Cell y-coordinate.
 * @param {WFC} wfc The WFC instance being evaluated.
 * @param {Object} weights Layout weights indexed by layout and tile.
 * @param {CPPN} cppn The CPPN that provides layout data.
 * @returns {number} The chosen tile id.
 */
function weightedArgmaxCollapseHeuristic(x, y, wfc, weights, cppn) {
    const possibleTiles = wfc.map[y][x].possibleTiles;
    const layout = cppn.getLayoutAt(x, y, true, wfc.id);
    let dict = {};
    for (const tile of possibleTiles) {
        dict[tile] = weights[layout][tile];
    }
    return int(weightedRandom(dict));
}

/**
 * Select a tile using precomputed normalized weights.
 *
 * @param {number} x Cell x-coordinate.
 * @param {number} y Cell y-coordinate.
 * @param {WFC} wfc The WFC instance being evaluated.
 * @param {Array} normalizedWeights Precomputed normalized weights.
 * @returns {number} The chosen tile id.
 */
function weightedNormalizedCollapseHeuristic(x, y, wfc, normalizedWeights) {
    const possibleTiles = wfc.map[y][x].possibleTiles;
    let dict = {};
    for (const tile of possibleTiles) {
        dict[tile] = normalizedWeights[wfc.id][x][y][tile];
    }
    return int(weightedRandom(dict));
}

