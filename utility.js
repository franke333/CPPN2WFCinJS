// TODO: Review the generated Doxygen comments in this file manually later.

/**
 * Reshape a flat or nested array into a 2D matrix.
 *
 * @param {Array} array Input array.
 * @param {number} rows Number of rows in the output.
 * @param {number} cols Number of columns in the output.
 * @returns {Array<Array<*>>} The reshaped matrix.
 */
function reshape(array, rows, cols){
    if(array.length != rows * cols)
        array = flatten(array);
    let reshaped = new Array(rows);
    for(let i = 0; i < rows; i++){
        reshaped[i] = new Array(cols);
        for(let j = 0; j < cols; j++){
            reshaped[i][j] = array[i * cols + j];
        }
    }
    return reshaped;
}

/**
 * Flatten a 2D array into a 1D array.
 *
 * @param {Array} array Input array.
 * @returns {Array} The flattened array.
 */
function flatten(array){
    //check if already flattened
    if(array.length == 0 || !Array.isArray(array[0])){
        return array;
    }
    let flattened = new Array(array.length * array[0].length);
    for(let i = 0; i < array.length; i++){
        for(let j = 0; j < array[i].length; j++){
            flattened[i * array[0].length + j] = array[i][j];
        }
    }
    return flattened;
}

/**
 * Normalize an array so its values sum to 1.
 *
 * @param {Array<number>} array Input values.
 * @returns {Array<number>} The normalized values.
 */
function normalize(array){
    let sum = 0;
    for(let i = 0; i < array.length; i++){
        sum += array[i];
    }
    if(sum == 0)
        return array.map(() => 1 / array.length);
    return array.map(x => x / sum);
}

/**
 * Normalize a dictionary so its values sum to 1.
 *
 * @param {Object<string, number>} dict Input dictionary.
 * @returns {Object<string, number>} The normalized dictionary.
 */
function normalizeDict(dict){
    let sum = 0;
    for(let key in dict){
        sum += dict[key];
    }
    if(sum == 0)
        return Object.fromEntries(Object.keys(dict).map(key => [key, 1 / Object.keys(dict).length]));
    return Object.fromEntries(Object.entries(dict).map(([key, value]) => [key, value / sum]));
}


//TODO: might be a good idea to have tuples instead of dictionary (allows duplicate keys)
/*
* Returns a random key based on the weights of the dictionary
* @param {dict} dict - A dictionary of values and their weights (key: value, value: weight)
* @returns {number} - A random key based on the weights of the dictionary
*/
/**
 * Choose a random key from a weighted dictionary.
 *
 * @param {Object<string, number>} dict Dictionary of keys and weights.
 * @returns {string|null} A randomly selected key.
 */
function weightedRandom(dict){
    let total = 0;
    for(let key in dict){
        total += dict[key];
    }
    // if total is 0, return uniformly random key
    if(total == 0)
        return Object.keys(dict)[Math.floor(random(0, Object.keys(dict).length))];
    let x = random(0,total);
    for(let key in dict){
        x -= dict[key];
        if(x <= 0){
            return key;
        }
    }
    return null; // This should never happen
}