export default class Option {
  id: number
  key: string
  name: string
  moduleId: number
  synced: boolean
  newData?: boolean

  parse = (data, key, moduleId) => {
    this.id = data.id
    this.key = key
    this.name = data.name
    this.moduleId = moduleId
    return this
  }

  constructor(option: any) {
    if (option) {
      for (const key in option) {
        this[key] = option[key]
      }
      if (this.newData && typeof option.synced === "undefined") {
        this.synced = true
      }
    }
  }
}
