// Pseudo generator with 900M+ combinations
// Format: AdjectiveNoun1234 (PascalCase)
// Client-side only - no server imports

const adjectives = [
    'Brave', 'Swift', 'Wise', 'Bold', 'Calm', 'Fierce', 'Gentle', 'Noble', 'Quick', 'Silent',
    'Bright', 'Dark', 'Ancient', 'Modern', 'Cosmic', 'Crystal', 'Diamond', 'Electric', 'Frozen', 'Golden',
    'Hidden', 'Iron', 'Jade', 'Mystic', 'Neon', 'Ocean', 'Phoenix', 'Quantum', 'Royal', 'Sacred',
    'Thunder', 'Velvet', 'Wild', 'Zen', 'Azure', 'Crimson', 'Emerald', 'Ivory', 'Onyx', 'Silver',
    'Amber', 'Copper', 'Lunar', 'Solar', 'Stellar', 'Astral', 'Celestial', 'Divine', 'Eternal', 'Infinite',
    'Mighty', 'Radiant', 'Serene', 'Tranquil', 'Vibrant', 'Zealous', 'Agile', 'Clever', 'Daring', 'Eager',
    'Fearless', 'Graceful', 'Heroic', 'Intrepid', 'Jovial', 'Keen', 'Loyal', 'Majestic', 'Nimble', 'Proud',
    'Resilient', 'Spirited', 'Tenacious', 'Valiant', 'Witty', 'Brilliant', 'Charming', 'Dazzling', 'Elegant', 'Fabulous',
    'Glorious', 'Harmonious', 'Illustrious', 'Jubilant', 'Kinetic', 'Luminous', 'Magnificent', 'Opulent', 'Pristine', 'Radiant',
    'Splendid', 'Triumphant', 'Vivid', 'Wondrous', 'Exquisite', 'Flawless', 'Gleaming', 'Impressive', 'Legendary', 'Marvelous',
    'Outstanding', 'Perfect', 'Remarkable', 'Stunning', 'Superb', 'Terrific', 'Vigorous', 'Awesome', 'Blazing', 'Dashing',
    'Epic', 'Fantastic', 'Grand', 'Heroic', 'Incredible', 'Legendary', 'Phenomenal', 'Spectacular', 'Supreme', 'Ultimate',
    'Absolute', 'Boundless', 'Colossal', 'Dynamic', 'Endless', 'Formidable', 'Gigantic', 'Immense', 'Limitless', 'Massive',
    'Powerful', 'Robust', 'Solid', 'Strong', 'Titanic', 'Vast', 'Adamant', 'Blazing', 'Courageous', 'Defiant',
    'Energetic', 'Fiery', 'Gallant', 'Hardy', 'Indomitable', 'Keen', 'Lively', 'Passionate', 'Spirited', 'Vigorous',
    'Zealous', 'Active', 'Alert', 'Animated', 'Brisk', 'Chipper', 'Eager', 'Fresh', 'Hearty', 'Peppy',
    'Perky', 'Snappy', 'Spry', 'Zippy', 'Bouncy', 'Bubbly', 'Cheerful', 'Frisky', 'Jaunty', 'Jolly',
    'Merry', 'Playful', 'Sprightly', 'Sunny', 'Upbeat', 'Vivacious', 'Zesty', 'Breezy', 'Carefree', 'Easygoing',
    'Flowing', 'Gentle', 'Light', 'Mellow', 'Peaceful', 'Relaxed', 'Smooth', 'Soft', 'Soothing', 'Tender',
    'Tranquil', 'Airy', 'Blithe', 'Calm', 'Cool', 'Dreamy', 'Ethereal', 'Floating', 'Hazy', 'Misty',
    'Nebulous', 'Placid', 'Quiet', 'Restful', 'Serene', 'Still', 'Subdued', 'Temperate', 'Unruffled', 'Whispering',
    'Arctic', 'Boreal', 'Chilly', 'Frosty', 'Glacial', 'Icy', 'Polar', 'Snowy', 'Wintry', 'Alpine',
    'Aquatic', 'Marine', 'Nautical', 'Oceanic', 'Tidal', 'Tropical', 'Volcanic', 'Desert', 'Forest', 'Mountain',
    'Prairie', 'River', 'Valley', 'Canyon', 'Cliff', 'Peak', 'Ridge', 'Summit', 'Highland', 'Lowland',
    'Coastal', 'Island', 'Peninsula', 'Plateau', 'Plain', 'Meadow', 'Grove', 'Woodland', 'Jungle', 'Savanna',
    'Tundra', 'Marsh', 'Swamp', 'Delta', 'Estuary', 'Fjord', 'Lagoon', 'Reef', 'Atoll', 'Archipelago',
    'Cosmic', 'Galactic', 'Nebular', 'Orbital', 'Planetary', 'Stellar', 'Lunar', 'Solar', 'Astral', 'Celestial',
    'Ethereal', 'Heavenly', 'Starry', 'Twilight', 'Dawn', 'Dusk', 'Midnight', 'Noon', 'Sunrise', 'Sunset',
    'Autumn', 'Spring', 'Summer', 'Winter', 'Vernal', 'Estival', 'Autumnal', 'Hibernal', 'Equinox', 'Solstice'
]

