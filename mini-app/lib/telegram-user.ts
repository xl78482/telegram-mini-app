import { prisma } from './prisma'

export type TelegramUserPayload = {
  id: number | string
  username?: string
  first_name?: string
  last_name?: string
  photo_url?: string
}

export async function getOrCreateTelegramUser(tgUser: TelegramUserPayload) {
  const tgId = BigInt(tgUser.id)

  return prisma.user.upsert({
    where: { tgId },
    update: {
      username: tgUser.username ?? null,
      firstName: tgUser.first_name ?? null,
      lastName: tgUser.last_name ?? null,
      avatarUrl: tgUser.photo_url ?? null,
    },
    create: {
      tgId,
      username: tgUser.username ?? null,
      firstName: tgUser.first_name ?? null,
      lastName: tgUser.last_name ?? null,
      avatarUrl: tgUser.photo_url ?? null,
    },
  })
}
