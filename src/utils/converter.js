import * as OpenCC from 'opencc-js'

let converter = null

function getConverter() {
  if (!converter) {
    converter = OpenCC.Converter({ from: 'cn', to: 'twp' })
  }
  return converter
}

export async function convertToTraditional(text) {
  const conv = getConverter()
  return conv(text)
}
