import { uuidv7 } from 'uuidv7'
import { BizCode } from '@repo/contracts'
import { AppError } from './app-error'

const avatarMaxBytes = 2 * 1024 * 1024

const avatarExtensionByMimeType: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

export function assertAvatarFile(file: File) {
  const extension = avatarExtensionByMimeType[file.type]

  if (!extension) {
    throw new AppError(
      BizCode.COMMON_INVALID_REQUEST,
      'Avatar must be a JPG, PNG, or WebP image',
      400,
    )
  }

  if (file.size <= 0) {
    throw new AppError(
      BizCode.COMMON_INVALID_REQUEST,
      'Avatar file is empty',
      400,
    )
  }

  if (file.size > avatarMaxBytes) {
    throw new AppError(
      BizCode.COMMON_INVALID_REQUEST,
      'Avatar file must be 2MB or smaller',
      400,
    )
  }

  return extension
}

export function buildDefaultAvatarKey(file: File, nowMs: number) {
  const extension = assertAvatarFile(file)
  return `avatars/default/${nowMs}-${uuidv7()}.${extension}`
}

export function buildUserAvatarKey(userId: string, file: File, nowMs: number) {
  const extension = assertAvatarFile(file)
  return `avatars/users/${userId}/${nowMs}-${uuidv7()}.${extension}`
}
