import { FeedAttachment, FeedAuthor, FeedComment, FeedPostAggregate, FeedReport } from '../types/feed';
import { AuthUser } from '../types/auth';
import { Profile } from '../types/profile';

const sanitizeBase = (value?: string | null): string => {
  if (!value) return '';
  return value.replace(/\/+$/, '');
};

const inferUploadsBase = (): string => {
  const explicit = sanitizeBase(import.meta.env.VITE_UPLOADS_BASE_URL);
  if (explicit) {
    return explicit;
  }
  const apiBase = import.meta.env.VITE_API_URL ?? '';
  if (apiBase) {
    return sanitizeBase(apiBase.replace(/\/api\/?$/, ''));
  }
  if (typeof window !== 'undefined') {
    return sanitizeBase(window.location.origin);
  }
  return '';
};

const uploadsBase = inferUploadsBase();

export const resolveAssetUrl = (value?: string | null): string | null => {
  if (!value) return null;
  if (/^https?:\/\//i.test(value)) {
    return value;
  }
  if (!uploadsBase) {
    return value;
  }
  const normalizedPath = value.startsWith('/') ? value : `/${value}`;
  return `${uploadsBase}${normalizedPath}`;
};

export const normalizeProfileMedia = <T extends { avatarUrl?: string | null; coverImageUrl?: string | null }>(
  entity: T
): T => ({
  ...entity,
  avatarUrl: resolveAssetUrl(entity.avatarUrl),
  coverImageUrl: resolveAssetUrl(entity.coverImageUrl)
});

export const normalizeAuthUserMedia = (user: AuthUser): AuthUser => normalizeProfileMedia(user);

export const normalizeProfile = (profile: Profile): Profile => normalizeProfileMedia(profile);

export const normalizeFeedAuthor = <T extends FeedAuthor>(author: T): T => ({
  ...author,
  avatarUrl: resolveAssetUrl(author.avatarUrl)
});

export const normalizeFeedAttachment = (attachment: FeedAttachment): FeedAttachment => ({
  ...attachment,
  url: resolveAssetUrl(attachment.url) ?? attachment.url
});

export const normalizeFeedComment = (comment: FeedComment): FeedComment => ({
  ...comment,
  author: normalizeFeedAuthor(comment.author)
});

export const normalizeFeedPost = (post: FeedPostAggregate): FeedPostAggregate => ({
  ...post,
  author: normalizeFeedAuthor(post.author),
  attachments: (post.attachments ?? []).map((attachment) => normalizeFeedAttachment(attachment)),
  latestComments: (post.latestComments ?? []).map((comment) => normalizeFeedComment(comment))
});

export const normalizeFeedReport = (report: FeedReport): FeedReport => ({
  ...report,
  reporter: normalizeFeedAuthor(report.reporter),
  post: {
    ...report.post,
    mediaUrl: report.post.mediaUrl ? resolveAssetUrl(report.post.mediaUrl) : null,
    author: normalizeFeedAuthor(report.post.author)
  }
});
