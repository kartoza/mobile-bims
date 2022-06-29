import { load, save } from "../../utils/storage"

export const saveChoices = async (choices) => {
  await save("choices", choices)
}

export const loadChoices = async () => {
  return await load("choices") || {}
}
