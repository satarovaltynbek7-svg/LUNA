import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { MENU_CATEGORIES, MENU_ITEMS } from '../../frontend/src/data/menuItems.js'
import { GALLERY_ITEMS } from '../../frontend/src/data/galleryItems.js'
import { prisma } from './db.js'

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
const locales = Object.fromEntries(['ru', 'ky', 'en'].map((language) => [
  language,
  JSON.parse(readFileSync(path.join(projectRoot, 'frontend', 'src', 'i18n', 'locales', language, 'translation.json'), 'utf8')),
]))

function translation(language, key) {
  return key.split('.').reduce((value, part) => value?.[part], locales[language])
}

function localized(key) {
  return Object.fromEntries(['ru', 'ky', 'en'].map((language) => [language, translation(language, key)]))
}

function categorySlug(value) {
  return value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)
}

export async function seedCatalog() {
  for (const [index, categoryKey] of MENU_CATEGORIES.entries()) {
    const slug = categorySlug(categoryKey)
    let category = await prisma.menuCategory.findUnique({ where: { slug } })
    if (!category) {
      category = await prisma.menuCategory.create({
        data: { slug, names: localized(`menu.categories.${categoryKey}`), sortOrder: index },
      })
    }

    const items = MENU_ITEMS.filter((item) => item.category === categoryKey)
    const existing = new Set((await prisma.menuItem.findMany({
      where: { slug: { in: items.map((item) => item.id) } },
      select: { slug: true },
    })).map((item) => item.slug))
    const missingItems = items.filter((item) => !existing.has(item.id))
    if (missingItems.length) {
      await prisma.menuItem.createMany({
        data: missingItems.map((item) => ({
          slug: item.id,
          categoryId: category.id,
          names: localized(item.nameKey),
          descriptions: localized(item.descriptionKey),
          price: item.price,
          imageUrl: item.image,
          isPopular: ['latte', 'pancakes', 'avocado-toast', 'tiramisu'].includes(item.id),
          sortOrder: items.indexOf(item),
        })),
        skipDuplicates: true,
      })
    }
  }

  if (await prisma.galleryImage.count() === 0) {
    await prisma.galleryImage.createMany({
      data: GALLERY_ITEMS.map((item, index) => ({
        imageUrl: item.image,
        category: item.category,
        captions: localized(item.captionKey),
        altTexts: localized(item.altKey),
        sortOrder: index,
      })),
    })
  }
}
