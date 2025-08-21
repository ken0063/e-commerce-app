import { supabase } from './client'

export type UploadOptions = {
  cacheControl?: string | number
  upsert?: boolean
  contentType?: string
  expiresIn?: number // seconds, for signed URL
}

export type UploadResult = {
  path: string
  signedUrl?: string
}

// Uploads a file/blob/buffer to the `products` bucket and optionally returns a signed URL
export async function uploadProductImage(
  key: string,
  file: File | Blob | ArrayBuffer | Buffer,
  options: UploadOptions = {},
): Promise<UploadResult> {
  const { cacheControl = '3600', upsert = false, contentType, expiresIn = 60 } = options

  // Infer contentType if possible when not provided
  const inferredContentType = contentType ?? inferContentType(file, key)

  const { data, error } = await supabase.storage.from('products').upload(key, file as File, {
    cacheControl: String(cacheControl),
    upsert,
    contentType: inferredContentType,
  })

  if (error) throw error

  const path = data?.path ?? key

  // Try to create a signed URL (useful when bucket is private). If the bucket is public,
  // you can ignore this or use getPublicUrl below.
  const { data: signed, error: signedErr } = await supabase.storage
    .from('products')
    .createSignedUrl(path, expiresIn)

  // If signed URL creation fails (e.g., public bucket or policy), just return the path
  return {
    path,
    signedUrl: signedErr ? undefined : signed?.signedUrl,
  }
}

// Generates a signed URL for an existing object in the `products` bucket
export async function createProductSignedUrl(key: string, expiresIn = 60): Promise<string> {
  const { data, error } = await supabase.storage.from('products').createSignedUrl(key, expiresIn)

  if (error) throw error
  return data.signedUrl
}

// For public buckets: get a public URL that can be used directly in <img src="..." />
export function getProductPublicUrl(key: string): string {
  const { data } = supabase.storage.from('products').getPublicUrl(key)
  return data.publicUrl
}

function inferContentType(
  file: File | Blob | ArrayBuffer | Buffer,
  keyFallback: string,
): string | undefined {
  // If it's a File or Blob with a type
  if (typeof File !== 'undefined' && file instanceof File && file.type) return file.type
  if (typeof Blob !== 'undefined' && file instanceof Blob && (file as Blob).type)
    return (file as Blob).type

  // Infer from file extension
  const ext = keyFallback.split('.').pop()?.toLowerCase()
  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'png':
      return 'image/png'
    case 'webp':
      return 'image/webp'
    case 'gif':
      return 'image/gif'
    default:
      return undefined
  }
}
