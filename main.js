const path = require('path')
const fs = require('fs')
const UPNG = require('./UPNG.js');
const assert = require('assert');
const parseCommandLine = require('command-line-args');
const generateUsage = require('command-line-usage');

const commandLine = {
    optionDefinitions: [
        { name: 'encoded', alias: 'e', defaultValue: "encoded.png" },
        { name: 'decoded', alias: 'd', type: String, defaultValue: "decoded.png" },
        { name: 'original', alias: 'o', type: String, defaultValue: "original.png" },
        { name: 'secret', alias: 's', type: String, defaultValue: "secret.png" },
        { name: 'help', alias: 'h', type: Boolean, defaultValue: false },
    ],

    get usageOptions() {
        // We must do this stupid song/dance in order to capture the proper
        // `this`.
        return function (that) {
            return [
                {
                    header: 'stenosaurus',
                    content: 'Hide a BW image (8bpc Grayscale) inside any full-color PNG.'
                },
                {
                    header: 'Options',
                    get optionList() {
                        return that.optionDefinitions
                    },
                },
            ];
        }(this)
    },
    get usageString() {
        return generateUsage(this.usageOptions)
    },
}

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
        return [false, error]
    }

    assert(haystack != null)
    assert(needle != null)

    const haystackImage = UPNG.decode(haystack)
    const haystackData = haystackImage.data
    const needleImage = UPNG.decode(needle)
    const needleData = needleImage.data

    if (needleImage.height != haystackImage.height || needleImage.width != haystackImage.width) {
        return [false, Error("Original and secret message do not have matching dimensions.")]
    }

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
        return [false, error]
    }

    return [true, null]
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

function main(args) {

    const commandLineOptions = parseCommandLine(commandLine.optionDefinitions)

    if (commandLineOptions['help']) {
        console.log(commandLine.usageString)
        return
    }

    var originalFilePath, secretFilePath, encodedFilePath, decodedFilePath;
    try {
        originalFilePath = path.join(path.dirname('./'), commandLineOptions['original'])
        secretFilePath = path.join(path.dirname('./'), commandLineOptions['secret'])
        encodedFilePath = path.join(path.dirname('./'), commandLineOptions['encoded'])
        decodedFilePath = path.join(path.dirname('./'), commandLineOptions['decoded'])
    } catch (err) {
        console.log(`There was an error opening one of the required files: ${err}!`)
        return
    }


    var [encode_result, encode_error] = encode(originalFilePath, secretFilePath, encodedFilePath)
    if (encode_result == false) {
        console.log(`Error encoding: ${encode_error}`)
        return
    } else {
        console.log("Encoding successful.")
    }
    var decode_result, decode_error = decode(encodedFilePath, decodedFilePath)
    if (decode_result == false) {
        console.log(`Error decoding: ${decode_error}`)
        return
    } else {
        console.log("Decoding successful.")
    }
}

main(process.argv)