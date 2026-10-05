/**
 * User-facing copy for attachment uploads from generated apps — the single
 * source for both sides of the upload:
 *  - the server proxy imports it (`server/lib/upload_attachment_errors.tsx`,
 *    `server/middleware/error_handler.tsx`);
 *  - `server/generation/workspace.tsx` copies it into every app workspace as
 *    `lib/upload-attachment-messages.tsx`, next to `lib/airtable-hooks.tsx`,
 *    which imports it by relative path.
 * Keep it free of imports: it runs in both the server and generated apps.
 *
 * The messages reach builders (in the preview) and end users of published
 * apps, who have no access to the Canvas chat, so next steps name people they
 * can reach (a base owner, an admin), not Canvas-only controls.
 */

/**
 * Airtable's upload-attachment endpoint accepts files "up to 5 MB"
 * (https://airtable.com/developers/web/api/upload-attachment). Decimal
 * megabytes — the stricter reading — so a file that passes this check is never
 * rejected by Airtable for size.
 */
export const MAX_UPLOAD_ATTACHMENT_BYTES = 5 * 1000 * 1000;

export const UPLOAD_ATTACHMENT_MESSAGES = {
  tooLarge:
    'This file is too large. Files uploaded through this app must be 5 MB or smaller. Try a smaller or compressed version, or upload it directly in the base.',
  forbidden:
    'You need editor permissions on this base to upload files. Ask a base owner or creator to change your access.',
  notFound:
    "This record or field couldn't be found. It may have been deleted or renamed since the app was built.",
  invalidField: "This file can't be added to this field. Make sure it's an attachment field.",
  rateLimited: 'This base is getting too many requests right now. Try again in a moment.',
  airtableFailed:
    "Airtable couldn't complete this upload. Try again in a moment. If it keeps happening with this base, contact your Airtable admin or Airtable Support.",
  /** Shown by the generated-app hook for an unexpected Canvas failure (a generic 500). */
  failed:
    "Something went wrong and your file wasn't uploaded. Try again in a moment. If it keeps happening, contact the app's owner.",
} as const;
