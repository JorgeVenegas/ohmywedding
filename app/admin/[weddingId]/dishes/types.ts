export interface Dish {
  id: string
  wedding_id: string
  name: string
  description: string | null
  category: DishCategory
  is_vegetarian: boolean
  is_vegan: boolean
  is_gluten_free: boolean
  allergens: string | null
  display_order: number
  created_at: string
  updated_at: string
}

export type DishCategory = 'appetizer' | 'soup' | 'salad' | 'main' | 'dessert' | 'drink' | 'other'

export interface Menu {
  id: string
  wedding_id: string
  name: string
  description: string | null
  image_url: string | null
  courses_count: number
  display_order: number
  created_at: string
  updated_at: string
  courses?: MenuCourse[]
}

export interface MenuCourse {
  id: string
  menu_id: string
  course_number: number
  course_name: string | null
  dish_name: string | null
}

export interface MenuAssignment {
  id: string
  wedding_id: string
  guest_id: string
  menu_id: string
  created_at: string
  guests?: { id: string; name: string }
  menus?: { id: string; name: string }
}

export const DISH_CATEGORIES: { value: DishCategory; labelKey: string }[] = [
  { value: 'appetizer', labelKey: 'admin.dishes.categories.appetizer' },
  { value: 'soup', labelKey: 'admin.dishes.categories.soup' },
  { value: 'salad', labelKey: 'admin.dishes.categories.salad' },
  { value: 'main', labelKey: 'admin.dishes.categories.main' },
  { value: 'dessert', labelKey: 'admin.dishes.categories.dessert' },
  { value: 'drink', labelKey: 'admin.dishes.categories.drink' },
  { value: 'other', labelKey: 'admin.dishes.categories.other' },
]

export const CATEGORY_COLORS: Record<DishCategory, string> = {
  appetizer: 'bg-orange-100 text-orange-700',
  soup: 'bg-amber-100 text-amber-700',
  salad: 'bg-green-100 text-green-700',
  main: 'bg-blue-100 text-blue-700',
  dessert: 'bg-pink-100 text-pink-700',
  drink: 'bg-purple-100 text-purple-700',
  other: 'bg-gray-100 text-gray-700',
}

/** i18n key paths for default course names per courses_count */
export const DEFAULT_COURSE_NAME_KEYS: Record<number, string[]> = {
  2: ['admin.dishes.defaultCourses.mainCourse', 'admin.dishes.defaultCourses.dessert'],
  3: ['admin.dishes.defaultCourses.starter', 'admin.dishes.defaultCourses.mainCourse', 'admin.dishes.defaultCourses.dessert'],
  4: ['admin.dishes.defaultCourses.soupSalad', 'admin.dishes.defaultCourses.starter', 'admin.dishes.defaultCourses.mainCourse', 'admin.dishes.defaultCourses.dessert'],
  5: ['admin.dishes.defaultCourses.appetizer', 'admin.dishes.defaultCourses.soupSalad', 'admin.dishes.defaultCourses.starter', 'admin.dishes.defaultCourses.mainCourse', 'admin.dishes.defaultCourses.dessert'],
}
