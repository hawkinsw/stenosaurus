const path = require('path')
const fs = require('fs')
const UPNG = require('./UPNG.js');
const assert = require('assert');

/*
 * The image at `haystackFilePath` should be a 16-bit-depth RGB PNG. The needle should be encoded
 * in a black-and-white image (message in black, background in white) as a 8-bit-depth GRAY PNG.
 * The needle will be encoded in the file written to encodedFilePath in a format suitable for
 * deciphering with the decode function.
 */
function encode(haystackFilePath, needleFilePath, encodedFilePath) {

    let haystack = null
    let needle = null
    try {
        haystack = fs.readFileSync(haystackFilePath)
        needle = fs.readFileSync(needleFilePath)
    } catch (error) {
        return (false, error)
    }

    assert(haystack != null)
    assert(needle != null)

    const haystackImage = UPNG.decode(haystack)
    const haystackData = haystackImage.data
    const needleImage = UPNG.decode(needle)
    const needleData = needleImage.data

    // for the red channel of every pixel in the haystack, compare the 
    // black/white-ness of the pixel in the needle. If the pixel in the needle
    // is not white, it represents part of the signal. So, we set the red
    // channel value to its nearest even value. Otherwise, we make sure that
    // value is to the nearest odd value. This is our signal to the decoder
    // and one that does not obscure the data too much!
    for (var i = 0; i < haystackData.byteLength; i += 3) {
        const needleValue = needleData[i / 3]
        if (needleValue < 255) {
            // Make the pixel even!
            haystackData[i] &= 0xfe
        } else {
            // Make the pixel odd!
            haystackData[i] |= 0x1
        }
    }

    var encodedImageFrames = Array(1)
    encodedImageFrames[0] = haystackData
    const encoded = UPNG.encodeLL(encodedImageFrames, haystackImage.width, haystackImage.height, 3, 0, 16)
    try {
        fs.writeFileSync(encodedFilePath, Buffer.from(encoded))
    } catch (error) {
        return (false, error)
    }

    return (true, null)
}

function isEven(eoro) {
    return (eoro % 2) == 0
}

function decode(encodedFilePath, decodedFilePath) {
    const encoded = fs.readFileSync(encodedFilePath)

    const encodedImage = UPNG.decode(encoded)
    const encodedImageData = encodedImage.data
    const decodedImageData = new Uint8Array(encodedImageData.byteLength)

    // for the red channel of every pixel in the encoded file, see
    // if its value is even. If it is, then that means the pixel is part
    // of the signal.
    for (var i = 0; i < encodedImageData.byteLength; i += 3) {
        const value = encodedImageData[i]
        if (isEven(value)) {
            decodedImageData[i] = 255;
        }
    }

    var decodedImageFrames = Array(1)
    decodedImageFrames[0] = decodedImageData
    const decoded = UPNG.encodeLL(decodedImageFrames, encodedImage.width, encodedImage.height, 3, 0, 8)
    fs.writeFileSync(decodedFilePath, Buffer.from(decoded))
}

var taylorFilePath = path.join(path.dirname('./'), "original.png")
var hiddenFilePath = path.join(path.dirname('./'), "secret.png")
var encodedFilePath = path.join(path.dirname('./'), "encoded.png")
var decodedFilePath = path.join(path.dirname('./'), "decoded.png")
var encode_result, encode_error = encode(taylorFilePath, hiddenFilePath, encodedFilePath)
if (encode_result == false) {
    console.log(`Error encoding: ${encode_error}`)
} else {
    console.log("Encoding successful.")
}
var decode_result, decode_error = decode(encodedFilePath, decodedFilePath)
if (decode_result == false) {
    console.log(`Error decoding: ${decode_error}`)
} else {
    console.log("Decoding successful.")
}
