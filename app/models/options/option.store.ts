import { load, save } from "../../utils/storage"
import Option from "./option"

const _OPTIONS = 'options'

const _getKey = (moduleId: number) => _OPTIONS + moduleId

export const loadOptions = async (moduleId: number) => {
  const options = await load(_getKey(moduleId))
  if (!options) {
    return []
  }
  return options.map((option) => new Option(option))
}

export const saveOptions = async (options: Option[], moduleId: number) => {
  await save(_getKey(moduleId), options)
}