const nouns = [
    'Eagle', 'Lion', 'Tiger', 'Bear', 'Wolf', 'Fox', 'Hawk', 'Falcon', 'Raven', 'Phoenix',
    'Dragon', 'Griffin', 'Unicorn', 'Pegasus', 'Sphinx', 'Kraken', 'Hydra', 'Chimera', 'Basilisk', 'Cerberus',
    'Panther', 'Leopard', 'Jaguar', 'Cheetah', 'Lynx', 'Cougar', 'Puma', 'Ocelot', 'Bobcat', 'Caracal',
    'Dolphin', 'Whale', 'Shark', 'Orca', 'Seal', 'Walrus', 'Penguin', 'Albatross', 'Pelican', 'Heron',
    'Crane', 'Stork', 'Ibis', 'Flamingo', 'Swan', 'Goose', 'Duck', 'Mallard', 'Teal', 'Merganser',
    'Owl', 'Eagle', 'Vulture', 'Condor', 'Kite', 'Harrier', 'Buzzard', 'Osprey', 'Kestrel', 'Merlin',
    'Sparrow', 'Robin', 'Finch', 'Warbler', 'Thrush', 'Wren', 'Lark', 'Nightingale', 'Mockingbird', 'Cardinal',
    'Bluejay', 'Magpie', 'Crow', 'Rook', 'Jackdaw', 'Starling', 'Oriole', 'Tanager', 'Bunting', 'Grosbeak',
    'Bison', 'Buffalo', 'Elk', 'Moose', 'Deer', 'Caribou', 'Reindeer', 'Antelope', 'Gazelle', 'Impala',
    'Zebra', 'Giraffe', 'Elephant', 'Rhino', 'Hippo', 'Camel', 'Llama', 'Alpaca', 'Yak', 'Ox',
    'Horse', 'Stallion', 'Mare', 'Colt', 'Mustang', 'Bronco', 'Pony', 'Donkey', 'Mule', 'Burro',
    'Rabbit', 'Hare', 'Squirrel', 'Chipmunk', 'Beaver', 'Otter', 'Mink', 'Ferret', 'Weasel', 'Badger',
    'Raccoon', 'Skunk', 'Opossum', 'Armadillo', 'Porcupine', 'Hedgehog', 'Mole', 'Shrew', 'Vole', 'Lemming',
    'Bat', 'Mongoose', 'Meerkat', 'Prairie', 'Gopher', 'Groundhog', 'Woodchuck', 'Marmot', 'Chinchilla', 'Capybara',
    'Kangaroo', 'Wallaby', 'Koala', 'Wombat', 'Platypus', 'Echidna', 'Tasmanian', 'Dingo', 'Kiwi', 'Emu',
    'Ostrich', 'Cassowary', 'Rhea', 'Kookaburra', 'Cockatoo', 'Parrot', 'Macaw', 'Parakeet', 'Budgie', 'Lorikeet',
    'Toucan', 'Hornbill', 'Kingfisher', 'Woodpecker', 'Hummingbird', 'Swift', 'Swallow', 'Martin', 'Pigeon', 'Dove',
    'Quail', 'Pheasant', 'Grouse', 'Partridge', 'Turkey', 'Peacock', 'Peafowl', 'Guinea', 'Chicken', 'Rooster',
    'Salmon', 'Trout', 'Bass', 'Pike', 'Carp', 'Catfish', 'Sturgeon', 'Barracuda', 'Tuna', 'Marlin',
    'Swordfish', 'Sailfish', 'Mahi', 'Grouper', 'Snapper', 'Halibut', 'Flounder', 'Sole', 'Turbot', 'Plaice',
    'Cobra', 'Viper', 'Python', 'Anaconda', 'Boa', 'Mamba', 'Adder', 'Rattlesnake', 'Copperhead', 'Cottonmouth',
    'Turtle', 'Tortoise', 'Terrapin', 'Iguana', 'Gecko', 'Chameleon', 'Lizard', 'Skink', 'Monitor', 'Komodo',
    'Frog', 'Toad', 'Newt', 'Salamander', 'Axolotl', 'Tadpole', 'Bullfrog', 'Treefrog', 'Poison', 'Dart',
    'Butterfly', 'Moth', 'Dragonfly', 'Damselfly', 'Beetle', 'Ladybug', 'Firefly', 'Grasshopper', 'Cricket', 'Mantis',
    'Scorpion', 'Spider', 'Tarantula', 'Centipede', 'Millipede', 'Ant', 'Bee', 'Wasp', 'Hornet', 'Termite',
    'Oak', 'Pine', 'Maple', 'Birch', 'Willow', 'Cedar', 'Spruce', 'Fir', 'Redwood', 'Sequoia',
    'Aspen', 'Poplar', 'Elm', 'Ash', 'Beech', 'Hickory', 'Walnut', 'Cherry', 'Apple', 'Pear',
    'Plum', 'Peach', 'Apricot', 'Olive', 'Fig', 'Palm', 'Bamboo', 'Cactus', 'Fern', 'Moss',
    'Rose', 'Lily', 'Orchid', 'Lotus', 'Iris', 'Tulip', 'Daisy', 'Sunflower', 'Poppy', 'Lavender',
    'Jasmine', 'Magnolia', 'Azalea', 'Camellia', 'Peony', 'Dahlia', 'Zinnia', 'Marigold', 'Chrysanthemum', 'Carnation'
]

// Client-side pseudo generator
export function generatePseudoClient(): string {
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
    const noun = nouns[Math.floor(Math.random() * nouns.length)]
    const number = Math.floor(Math.random() * 10000).toString().padStart(4, '0')

    return `${adjective}${noun}${number}`
}
