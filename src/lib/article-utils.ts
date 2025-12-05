// Helper to convert number to Roman numerals
export function toRoman(num: number): string {
    const romanNumerals: [number, string][] = [
        [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
        [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
        [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
    ]

    let result = ''
    for (const [value, numeral] of romanNumerals) {
        while (num >= value) {
            result += numeral
            num -= value
        }
    }
    return result
}

// Get the next constitutional article number based on approved articles
export function getNextConstitutionalArticleNumber(approvedCount: number): string {
    return toRoman(approvedCount + 1)
}

// Format the constitutional article designation
export function formatConstitutionalArticleDesignation(articleNumber: string): string {
    return `Article ${articleNumber} of the constitution`
}
