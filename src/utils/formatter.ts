import { IProfile } from '../shared.types'

export const formatUserName = (user: IProfile) =>
  `${user.firstName} ${user.lastName}`
