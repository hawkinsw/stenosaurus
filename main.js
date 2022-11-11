//import { readFileSync, writeFileSync } from 'fs'
//import { join, dirname } from 'path'

const pako = require('pako')
const path = require('path')
const fs = require('fs')

const UPNG = require('./UPNG.js');

function encode() {
    console.log(UPNG)
    const haystack = fs.readFileSync(path.join(path.dirname('./'), "taylor.png"))
    const needle = fs.readFileSync(path.join(path.dirname('./'), "hidden.png"))


    const haystackImage = UPNG.decode(haystack)
    const haystackData = haystackImage.data
    const needleImage = UPNG.decode(needle)
    const needleData = needleImage.data

    // for every pixel in 
    for (var i = 0; i<haystackData.byteLength; i+=3) {
        const needleValue = needleData[i/3]
        if (needleValue > 10) {
            console.log(`Pixel at ${i/3} is on.`)
            // Make the pixel even!
            if (haystackData[i] % 2) {
                haystackData[i]++;
            }
        } else {
            // Make the pixel odd!
            if (!(haystackData[i] % 2)) {
                haystackData[i]--;
            }
        }
    }

    var encodedImageFrames =  Array(1)
    encodedImageFrames[0] = haystackData
    console.log(haystackImage)
    const encoded = UPNG.encodeLL(encodedImageFrames, haystackImage.width, haystackImage.height, 3, 0, 16)
    fs.writeFileSync(path.join(path.dirname('./'), "testing.png"), Buffer.from(encoded))
}

function decode() {
    console.log(UPNG)
    const encoded = fs.readFileSync(path.join(path.dirname('./'), "testing.png"))

    const encodedImage = UPNG.decode(encoded)
    const encodedImageData = encodedImage.data
    const decodedImageData = new Uint8Array(encodedImageData.byteLength)

    // for every pixel in 
    for (var i = 0; i<encodedImageData.byteLength; i+=3) {
        const value = encodedImageData[i]
        if (!(value % 2)) {
            decodedImageData[i] = 255;
        }
    }

    var decodedImageFrames =  Array(1)
    decodedImageFrames[0] = decodedImageData
    const decoded = UPNG.encodeLL(decodedImageFrames, encodedImage.width, encodedImage.height, 3, 0, 8)
    fs.writeFileSync(path.join(path.dirname('./'), "decoded.png"), Buffer.from(decoded))
}
encode()
decode()
