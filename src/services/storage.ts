import { supabase } from '../lib/supabase'
import { fileExtension } from '../lib/utils'

export async function uploadMedia(options: {
  bucket: 'avatars' | 'posts' | 'stories' | 'videos'
  userId: string
  file: File
  onProgress?: (pct: number) => void
}) {
  const path = `${options.userId}/${crypto.randomUUID()}.${fileExtension(options.file)}`
  options.onProgress?.(15)

  const { error } = await supabase.storage.from(options.bucket).upload(path, options.file, {
    cacheControl: '3600',
    upsert: false,
    contentType: options.file.type,
  })
  if (error) throw error
  options.onProgress?.(80)

  const { data } = supabase.storage.from(options.bucket).getPublicUrl(path)
  options.onProgress?.(100)
  return data.publicUrl
}
