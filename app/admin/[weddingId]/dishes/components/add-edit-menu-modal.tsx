"use client"

import { useState, useEffect, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useTranslation } from "@/components/contexts/i18n-context"
import { useImageUpload } from "@/hooks/use-image-upload"
import { X, Upload, UtensilsCrossed } from "lucide-react"
import type { Menu, MenuCourse } from "../types"
import { DEFAULT_COURSE_NAME_KEYS } from "../types"
import Image from "next/image"

export interface MenuSavePayload {
  id?: string
  name: string
  description: string | null
  image_url: string | null
  courses_count: number
  courses: Array<{ course_number: number; course_name: string | null; dish_name: string | null }>
}

interface AddEditMenuModalProps {
  open: boolean
  onClose: () => void
  onSave: (menu: MenuSavePayload) => void
  menu?: Menu | null
  saving?: boolean
}

export function AddEditMenuModal({ open, onClose, onSave, menu, saving }: AddEditMenuModalProps) {
  const { t } = useTranslation()
  const { uploadImage, uploading: imageUploading } = useImageUpload()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [coursesCount, setCoursesCount] = useState(3)
  const [courses, setCourses] = useState<{ course_number: number; course_name: string; dish_name: string }[]>([])

  useEffect(() => {
    if (open) {
      setName(menu?.name || "")
      setDescription(menu?.description || "")
      setImageUrl(menu?.image_url || null)
      const count = menu?.courses_count || 3
      setCoursesCount(count)
      initCourses(count, menu?.courses)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, menu])

  const initCourses = (count: number, existingCourses?: MenuCourse[]) => {
    const keys = DEFAULT_COURSE_NAME_KEYS[count] || []
    setCourses(
      Array.from({ length: count }, (_, i) => {
        const existing = existingCourses?.find(c => c.course_number === i + 1)
        return {
          course_number: i + 1,
          course_name: existing?.course_name ?? (keys[i] ? t(keys[i]) : `${t('admin.dishes.course')} ${i + 1}`),
          dish_name: existing?.dish_name ?? "",
        }
      })
    )
  }

  const handleCoursesCountChange = (count: number) => {
    setCoursesCount(count)
    initCourses(count, menu?.courses)
  }

  const updateCourse = (index: number, field: 'course_name' | 'dish_name', value: string) => {
    setCourses(prev => prev.map((c, i) => i === index ? { ...c, [field]: value } : c))
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const result = await uploadImage(file)
    if (result) setImageUrl(result.url)
  }

  const handleSave = () => {
    if (!name.trim()) return
    onSave({
      id: menu?.id,
      name: name.trim(),
      description: description.trim() || null,
      image_url: imageUrl,
      courses_count: coursesCount,
      courses: courses.map(c => ({
        course_number: c.course_number,
        course_name: c.course_name.trim() || null,
        dish_name: c.dish_name.trim() || null,
      })),
    })
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-[0.97] data-[state=open]:zoom-in-[0.97] duration-300">
        <DialogHeader>
          <DialogTitle>
            {menu ? t('admin.dishes.editMenu') : t('admin.dishes.addMenu')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Name */}
          <div>
            <label className="text-sm font-medium mb-1 block">{t('admin.dishes.menuName')} *</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('admin.dishes.menuNamePlaceholder')}
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium mb-1 block">{t('admin.dishes.menuDescription')}</label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('admin.dishes.menuDescriptionPlaceholder')}
            />
          </div>

          {/* Image upload */}
          <div>
            <label className="text-sm font-medium mb-2 block">{t('admin.dishes.menuImage')}</label>
            {imageUrl ? (
              <div className="relative rounded-lg overflow-hidden border border-border h-36 bg-muted">
                <Image src={imageUrl} alt="Menu" fill className="object-cover" />
                <button
                  onClick={() => setImageUrl(null)}
                  className="absolute top-2 right-2 bg-black/60 hover:bg-black/80 text-white rounded-full p-1 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={imageUploading}
                className="w-full h-36 rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-muted/50 flex flex-col items-center justify-center gap-2 text-muted-foreground transition-colors"
              >
                {imageUploading ? (
                  <div className="animate-spin w-5 h-5 border-2 border-primary border-t-transparent rounded-full" />
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    <span className="text-sm">{t('common.upload')}</span>
                  </>
                )}
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          </div>

          {/* Courses count */}
          <div>
            <label className="text-sm font-medium mb-2 block">{t('admin.dishes.coursesCount')}</label>
            <div className="flex gap-2">
              {[2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => handleCoursesCountChange(n)}
                  className={`flex-1 py-2 rounded-md border text-sm font-medium transition-colors ${
                    coursesCount === n
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border bg-background text-foreground hover:bg-muted/50'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Course slots — just two text fields each: course label + dish name */}
          <div className="space-y-3">
            {courses.map((course, index) => (
              <div key={course.course_number} className="rounded-lg border border-border p-3 space-y-2 bg-muted/20">
                <div className="flex items-center gap-2">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">
                    {course.course_number}
                  </span>
                  <Input
                    value={course.course_name}
                    onChange={(e) => updateCourse(index, 'course_name', e.target.value)}
                    placeholder={t('admin.dishes.courseNamePlaceholder')}
                    className="h-8 text-sm"
                  />
                </div>
                <div className="flex items-center gap-2 pl-8">
                  <UtensilsCrossed className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <Input
                    value={course.dish_name}
                    onChange={(e) => updateCourse(index, 'dish_name', e.target.value)}
                    placeholder={t('admin.dishes.dishNamePlaceholder')}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" onClick={onClose} disabled={saving}>
              {t('common.cancel')}
            </Button>
            <Button onClick={handleSave} disabled={!name.trim() || saving || imageUploading}>
              {saving ? t('admin.settings.saving') : menu ? t('common.save') : t('common.add')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
