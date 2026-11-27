// Value and date text shared by every Charting Library's axes and tooltips.

/** An ISO date (`YYYY-MM-DD`) as midnight UTC, so formatting never shifts it by a time zone. */
export const asUtcDate = (iso: string) => new Date(`${iso}T00:00:00Z`)

const fullDate = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: 'UTC' })
export const formatFullDate = (iso: string) => fullDate.format(asUtcDate(iso))

const upToTwoDecimals = new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 })
export const formatLevel = (value: number) => upToTwoDecimals.format(value)
export const formatPercent = (value: number) => `${upToTwoDecimals.format(value)}%`
