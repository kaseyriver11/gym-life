import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { Capacitor } from '@capacitor/core'
import { Directory, Filesystem } from '@capacitor/filesystem'
import { Preferences } from '@capacitor/preferences'

/**
 * Progress photos live ONLY on this phone: image files in the app's private
 * data folder, plus a small index in Preferences. Nothing is uploaded to
 * Firebase — more private, and the free Firebase plan has no file storage.
 * Uninstalling the app deletes them, so the Photos card says so.
 */

export type Pose = 'front' | 'side' | 'back'
export const POSES: Pose[] = ['front', 'side', 'back']

export interface ProgressPhoto {
  id: string
  date: string
  pose: Pose
  /** Path inside Directory.Data. */
  path: string
}

const INDEX_KEY = 'progressPhotos'
const FOLDER = 'progress-photos'

export function photosAvailable() {
  return Capacitor.isNativePlatform()
}

export async function listPhotos(): Promise<ProgressPhoto[]> {
  const { value } = await Preferences.get({ key: INDEX_KEY })
  try {
    return value ? (JSON.parse(value) as ProgressPhoto[]) : []
  } catch {
    return []
  }
}

async function saveIndex(photos: ProgressPhoto[]) {
  await Preferences.set({ key: INDEX_KEY, value: JSON.stringify(photos) })
}

/** Take (or pick) a photo and store it for `date`/`pose`, replacing any
 * existing one for that slot. Resolves null if the user cancels. */
export async function capturePhoto(date: string, pose: Pose): Promise<ProgressPhoto | null> {
  let base64: string | undefined
  try {
    const photo = await Camera.getPhoto({
      source: CameraSource.Prompt,
      resultType: CameraResultType.Base64,
      quality: 80,
      width: 1200,
      correctOrientation: true,
      promptLabelHeader: `${pose[0].toUpperCase()}${pose.slice(1)} photo`,
    })
    base64 = photo.base64String
  } catch {
    return null // cancelled
  }
  if (!base64) return null

  const id = `${date}-${pose}-${Date.now()}`
  const path = `${FOLDER}/${id}.jpg`
  await Filesystem.writeFile({ path, data: base64, directory: Directory.Data, recursive: true })

  const photos = await listPhotos()
  const replaced = photos.filter((p) => p.date === date && p.pose === pose)
  for (const old of replaced) await Filesystem.deleteFile({ path: old.path, directory: Directory.Data }).catch(() => {})
  const entry: ProgressPhoto = { id, date, pose, path }
  await saveIndex([...photos.filter((p) => !replaced.includes(p)), entry])
  return entry
}

export async function deletePhoto(photo: ProgressPhoto) {
  await Filesystem.deleteFile({ path: photo.path, directory: Directory.Data }).catch(() => {})
  await saveIndex((await listPhotos()).filter((p) => p.id !== photo.id))
}

/** A URL the WebView can show in an <img>. */
export async function photoSrc(photo: ProgressPhoto): Promise<string> {
  const { uri } = await Filesystem.getUri({ path: photo.path, directory: Directory.Data })
  return Capacitor.convertFileSrc(uri)
}
