"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { useTranslation } from "@/components/contexts/i18n-context"
import type { Dish, DishCategory } from "../types"
import { DISH_CATEGORIES } from "../types"

interface AddEditDishModalProps {
  open: boolean
  onClose: () => void
  onSave: (dish: Partial<Dish>) => void
  dish?: Dish | null
  saving?: boolean
}

export function AddEditDishModal({ open, onClose, onSave, dish, saving }: AddEditDishModalProps) {
  const { t } = useTranslation()
  const [name, setName] = useState(dish?.name || "")
  const [description, setDescription] = useState(dish?.description || "")
  const [category, setCategory] = useState<DishCategory>(dish?.category || "main")
  const [isVegetarian, setIsVegetarian] = useState(dish?.is_vegetarian || false)
  const [isVegan, setIsVegan] = useState(dish?.is_vegan || false)
  const [isGlutenFree, setIsGlutenFree] = useState(dish?.is_gluten_free || false)
  const [allergens, setAllergens] = useState(dish?.allergens || "")

  const handleSave = () => {
    if (!name.trim()) return
    onSave({
      id: dish?.id,
      name: name.trim(),
      description: description.trim() || null,
      category,
      is_vegetarian: isVegetarian,
      is_vegan: isVegan,
      is_gluten_free: isGlutenFree,
      allergens: allergens.trim() || null,
    })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-[0.97] data-[state=open]:zoom-in-[0.97] duration-300">
        <DialogHeader>
          <DialogTitle>
            {dish ? t('admin.dishes.editDish') : t('admin.dishes.addDish')}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <div>
            <label className="text-sm font-medium mb-1 block">{t('admin.dishes.name')} *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('admin.dishes.namePlaceholder')}
              autoFocus
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">{t('admin.dishes.description')}</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('admin.dishes.descriptionPlaceholder')}
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">{t('admin.dishes.category')}</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as DishCategory)}
              className="w-full h-9 rounded-md border border-border bg-background px-3 text-sm"
            >
              {DISH_CATEGORIES.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {t(cat.labelKey)}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-3">
            <label className="text-sm font-medium block">{t('admin.dishes.dietaryInfo')}</label>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('admin.dishes.vegetarian')}</span>
              <Switch checked={isVegetarian} onCheckedChange={setIsVegetarian} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('admin.dishes.vegan')}</span>
              <Switch checked={isVegan} onCheckedChange={setIsVegan} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('admin.dishes.glutenFree')}</span>
              <Switch checked={isGlutenFree} onCheckedChange={setIsGlutenFree} />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">{t('admin.dishes.allergens')}</label>
            <Input
              value={allergens}
              onChange={(e) => setAllergens(e.target.value)}
              placeholder={t('admin.dishes.allergensPlaceholder')}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={!name.trim() || saving}>
              {saving ? t('admin.settings.saving') : dish ? t('common.save') : t('common.add')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
