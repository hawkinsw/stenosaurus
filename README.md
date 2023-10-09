## Steno, The Steganography Stegasaurus

### Usage

```console
$ node ./main.js --help
stenosaurus

  Hide a BW image (8bpc Grayscale) inside any full-color PNG. 

Options

  -e, --encoded string     
  -d, --decoded string     
  -o, --original string    
  -s, --secret string      
  -h, --help          
```

#### Format of Hidden-Message Files

The message containing the hidden message should be an 8bpc GRAY image
with "Save gamma".

The size should match that of the original image.

The background of the secret image should be white. The image to hide should be something other than white.
