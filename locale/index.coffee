langs = [
    'ua'
    'ru'
    'en'
]

for lang in langs
    module.exports[lang] = require "./#{lang}"
