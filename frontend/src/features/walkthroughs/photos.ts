import { dataOrThrow, requireSupabase } from '@/shared/api/supabase'

export const photoBucket = 'store-inspection-photos'
export const maxPhotoBytes = 2_000_000
export const maxPhotosPerVisit = 60
const maxSide = 1400

export type InspectionPhoto = {
  photo_id: string
  question_key: string
  storage_path: string
  content_sha256: string
  mime_type: string
  byte_size: number
  created_at: string
}

export async function listInspectionPhotos(organizationId: string, inspectionId: string): Promise<InspectionPhoto[]> {
  const { data, error } = await requireSupabase().rpc('list_store_inspection_photos', {
    p_organization_id: organizationId, p_inspection_id: inspectionId, p_question_key: null,
  })
  return dataOrThrow(data as InspectionPhoto[] | null, error)
}

async function prepareImage(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/')) throw new Error('Choose an image from your camera or photo library.')
  if (['image/jpeg', 'image/png', 'image/webp'].includes(file.type) && file.size <= maxPhotoBytes) return file
  let image: ImageBitmap
  try { image = await createImageBitmap(file) }
  catch { throw new Error('This photo format could not be opened. Choose a JPEG, PNG, or WebP image.') }
  try {
    const scale = Math.min(1, maxSide / Math.max(image.width, image.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.width * scale))
    canvas.height = Math.max(1, Math.round(image.height * scale))
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Photo processing is not available in this browser.')
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    for (const quality of [0.7, 0.5, 0.35]) {
      const compressed = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
      if (compressed && compressed.size <= maxPhotoBytes) return compressed
    }
    throw new Error('The photo is still over 2 MB after resizing. Choose a smaller image.')
  } finally { image.close() }
}

async function digest(blob: Blob): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', await blob.arrayBuffer())
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function uploadInspectionPhoto(organizationId: string, inspectionId: string, questionKey: string, file: File, existing: InspectionPhoto[]): Promise<InspectionPhoto[]> {
  if (existing.length >= maxPhotosPerVisit) throw new Error('This visit already has 60 photos.')
  const blob = await prepareImage(file)
  const hash = await digest(blob)
  if (existing.some((photo) => photo.question_key === questionKey && photo.content_sha256 === hash)) return existing
  const safeKey = questionKey.replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 60) || 'photo'
  const path = `${organizationId}/${inspectionId}/${safeKey}/${hash}.${blob.type === 'image/png' ? 'png' : blob.type === 'image/webp' ? 'webp' : 'jpg'}`
  const storage = requireSupabase().storage.from(photoBucket)
  const uploaded = await storage.upload(path, blob, { contentType: blob.type, upsert: false })
  if (uploaded.error) throw new Error(uploaded.error.message)
  const { error } = await requireSupabase().rpc('register_store_inspection_photo', {
    p_organization_id: organizationId, p_inspection_id: inspectionId,
    p_question_key: questionKey, p_storage_path: path, p_content_sha256: hash,
    p_mime_type: blob.type, p_byte_size: blob.size,
  })
  if (error) {
    await storage.remove([path])
    throw new Error(error.message)
  }
  return listInspectionPhotos(organizationId, inspectionId)
}

export async function removeInspectionPhoto(organizationId: string, inspectionId: string, photo: InspectionPhoto): Promise<InspectionPhoto[]> {
  const { error } = await requireSupabase().rpc('delete_store_inspection_photo', {
    p_organization_id: organizationId, p_inspection_id: inspectionId, p_photo_id: photo.photo_id,
  })
  if (error) throw new Error(error.message)
  const removed = await requireSupabase().storage.from(photoBucket).remove([photo.storage_path])
  if (removed.error) throw new Error(`Photo reference was removed, but storage cleanup failed: ${removed.error.message}`)
  return listInspectionPhotos(organizationId, inspectionId)
}

export async function downloadInspectionPhoto(photo: InspectionPhoto): Promise<Blob> {
  const { data, error } = await requireSupabase().storage.from(photoBucket).download(photo.storage_path)
  return dataOrThrow(data, error)
}
