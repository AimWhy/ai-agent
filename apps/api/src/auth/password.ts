import bcrypt from 'bcryptjs'

export async function verifyPasswordHash(params: {
  password: string
  passwordHash: string
  passwordAlgo: 'argon2id' | 'bcrypt'
}): Promise<boolean> {
  const { password, passwordHash, passwordAlgo } = params

  // 这里保留算法字段，是为了后续迁移到 argon2id 时不用再改表结构。
  if (passwordAlgo !== 'bcrypt') {
    throw new Error(`Unsupported password algorithm: ${passwordAlgo}`)
  }

  // 当前先只做校验，不在这里顺手处理 failed attempts，避免把“凭证是否正确”和“风控状态更新”混在一起。
  return bcrypt.compare(password, passwordHash)
}
