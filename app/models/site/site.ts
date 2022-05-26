
export default class Site {
  id: number
  siteCode: string
  name: string
  latitude: number
  longitude: number
  datetime: number
  synced: boolean
  newData?: boolean

  parse = (data) => {
    this.id = data.id
    this.siteCode = data.site_code
    this.name = data.name
    const geometry = JSON.parse(data.geometry)
    this.longitude = geometry.coordinates[0]
    this.latitude = geometry.coordinates[1]
    if (data.datetime) {
      this.datetime = data.datetime
    }
    return this
  }

  constructor(site: any) {
    if (site) {
      for (const key in site) {
        this[key] = site[key]
      }
      if (this.newData && typeof site.synced === "undefined") {
        this.synced = true
      }
    }
  }
}
